package main

import (
	"context"
	"log/slog"
	"net"
	"net/http"
	"os"
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

	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
	if err != nil {
		log.Error("failed to connect to database", slog.Any("error", err))
		os.Exit(1)
	}

	if err := db.AutoMigrate(&model.Course{}, &model.Lesson{}, &model.Wave{}); err != nil {
		log.Error("failed to run migrations", slog.Any("error", err))
		os.Exit(1)
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
