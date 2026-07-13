package main

import (
	"embed"
	"log/slog"
	"net"
	"net/http"
	"os"

	"github.com/golang-migrate/migrate/v4"
	postgres_migrate "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/joho/godotenv"
	"github.com/studed/progress-service/internal/config"
	"github.com/studed/progress-service/internal/handler"
	"github.com/studed/progress-service/internal/repository"
	"github.com/studed/progress-service/internal/service"
	"github.com/studed/shared/go/logger"
	coursepb "github.com/studed/shared/proto/gen/go/course"
	gampb "github.com/studed/shared/proto/gen/go/gamification"
	progresspb "github.com/studed/shared/proto/gen/go/progress"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

func main() {
	_ = godotenv.Load()

	log := logger.New("progress-service")

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

	sqlDB, err := db.DB()
	if err != nil {
		log.Error("failed to get sql db", slog.Any("error", err))
		os.Exit(1)
	}

	driver, err := postgres_migrate.WithInstance(sqlDB, &postgres_migrate.Config{
		MigrationsTable: "progress_schema_migrations",
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

	courseConn, err := grpc.NewClient(cfg.CourseServiceAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Error("failed to connect to course service", slog.Any("error", err))
		os.Exit(1)
	}
	defer courseConn.Close()

	gamificationConn, err := grpc.NewClient(cfg.GamificationServiceAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Error("failed to connect to gamification service", slog.Any("error", err))
		os.Exit(1)
	}
	defer gamificationConn.Close()

	courseClient := coursepb.NewCourseServiceClient(courseConn)
	gamificationClient := gampb.NewGamificationServiceClient(gamificationConn)

	progressRepo := repository.NewProgressRepository(db)
	progressSvc := service.NewProgressService(progressRepo, courseClient, gamificationClient)
	grpcHandler := handler.NewProgressGRPCHandler(progressSvc)

	grpcListener, err := net.Listen("tcp", cfg.ServiceAddr)
	if err != nil {
		log.Error("failed to listen", slog.Any("error", err))
		os.Exit(1)
	}

	grpcServer := grpc.NewServer()
	progresspb.RegisterProgressServiceServer(grpcServer, grpcHandler)

	go func() {
		mux := http.NewServeMux()
		mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte("progress-service ok"))
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
		httpAddr := ":8087"
		log.Info("http health server listening", slog.String("addr", httpAddr))
		if err := http.ListenAndServe(httpAddr, mux); err != nil {
			log.Error("http server failed", slog.Any("error", err))
		}
	}()

	log.Info("progress-service listening", slog.String("addr", cfg.ServiceAddr))
	if err := grpcServer.Serve(grpcListener); err != nil {
		log.Error("grpc server failed", slog.Any("error", err))
		os.Exit(1)
	}
}
