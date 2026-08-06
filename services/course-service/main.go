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
	"github.com/studed/course-service/internal/config"
	"github.com/studed/course-service/internal/handler"
	"github.com/studed/course-service/internal/model"
	"github.com/studed/course-service/internal/repository"
	"github.com/studed/course-service/internal/search"
	"github.com/studed/course-service/internal/service"
	"github.com/studed/shared/go/logger"
	coursepb "github.com/studed/shared/proto/gen/go/course"
	"google.golang.org/grpc"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	_ = godotenv.Load()

	log := logger.New("course-service")

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

	if err := db.AutoMigrate(&model.Course{}, &model.Lesson{}, &model.Wave{}); err != nil {
		if db.Migrator().HasTable(&model.Wave{}) && db.Migrator().HasTable(&model.Course{}) && db.Migrator().HasTable(&model.Lesson{}) {
			log.Warn("auto-migration schema update skipped (tables exist)", slog.Any("error", err))
		} else {
			log.Error("failed to run migrations", slog.Any("error", err))
			os.Exit(1)
		}
	}

	courseRepo := repository.NewCourseRepository(db)
	lessonRepo := repository.NewLessonRepository(db)
	waveRepo := repository.NewWaveRepository(db)

	var svcOpts []service.Option
	if cfg.ElasticsearchURL != "" {
		courseIndex, err := search.New(cfg.ElasticsearchURL, log)
		if err != nil {
			log.Warn("failed to create elasticsearch client, search falls back to SQL", slog.Any("error", err))
		} else {
			svcOpts = append(svcOpts, service.WithSearchIndex(courseIndex))
			// Elasticsearch boots slower than this service; retry index setup
			// in the background while searches fall back to SQL.
			go func() {
				for attempt := 1; attempt <= 30; attempt++ {
					ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
					err := courseIndex.EnsureIndex(ctx)
					cancel()
					if err == nil {
						log.Info("elasticsearch course index ready", slog.String("url", cfg.ElasticsearchURL))
						backfillCourseIndex(log, courseRepo, courseIndex)
						return
					}
					log.Warn("elasticsearch not ready, search falls back to SQL", slog.Int("attempt", attempt), slog.Any("error", err))
					time.Sleep(10 * time.Second)
				}
			}()
		}
	}

	courseSvc := service.NewCourseService(courseRepo, lessonRepo, waveRepo, svcOpts...)
	grpcHandler := handler.NewCourseGRPCHandler(courseSvc)

	grpcListener, err := net.Listen("tcp", cfg.ServiceAddr)
	if err != nil {
		log.Error("failed to listen", slog.Any("error", err))
		os.Exit(1)
	}

	grpcServer := grpc.NewServer()
	coursepb.RegisterCourseServiceServer(grpcServer, grpcHandler)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	httpMux := http.NewServeMux()
	httpMux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("course-service ok"))
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
		Addr:              ":8084",
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
		log.Info("course-service listening", slog.String("addr", cfg.ServiceAddr))
		if err := grpcServer.Serve(grpcListener); err != nil {
			log.Error("grpc server failed", slog.Any("error", err))
		}
	}()

	<-ctx.Done()
	log.Info("shutting down course-service gracefully...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_ = httpServer.Shutdown(shutdownCtx)
	grpcServer.GracefulStop()
	log.Info("course-service shutdown complete")
}

// backfillCourseIndex reindexes every course so the search index stays
// consistent with Postgres after downtime or a fresh Elasticsearch volume.
func backfillCourseIndex(log *slog.Logger, courseRepo repository.CourseRepository, courseIndex *search.CourseIndex) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	courses, err := courseRepo.List(ctx, repository.ListFilters{})
	if err != nil {
		log.Warn("course index backfill failed to list courses", slog.Any("error", err))
		return
	}
	for _, c := range courses {
		if err := courseIndex.IndexCourse(ctx, c); err != nil {
			log.Warn("course index backfill failed", slog.String("course_id", c.ID), slog.Any("error", err))
			return
		}
	}
	log.Info("course index backfill complete", slog.Int("count", len(courses)))
}
