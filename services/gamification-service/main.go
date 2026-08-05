package main

import (
	"context"
	"embed"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/golang-migrate/migrate/v4"
	postgres_migrate "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
	"github.com/studed/gamification-service/internal/config"
	"github.com/studed/gamification-service/internal/events"
	"github.com/studed/gamification-service/internal/handler"
	"github.com/studed/gamification-service/internal/repository"
	"github.com/studed/gamification-service/internal/service"
	"github.com/studed/shared/go/grpcauth"
	"github.com/studed/shared/go/logger"
	gampb "github.com/studed/shared/proto/gen/go/gamification"
	"google.golang.org/grpc"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

func main() {
	_ = godotenv.Load()

	log := logger.New("gamification-service")

	cfg, err := config.Load()
	if err != nil {
		log.Error("failed to load config", slog.Any("error", err))
		os.Exit(1)
	}

	var db *gorm.DB
	for attempt := 1; attempt <= 15; attempt++ {
		db, err = gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
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

	sqlDB, err := db.DB()
	if err != nil {
		log.Error("failed to get sql db", slog.Any("error", err))
		os.Exit(1)
	}

	driver, err := postgres_migrate.WithInstance(sqlDB, &postgres_migrate.Config{
		MigrationsTable: "gamification_schema_migrations",
	})
	if err != nil {
		log.Error("failed to create migration driver", slog.Any("error", err))
		os.Exit(1)
	}

	sourceDriver, err := iofs.New(migrationsFS, "migrations")
	if err != nil {
		log.Error("failed to create migration source", slog.Any("error", err))
		os.Exit(1)
	}

	m, err := migrate.NewWithInstance("iofs", sourceDriver, "postgres", driver)
	if err != nil {
		log.Error("failed to create migrate instance", slog.Any("error", err))
		os.Exit(1)
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Error("failed to run migrations up", slog.Any("error", err))
		os.Exit(1)
	}
	log.Info("migrations ran successfully")

	redisClient := redis.NewClient(&redis.Options{
		Addr: cfg.RedisAddr,
	})

	xpRepo := repository.NewXpRepository(db)
	leaderboardRepo := repository.NewLeaderboardRepository(redisClient)
	achievementRepo := repository.NewAchievementRepository(db)
	eventPublisher := events.NewPublisher(redisClient)
	gamificationSvc := service.NewGamificationService(xpRepo, leaderboardRepo, achievementRepo, service.WithEventPublisher(eventPublisher))
	grpcHandler := handler.NewGamificationGRPCHandler(gamificationSvc)

	grpcListener, err := net.Listen("tcp", cfg.ServiceAddr)
	if err != nil {
		log.Error("failed to listen", slog.Any("error", err))
		os.Exit(1)
	}

	grpcServer := grpc.NewServer(
		grpc.ChainUnaryInterceptor(grpcauth.UnaryServerInterceptor(cfg.ServiceToken)),
	)
	gampb.RegisterGamificationServiceServer(grpcServer, grpcHandler)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	httpMux := http.NewServeMux()
	httpMux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("gamification-service ok"))
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
		Addr:              ":8089",
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
		log.Info("gamification-service listening", slog.String("addr", cfg.ServiceAddr))
		if err := grpcServer.Serve(grpcListener); err != nil {
			log.Error("grpc server failed", slog.Any("error", err))
		}
	}()

	<-ctx.Done()
	log.Info("shutting down gamification-service gracefully...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_ = httpServer.Shutdown(shutdownCtx)
	grpcServer.GracefulStop()
	log.Info("gamification-service shutdown complete")
}
