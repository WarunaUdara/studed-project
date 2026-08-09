package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/99designs/gqlgen/graphql"
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/99designs/gqlgen/graphql/playground"
	coderws "github.com/coder/websocket"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
	"github.com/studed/api-gateway/graph"
	"github.com/studed/api-gateway/internal/client"
	"github.com/studed/api-gateway/internal/config"
	"github.com/studed/api-gateway/internal/events"
	gwhandler "github.com/studed/api-gateway/internal/handler"
	authmiddleware "github.com/studed/api-gateway/internal/middleware"
	"github.com/studed/shared/go/logger"
	"github.com/studed/shared/go/metrics"
	"github.com/studed/shared/go/otel"
	"github.com/vektah/gqlparser/v2/gqlerror"
)

func main() {
	_ = godotenv.Load()

	log := logger.New("api-gateway")

	tracerShutdown, err := otel.SetupTracerProvider(otel.TracerProviderConfig{
		ServiceName:    "api-gateway",
		Environment:    otel.Env("APP_ENV", "development"),
		SampleFraction: 1.0,
	})
	if err != nil {
		log.Error("failed to init tracer provider", slog.Any("error", err))
		os.Exit(1)
	}

	cfg, err := config.Load()
	if err != nil {
		log.Error("failed to load config", slog.Any("error", err))
		os.Exit(1)
	}

	authClient, err := client.NewAuthClient(cfg.AuthServiceAddr, cfg.ServiceToken)
	if err != nil {
		log.Error("failed to connect to auth service", slog.Any("error", err))
		os.Exit(1)
	}
	defer authClient.Close()

	courseClient, err := client.NewCourseClient(cfg.CourseServiceAddr, cfg.ServiceToken)
	if err != nil {
		log.Error("failed to connect to course service", slog.Any("error", err))
		os.Exit(1)
	}
	defer courseClient.Close()

	progressClient, err := client.NewProgressClient(cfg.ProgressServiceAddr, courseClient, cfg.ServiceToken)
	if err != nil {
		log.Error("failed to connect to progress service", slog.Any("error", err))
		os.Exit(1)
	}
	defer progressClient.Close()

	gamificationClient, err := client.NewGamificationClient(cfg.GamificationServiceAddr, cfg.ServiceToken)
	if err != nil {
		log.Error("failed to connect to gamification service", slog.Any("error", err))
		os.Exit(1)
	}
	defer gamificationClient.Close()

	eventBus := events.NewBus(cfg.RedisAddr, log)
	aiClient := client.NewAIClient(cfg.AIServiceURL)
	paymentClient := client.NewPaymentClient(cfg.PaymentServiceURL, cfg.ServiceToken)

	resolver := &graph.Resolver{
		AuthClient:         authClient,
		CourseClient:       courseClient,
		ProgressClient:     progressClient,
		GamificationClient: gamificationClient,
		AIClient:           aiClient,
		PaymentClient:      paymentClient,
		Events:             eventBus,
	}
	srv := handler.New(graph.NewExecutableSchema(graph.Config{Resolvers: resolver}))
	srv.AddTransport(transport.Options{})
	// GET transport enables GraphQL queries over HTTP GET (urql and TanStack
	// Router prefetch issue GET requests); without it every data query returns
	// 400 "transport not supported" and the app cannot browse any data.
	srv.AddTransport(transport.GET{})
	srv.AddTransport(transport.POST{})
	srv.AddTransport(transport.MultipartForm{})
	srv.AddTransport(transport.Websocket{
		KeepAlivePingInterval: 10 * time.Second,
		// Auth is enforced per subscription via the session cookie the Auth
		// middleware parsed during the HTTP upgrade. Cross-origin sockets are
		// rejected: only the frontend origin may open a websocket.
		Implementation: transport.CoderWebsocketImplementation{
			AcceptOptions: coderws.AcceptOptions{
				OriginPatterns: []string{
					"https://studed-project-frontend.pages.dev",
					"https://*.pages.dev",
					"http://localhost:*",
					"https://localhost:*",
					"http://127.0.0.1:*",
				},
			},
		},
	})
	// Bound query breadth so a single request cannot exhaust gateway CPU.
	srv.Use(extension.FixedComplexityLimit(200))
	if cfg.GraphQLPlayground {
		srv.Use(extension.Introspection{})
	}

	srv.SetErrorPresenter(func(ctx context.Context, e error) *gqlerror.Error {
		err := graphql.DefaultErrorPresenter(ctx, e)
		if err != nil {
			log.Error("graphql error", slog.String("message", err.Message), slog.Any("path", err.Path))
		}
		return err
	})

	rdb := redis.NewClient(&redis.Options{
		Addr: cfg.RedisAddr,
		// Command-level retries with exponential backoff so transient Redis
		// blips do not surface as 429s or dropped requests.
		MaxRetries:      5,
		MinRetryBackoff: 100 * time.Millisecond,
		MaxRetryBackoff: 2 * time.Second,
		DialTimeout:     2 * time.Second,
		ReadTimeout:     2 * time.Second,
		WriteTimeout:    2 * time.Second,
	})
	rateLimiter := authmiddleware.NewRateLimiter(rdb)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 1MB payload cap (SEC-21)
			// Request timeout. AI generation (learn blocks, visualizations,
			// agent runs) can take 20-90s, so the default is generous; set
			// REQUEST_TIMEOUT_SECONDS to tighten it (e.g. 15 in production).
			// The AI chat stream is exempt: it is long-lived by design and
			// terminates when the agent finishes or the client disconnects.
			if r.URL.Path == "/ai/chat" {
				next.ServeHTTP(w, r)
				return
			}
			timeout := time.Duration(envInt("REQUEST_TIMEOUT_SECONDS", 100)) * time.Second
			ctx, cancel := context.WithTimeout(r.Context(), timeout)
			defer cancel()
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	})
	r.Use(metrics.HTTPMiddleware("api-gateway"))
	r.Use(authmiddleware.WithResponseWriter)
	r.Use(authmiddleware.Auth(cfg.AccessSecret))
	r.Use(rateLimiter.RateLimit())

	r.Handle("/metrics", metrics.Handler())
	r.Handle("/health", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("api-gateway ok"))
	}))
	r.Handle("/ready", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ready"))
	}))

	// Educator AI assistant: streams agent events (SSE) from the ai-service
	// to the wave editor chat panel. Educator-only (enforced in the handler).
	aiChatProxy := gwhandler.NewAIChatProxy(cfg.AIServiceURL)
	r.Handle("/ai/chat", aiChatProxy)

	if cfg.GraphQLPlayground {
		r.Handle("/", playground.Handler("StudEd GraphQL", "/graphql"))
	}
	r.Handle("/graphql", srv)

	server := &http.Server{
		Addr:              cfg.ServiceAddr,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       30 * time.Second,
		// WriteTimeout is disabled: the AI chat stream (/ai/chat) is long-lived
		// by design and the agent may stream for minutes. Non-stream routes are
		// bounded by the per-request context timeout middleware instead.
		WriteTimeout: 0,
		IdleTimeout:  120 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go rateLimiter.StartReconnectLoop(ctx)

	go func() {
		log.Info("api-gateway listening", slog.String("addr", cfg.ServiceAddr))
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("server failed", slog.Any("error", err))
		}
	}()

	<-ctx.Done()
	log.Info("shutting down api-gateway gracefully...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Error("api-gateway forced to shutdown", slog.Any("error", err))
	} else {
		log.Info("api-gateway shutdown complete")
	}

	if err := tracerShutdown(shutdownCtx); err != nil {
		log.Error("failed to flush tracer", slog.Any("error", err))
	}
}

// envInt reads a positive integer from the environment, falling back to the
// provided default when unset, empty, or invalid.
func envInt(key string, fallback int) int {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil || n <= 0 {
		return fallback
	}
	return n
}
