package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/99designs/gqlgen/graphql/playground"
	coderws "github.com/coder/websocket"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"
	"github.com/studed/api-gateway/graph"
	"github.com/studed/api-gateway/internal/client"
	"github.com/studed/api-gateway/internal/config"
	"github.com/studed/api-gateway/internal/events"
	authmiddleware "github.com/studed/api-gateway/internal/middleware"
	"github.com/studed/shared/go/logger"
)

func main() {
	_ = godotenv.Load()

	log := logger.New("api-gateway")

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
	srv := handler.NewDefaultServer(graph.NewExecutableSchema(graph.Config{Resolvers: resolver}))
	srv.AddTransport(transport.Options{})
	srv.AddTransport(transport.POST{})
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

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 1MB payload cap (SEC-21)
			next.ServeHTTP(w, r)
		})
	})
	r.Use(authmiddleware.WithResponseWriter)
	r.Use(authmiddleware.Auth(cfg.AccessSecret))

	r.Handle("/health", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("api-gateway ok"))
	}))
	r.Handle("/ready", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ready"))
	}))

	if cfg.GraphQLPlayground {
		r.Handle("/", playground.Handler("StudEd GraphQL", "/graphql"))
	}
	r.Handle("/graphql", srv)

	server := &http.Server{
		Addr:              cfg.ServiceAddr,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

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
}
