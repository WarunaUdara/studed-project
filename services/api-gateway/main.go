package main

import (
	"log/slog"
	"net/http"
	"os"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/studed/api-gateway/graph"
	"github.com/studed/api-gateway/internal/client"
	"github.com/studed/api-gateway/internal/config"
	authmiddleware "github.com/studed/api-gateway/internal/middleware"
	"github.com/studed/shared/go/logger"
)

func main() {
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

	resolver := &graph.Resolver{AuthClient: authClient}
	srv := handler.NewDefaultServer(graph.NewExecutableSchema(graph.Config{Resolvers: resolver}))
	srv.AddTransport(transport.Options{})
	srv.AddTransport(transport.GET{})
	srv.AddTransport(transport.POST{})
	srv.Use(extension.Introspection{})

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
