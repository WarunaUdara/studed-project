package config

import (
	"fmt"
	"os"
)

type Config struct {
	ServiceAddr  string
	DatabaseURL  string
	RedisAddr    string
	ServiceToken string
}

func Load() (*Config, error) {
	cfg := &Config{
		ServiceAddr:  getEnv("LISTEN_ADDR", ":8088"),
		DatabaseURL:  getEnv("DATABASE_URL", "postgres://studed:studed@localhost:5433/studed?sslmode=disable"),
		RedisAddr:    getEnv("REDIS_ADDR", "localhost:6379"),
		ServiceToken: os.Getenv("GAMIFICATION_SERVICE_TOKEN"),
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
