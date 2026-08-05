package main

import (
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"github.com/studed/notification-service/internal/handler"
	"github.com/studed/notification-service/internal/model"
	"github.com/studed/shared/go/httpauth"
	"github.com/studed/shared/go/logger"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	_ = godotenv.Load()

	log := logger.New("notification-service")

	databaseURL := getEnv("DATABASE_URL", "postgres://studed:studed@localhost:5433/studed?sslmode=disable")
	serviceAddr := getEnv("NOTIFICATION_SERVICE_ADDR", ":8092")
	serviceToken := os.Getenv("NOTIFICATION_SERVICE_TOKEN")

	var db *gorm.DB
	var err error
	for attempt := 1; attempt <= 15; attempt++ {
		db, err = gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
		if err == nil {
			break
		}
		if attempt == 15 {
			log.Error("failed to connect to database after 15 attempts", slog.Any("error", err))
			os.Exit(1)
		}
		log.Warn("database connection pending, retrying...", slog.Int("attempt", attempt), slog.Any("error", err))
		time.Sleep(1 * time.Second)
	}

	if err := db.AutoMigrate(&model.Notification{}); err != nil {
		log.Error("failed to run migrations", slog.Any("error", err))
		os.Exit(1)
	}

	h := handler.New(db, log)

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("notification-service ok"))
	})
	h.Register(mux)

	var protected http.Handler = mux
	if serviceToken != "" {
		protected = httpauth.ServiceTokenMiddleware(serviceToken)(mux)
	} else {
		log.Warn("NOTIFICATION_SERVICE_TOKEN not set; internal routes are unprotected")
	}

	log.Info("notification-service listening", slog.String("addr", serviceAddr))
	server := &http.Server{
		Addr: serviceAddr,
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if strings.TrimRight(r.URL.Path, "/") == "/health" {
				mux.ServeHTTP(w, r)
				return
			}
			protected.ServeHTTP(w, r)
		}),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	if err := server.ListenAndServe(); err != nil {
		log.Error("server failed", slog.Any("error", err))
		os.Exit(1)
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
