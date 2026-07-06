package main

import (
	"log/slog"
	"net"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"github.com/studed/shared/go/logger"
	uploadpb "github.com/studed/shared/proto/gen/go/upload"
	"github.com/studed/upload-service/internal/config"
	"github.com/studed/upload-service/internal/handler"
	"github.com/studed/upload-service/internal/model"
	"github.com/studed/upload-service/internal/repository"
	"github.com/studed/upload-service/internal/service"
	"github.com/studed/upload-service/internal/storage"
	"google.golang.org/grpc"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	_ = godotenv.Load()

	log := logger.New("upload-service")

	cfg, err := config.Load()
	if err != nil {
		log.Error("failed to load config", slog.Any("error", err))
		os.Exit(1)
	}

	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
	if err != nil {
		log.Error("failed to connect to database", slog.Any("error", err))
		os.Exit(1)
	}

	if err := model.AutoMigrate(db); err != nil {
		log.Error("failed to run migrations", slog.Any("error", err))
		os.Exit(1)
	}

	mediaRepo := repository.NewMediaRepository(db)
	provider := storage.NewLocalProvider(cfg.StoragePath, cfg.BaseURL)
	uploadSvc := service.NewUploadService(mediaRepo, provider)
	grpcHandler := handler.NewUploadGRPCHandler(uploadSvc)

	grpcListener, err := net.Listen("tcp", cfg.ServiceAddr)
	if err != nil {
		log.Error("failed to listen grpc", slog.Any("error", err))
		os.Exit(1)
	}

	grpcServer := grpc.NewServer()
	uploadpb.RegisterUploadServiceServer(grpcServer, grpcHandler)

	go func() {
		httpAddr := ":8094"
		httpHandler := handler.NewHTTPHandler(uploadSvc, mediaRepo, provider)
		mux := http.NewServeMux()
		mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte("upload-service ok"))
		})
		mux.HandleFunc("/ready", func(w http.ResponseWriter, r *http.Request) {
			sqlDB, err := db.DB()
			if err != nil {
				w.WriteHeader(http.StatusServiceUnavailable)
				return
			}
			if err := sqlDB.Ping(); err != nil {
				w.WriteHeader(http.StatusServiceUnavailable)
				return
			}
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte("ready"))
		})
		mux.Handle("/", httpHandler)

		log.Info("http server listening", slog.String("addr", httpAddr))
		if err := http.ListenAndServe(httpAddr, mux); err != nil {
			log.Error("http server failed", slog.Any("error", err))
		}
	}()

	log.Info("upload-service listening", slog.String("addr", cfg.ServiceAddr))
	if err := grpcServer.Serve(grpcListener); err != nil {
		log.Error("grpc server failed", slog.Any("error", err))
		os.Exit(1)
	}
}
