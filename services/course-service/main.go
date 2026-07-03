package main

import (
	"log/slog"
	"net"
	"net/http"
	"os"

	"github.com/studed/course-service/internal/config"
	"github.com/studed/course-service/internal/handler"
	"github.com/studed/course-service/internal/model"
	"github.com/studed/course-service/internal/repository"
	"github.com/studed/course-service/internal/service"
	"github.com/studed/shared/go/logger"
	coursepb "github.com/studed/shared/proto/gen/go/course"
	"google.golang.org/grpc"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	log := logger.New("course-service")

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

	if err := db.AutoMigrate(&model.Course{}); err != nil {
		log.Error("failed to run migrations", slog.Any("error", err))
		os.Exit(1)
	}

	courseRepo := repository.NewCourseRepository(db)
	courseSvc := service.NewCourseService(courseRepo)
	grpcHandler := handler.NewCourseGRPCHandler(courseSvc)

	grpcListener, err := net.Listen("tcp", cfg.ServiceAddr)
	if err != nil {
		log.Error("failed to listen", slog.Any("error", err))
		os.Exit(1)
	}

	grpcServer := grpc.NewServer()
	coursepb.RegisterCourseServiceServer(grpcServer, grpcHandler)

	go func() {
		mux := http.NewServeMux()
		mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte("course-service ok"))
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
		httpAddr := ":8084"
		log.Info("http health server listening", slog.String("addr", httpAddr))
		if err := http.ListenAndServe(httpAddr, mux); err != nil {
			log.Error("http server failed", slog.Any("error", err))
		}
	}()

	log.Info("course-service listening", slog.String("addr", cfg.ServiceAddr))
	if err := grpcServer.Serve(grpcListener); err != nil {
		log.Error("grpc server failed", slog.Any("error", err))
		os.Exit(1)
	}
}
