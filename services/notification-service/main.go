package main

import (
	"log/slog"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"github.com/studed/notification-service/internal/handler"
	"github.com/studed/notification-service/internal/model"
	"github.com/studed/shared/go/logger"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	_ = godotenv.Load()

	log := logger.New("notification-service")

	databaseURL := getEnv("DATABASE_URL", "postgres://studed:studed@localhost:5433/studed?sslmode=disable")
	serviceAddr := getEnv("NOTIFICATION_SERVICE_ADDR", ":8092")

	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
	if err != nil {
		log.Error("failed to connect to database", slog.Any("error", err))
		os.Exit(1)
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

	log.Info("notification-service listening", slog.String("addr", serviceAddr))
	if err := http.ListenAndServe(serviceAddr, mux); err != nil {
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
