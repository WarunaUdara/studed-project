package config

import (
	"fmt"
	"os"
)

type Config struct {
	ServiceAddr string
	DatabaseURL string
	RedisAddr   string
}

func Load() (*Config, error) {
	cfg := &Config{
		ServiceAddr: getEnv("GAMIFICATION_SERVICE_ADDR", ":8088"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://studed:studed@localhost:5433/studed?sslmode=disable"),
		RedisAddr:   getEnv("REDIS_ADDR", "localhost:6379"),
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
