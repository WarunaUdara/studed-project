package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

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

	server := &http.Server{
		Addr:              cfg.ServiceAddr,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       90 * time.Second,
		WriteTimeout:      90 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		log.Info("ai-service listening", slog.String("addr", cfg.ServiceAddr), slog.String("model", cfg.GeminiModel))
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("server failed", slog.Any("error", err))
		}
	}()

	<-ctx.Done()
	log.Info("shutting down ai-service gracefully...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Error("ai-service forced to shutdown", slog.Any("error", err))
	} else {
		log.Info("ai-service shutdown complete")
	}
}
