package main

import (
	"log/slog"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"
	"github.com/studed/api-gateway/graph"
	"github.com/studed/api-gateway/internal/client"
	"github.com/studed/api-gateway/internal/config"
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

	contentClient, err := client.NewContentClient(cfg.ContentServiceAddr)
	if err != nil {
		log.Error("failed to connect to content service", slog.Any("error", err))
		os.Exit(1)
	}
	defer contentClient.Close()

	uploadClient, err := client.NewUploadClient(cfg.UploadServiceAddr)
	if err != nil {
		log.Error("failed to connect to upload service", slog.Any("error", err))
		os.Exit(1)
	}
	defer uploadClient.Close()

	resolver := &graph.Resolver{
		AuthClient:         authClient,
		CourseClient:       courseClient,
		ProgressClient:     progressClient,
		GamificationClient: gamificationClient,
		ContentClient:      contentClient,
		UploadClient:       uploadClient,
	}
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

	uploadProxy := newUploadProxy(cfg.UploadServiceHTTPAddr)
	r.Handle("/api/v1/uploads", uploadProxy)
	r.Handle("/uploads/*", uploadProxy)

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

func newUploadProxy(uploadServiceAddr string) http.HandlerFunc {
	targetURL, err := url.Parse("http://" + uploadServiceAddr)
	if err != nil {
		panic(err)
	}

	proxy := httputil.NewSingleHostReverseProxy(targetURL)
	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)

		if strings.HasPrefix(req.URL.Path, "/api/v1/uploads") {
			req.URL.Path = strings.Replace(req.URL.Path, "/api/v1/uploads", "/api/uploads", 1)
		}

		if userCtx, ok := authmiddleware.UserFromContext(req.Context()); ok {
			req.Header.Set("X-Studed-User-Id", userCtx.UserID)
			req.Header.Set("X-Studed-User-Role", userCtx.Role)
		}
	}

	return proxy.ServeHTTP
}
