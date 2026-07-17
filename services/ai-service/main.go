package main

import (
	"log/slog"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"github.com/studed/ai-service/internal/config"
	"github.com/studed/ai-service/internal/gemini"
	"github.com/studed/ai-service/internal/handler"
	"github.com/studed/shared/go/logger"
)

func main() {
	_ = godotenv.Load()

	log := logger.New("ai-service")

	cfg, err := config.Load()
	if err != nil {
		log.Error("failed to load config", slog.Any("error", err))
		os.Exit(1)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ai-service ok"))
	})

	if cfg.GeminiAPIKey == "" {
		log.Warn("GEMINI_API_KEY is not set; AI endpoints will return 503")
		mux.HandleFunc("/v1/", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusServiceUnavailable)
			_, _ = w.Write([]byte(`{"error":"AI is not configured: set GEMINI_API_KEY"}`))
		})
	} else {
		aiClient := gemini.NewClient(cfg.GeminiAPIKey, cfg.GeminiModel)
		h := handler.New(aiClient, log)
		h.Register(mux)
	}

	log.Info("ai-service listening", slog.String("addr", cfg.ServiceAddr), slog.String("model", cfg.GeminiModel))
	if err := http.ListenAndServe(cfg.ServiceAddr, mux); err != nil {
		log.Error("server failed", slog.Any("error", err))
		os.Exit(1)
	}
}
