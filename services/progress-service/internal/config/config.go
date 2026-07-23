package config

import (
	"fmt"
	"os"
)

type Config struct {
	ServiceAddr             string
	DatabaseURL             string
	CourseServiceAddr       string
	GamificationServiceAddr string
}

func Load() (*Config, error) {
	cfg := &Config{
		ServiceAddr:             getEnv("LISTEN_ADDR", ":8086"),
		DatabaseURL:             getEnv("DATABASE_URL", "postgres://studed:studed@localhost:5433/studed?sslmode=disable"),
		CourseServiceAddr:       getEnv("COURSE_SERVICE_ADDR", "localhost:8083"),
		GamificationServiceAddr: getEnv("GAMIFICATION_SERVICE_ADDR", "localhost:8088"),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultValue
}
