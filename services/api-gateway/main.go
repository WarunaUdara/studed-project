package main

import (
	"log/slog"
	"net/http"
	"os"
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

	authClient, err := client.NewAuthClient(cfg.AuthServiceAddr)
	if err != nil {
		log.Error("failed to connect to auth service", slog.Any("error", err))
		os.Exit(1)
	}
	defer authClient.Close()

	courseClient, err := client.NewCourseClient(cfg.CourseServiceAddr)
	if err != nil {
		log.Error("failed to connect to course service", slog.Any("error", err))
		os.Exit(1)
	}
	defer courseClient.Close()

	progressClient, err := client.NewProgressClient(cfg.ProgressServiceAddr, courseClient)
	if err != nil {
		log.Error("failed to connect to progress service", slog.Any("error", err))
		os.Exit(1)
	}
	defer progressClient.Close()

	gamificationClient, err := client.NewGamificationClient(cfg.GamificationServiceAddr)
	if err != nil {
		log.Error("failed to connect to gamification service", slog.Any("error", err))
		os.Exit(1)
	}
	defer gamificationClient.Close()

	eventBus := events.NewBus(cfg.RedisAddr, log)
	aiClient := client.NewAIClient(cfg.AIServiceURL)
	paymentClient := client.NewPaymentClient(cfg.PaymentServiceURL)

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
	srv.AddTransport(transport.GET{})
	srv.AddTransport(transport.POST{})
	srv.AddTransport(transport.Websocket{
		KeepAlivePingInterval: 10 * time.Second,
		// Auth is enforced per subscription via the session cookie the Auth
		// middleware parsed during the HTTP upgrade; origins are not
		// restricted because the gateway is fronted by CORS middleware.
		Implementation: transport.CoderWebsocketImplementation{
			AcceptOptions: coderws.AcceptOptions{InsecureSkipVerify: true},
		},
	})
	if cfg.GraphQLPlayground {
		srv.Use(extension.Introspection{})
	}

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
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

	log.Info("api-gateway listening", slog.String("addr", cfg.ServiceAddr))
	if err := http.ListenAndServe(cfg.ServiceAddr, r); err != nil {
		log.Error("server failed", slog.Any("error", err))
		os.Exit(1)
	}
}
