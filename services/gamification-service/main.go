package main

import (
	"log/slog"
	"net"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
	"github.com/studed/gamification-service/internal/config"
	"github.com/studed/gamification-service/internal/handler"
	"github.com/studed/gamification-service/internal/model"
	"github.com/studed/gamification-service/internal/repository"
	"github.com/studed/gamification-service/internal/service"
	"github.com/studed/shared/go/logger"
	gampb "github.com/studed/shared/proto/gen/go/gamification"
	"google.golang.org/grpc"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	_ = godotenv.Load()

	log := logger.New("gamification-service")

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

	redisClient := redis.NewClient(&redis.Options{
		Addr: cfg.RedisAddr,
	})

	xpRepo := repository.NewXpRepository(db)
	leaderboardRepo := repository.NewLeaderboardRepository(redisClient)
	gamificationSvc := service.NewGamificationService(xpRepo, leaderboardRepo)
	grpcHandler := handler.NewGamificationGRPCHandler(gamificationSvc)

	grpcListener, err := net.Listen("tcp", cfg.ServiceAddr)
	if err != nil {
		log.Error("failed to listen", slog.Any("error", err))
		os.Exit(1)
	}

	grpcServer := grpc.NewServer()
	gampb.RegisterGamificationServiceServer(grpcServer, grpcHandler)

	go func() {
		mux := http.NewServeMux()
		mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte("gamification-service ok"))
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
		httpAddr := ":8089"
		log.Info("http health server listening", slog.String("addr", httpAddr))
		if err := http.ListenAndServe(httpAddr, mux); err != nil {
			log.Error("http server failed", slog.Any("error", err))
		}
	}()

	log.Info("gamification-service listening", slog.String("addr", cfg.ServiceAddr))
	if err := grpcServer.Serve(grpcListener); err != nil {
		log.Error("grpc server failed", slog.Any("error", err))
		os.Exit(1)
	}
}
