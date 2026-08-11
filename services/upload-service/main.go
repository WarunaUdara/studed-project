package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/studed/shared/go/logger"
	"github.com/studed/shared/go/metrics"
	"github.com/studed/upload-service/internal/config"
	"github.com/studed/upload-service/internal/handler"
	"github.com/studed/upload-service/internal/storage"
)

func main() {
	log := logger.New("upload-service")

	cfg, err := config.Load()
	if err != nil {
		log.Error("invalid configuration", slog.Any("error", err))
		os.Exit(1)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	store, closeStore, err := newStore(ctx, cfg, log)
	if err != nil {
		log.Error("failed to initialize object storage", slog.Any("error", err))
		os.Exit(1)
	}
	defer closeStore()

	mux := http.NewServeMux()

	// Liveness: the process is up. Deliberately independent of the storage
	// backend, so a GCS outage does not trigger a pod restart loop.
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("upload-service ok"))
	})

	// Readiness: the backend is actually reachable, so an unhealthy replica is
	// pulled from the Service instead of serving 502s.
	mux.HandleFunc("GET /ready", func(w http.ResponseWriter, r *http.Request) {
		pingCtx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
		defer cancel()
		if err := store.Ping(pingCtx); err != nil {
			log.Warn("readiness probe failed", slog.Any("error", err))
			w.WriteHeader(http.StatusServiceUnavailable)
			_, _ = w.Write([]byte("storage unavailable"))
			return
		}
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ready"))
	})

	mux.Handle("GET /metrics", metrics.Handler())

	handler.New(store, cfg, log).Register(mux)

	server := &http.Server{
		Addr:              cfg.ServiceAddr,
		Handler:           metrics.HTTPMiddleware("upload-service")(mux),
		ReadHeaderTimeout: 5 * time.Second,
		// Uploads stream large bodies over slow mobile links; the size cap is
		// enforced by MaxBytesReader rather than by a tight read deadline.
		ReadTimeout:  120 * time.Second,
		WriteTimeout: 120 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Info("upload-service listening",
			slog.String("addr", cfg.ServiceAddr),
			slog.String("backend", store.Kind()),
			slog.Int64("maxUploadBytes", cfg.MaxUploadByte))
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("server failed", slog.Any("error", err))
			stop()
		}
	}()

	<-ctx.Done()
	log.Info("shutting down upload-service gracefully...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Error("upload-service forced to shutdown", slog.Any("error", err))
	} else {
		log.Info("upload-service shutdown complete")
	}
}

// newStore selects the object-storage backend. GCS is used whenever a bucket is
// configured (with the emulator endpoint applied when present); otherwise the
// service falls back to disk, which is local development only.
func newStore(ctx context.Context, cfg *config.Config, log *slog.Logger) (storage.Store, func(), error) {
	if cfg.UsesGCS() {
		gcs, err := storage.NewGCS(ctx, cfg.BucketName, cfg.EmulatorHost)
		if err != nil {
			return nil, nil, err
		}
		log.Info("using GCS object storage",
			slog.String("bucket", cfg.BucketName),
			slog.String("emulator", cfg.EmulatorHost))
		return gcs, func() { _ = gcs.Close() }, nil
	}

	disk, err := storage.NewDisk(cfg.LocalDir)
	if err != nil {
		return nil, nil, err
	}
	log.Warn("GCS_BUCKET_NAME is not set; falling back to local disk storage (development only)",
		slog.String("dir", cfg.LocalDir))
	return disk, func() {}, nil
}
