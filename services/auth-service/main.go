package main

import (
	"context"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"github.com/studed/auth-service/internal/config"
	"github.com/studed/auth-service/internal/handler"
	"github.com/studed/auth-service/internal/jwt"
	"github.com/studed/auth-service/internal/model"
	"github.com/studed/auth-service/internal/repository"
	"github.com/studed/auth-service/internal/service"
	"github.com/studed/shared/go/grpcauth"
	"github.com/studed/shared/go/logger"
	"github.com/studed/shared/go/otel"
	authpb "github.com/studed/shared/proto/gen/go/auth"
	"google.golang.org/grpc"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	_ = godotenv.Load()

	log := logger.New("auth-service")

	tracerShutdown, err := otel.SetupTracerProvider(otel.TracerProviderConfig{
		ServiceName:    "auth-service",
		Environment:    otel.Env("APP_ENV", "development"),
		SampleFraction: 1.0,
	})
	if err != nil {
		log.Error("failed to init tracer provider", slog.Any("error", err))
		os.Exit(1)
	}

	cfg, err := config.Load()
	if err != nil {
		log.Error("failed to load config", slog.Any("error", err))
		os.Exit(1)
	}

	var db *gorm.DB
	for attempt := 1; attempt <= 15; attempt++ {
		db, err = gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
		if err == nil {
			sqlDB, err := db.DB()
			if err == nil {
				sqlDB.SetMaxOpenConns(25)
				sqlDB.SetMaxIdleConns(5)
				sqlDB.SetConnMaxLifetime(5 * time.Minute)
				sqlDB.SetConnMaxIdleTime(1 * time.Minute)
			}
			break
		}
		if attempt == 15 {
			log.Error("failed to connect to database after 15 attempts", slog.Any("error", err))
			os.Exit(1)
		}
		log.Warn("database connection pending, retrying...", slog.Int("attempt", attempt), slog.Any("error", err))
		time.Sleep(1 * time.Second)
	}

	if err := db.AutoMigrate(&model.User{}); err != nil {
		log.Error("failed to run migrations", slog.Any("error", err))
		os.Exit(1)
	}

	userRepo := repository.NewUserRepository(db)
	jwtMgr := jwt.NewManager(cfg.AccessSecret, cfg.RefreshSecret, cfg.AccessTokenTTL, cfg.RefreshTokenTTL)
	authSvc := service.NewAuthService(userRepo, jwtMgr)
	grpcHandler := handler.NewAuthGRPCHandler(authSvc)

	grpcListener, err := net.Listen("tcp", cfg.ServiceAddr)
	if err != nil {
		log.Error("failed to listen", slog.Any("error", err))
		os.Exit(1)
	}

	grpcServer := grpc.NewServer(
		grpc.ChainUnaryInterceptor(
			grpcauth.UnaryServerTraceInterceptor(),
			grpcauth.UnaryServerInterceptor(cfg.ServiceToken),
		),
	)
	authpb.RegisterAuthServiceServer(grpcServer, grpcHandler)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	httpMux := http.NewServeMux()
	httpMux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("auth-service ok"))
	})
	httpMux.HandleFunc("/ready", func(w http.ResponseWriter, r *http.Request) {
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
	httpServer := &http.Server{
		Addr:              ":8085",
		Handler:           httpMux,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		log.Info("http health server listening", slog.String("addr", httpServer.Addr))
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("http server failed", slog.Any("error", err))
		}
	}()

	go func() {
		log.Info("auth-service listening", slog.String("addr", cfg.ServiceAddr))
		if err := grpcServer.Serve(grpcListener); err != nil {
			log.Error("grpc server failed", slog.Any("error", err))
		}
	}()

	<-ctx.Done()
	log.Info("shutting down auth-service gracefully...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_ = httpServer.Shutdown(shutdownCtx)
	grpcServer.GracefulStop()
	if err := tracerShutdown(shutdownCtx); err != nil {
		log.Error("failed to flush tracer", slog.Any("error", err))
	}
	log.Info("auth-service shutdown complete")
}
