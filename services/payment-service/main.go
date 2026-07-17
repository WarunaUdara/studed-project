package main

import (
	"log/slog"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"github.com/studed/payment-service/internal/handler"
	"github.com/studed/payment-service/internal/model"
	"github.com/studed/payment-service/internal/payhere"
	"github.com/studed/shared/go/logger"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	_ = godotenv.Load()

	log := logger.New("payment-service")

	databaseURL := getEnv("DATABASE_URL", "postgres://studed:studed@localhost:5433/studed?sslmode=disable")
	serviceAddr := getEnv("PAYMENT_SERVICE_ADDR", ":8091")

	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
	if err != nil {
		log.Error("failed to connect to database", slog.Any("error", err))
		os.Exit(1)
	}

	if err := db.AutoMigrate(&model.Subscription{}); err != nil {
		log.Error("failed to run migrations", slog.Any("error", err))
		os.Exit(1)
	}

	phConfig := payhere.Config{
		MerchantID:     os.Getenv("PAYHERE_MERCHANT_ID"),
		MerchantSecret: os.Getenv("PAYHERE_MERCHANT_SECRET"),
		NotifyURL:      os.Getenv("PAYHERE_NOTIFY_URL"),
	}
	if !phConfig.Enabled() {
		log.Warn("payhere credentials not set; subscriptions run in manual mode")
	}

	h := handler.New(db, phConfig, log)

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("payment-service ok"))
	})
	h.Register(mux)

	log.Info("payment-service listening", slog.String("addr", serviceAddr))
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
