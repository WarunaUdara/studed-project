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
	"github.com/studed/ai-service/internal/agent"
	"github.com/studed/ai-service/internal/config"
	"github.com/studed/ai-service/internal/handler"
	"github.com/studed/ai-service/internal/provider"
	"github.com/studed/ai-service/internal/tools"
	"github.com/studed/ai-service/internal/vision"
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

	if !cfg.HasConfiguredProvider() {
		log.Warn("no LLM provider configured (set OPENCODE_API_KEY or GEMINI_API_KEY); AI endpoints will return 503")
		mux.HandleFunc("/v1/", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusServiceUnavailable)
			_, _ = w.Write([]byte(`{"error":"AI is not configured: set OPENCODE_API_KEY or GEMINI_API_KEY"}`))
		})
	} else {
		var p provider.Provider
		if cfg.AIProvider == "gemini" {
			p = provider.NewGeminiClient(cfg.GeminiAPIKey, cfg.GeminiModel)
			log.Info("using gemini provider", slog.String("model", cfg.GeminiModel))
		} else {
			p = provider.NewOpenCodeClient()
			log.Info("using opencode provider", slog.String("model", cfg.OpenCodeModel))
		}

		toolSet := tools.DefaultSet(p)
		ag := agent.New(p, toolSet, cfg.MaxAgentIterations)
		vc := vision.NewClient()

		h := handler.New(p, ag, vc, log, cfg.MaxBodyBytes)
		h.Register(mux)
	}

	server := &http.Server{
		Addr:              cfg.ServiceAddr,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       90 * time.Second,
		// No WriteTimeout: the agent stream and tool generations (JSON mode
		// with a generous token budget + retry) routinely take 1-3 minutes.
		// A write deadline would kill mid-generation; client disconnects are
		// already handled by request-context cancellation.
		WriteTimeout: 0,
		IdleTimeout:  120 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		log.Info("ai-service listening", slog.String("addr", cfg.ServiceAddr))
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
