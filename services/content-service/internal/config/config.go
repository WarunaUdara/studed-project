package config

import (
	"fmt"
	"os"
)

type Config struct {
	ServiceAddr string
	DatabaseURL string
}

func Load() (*Config, error) {
	cfg := &Config{
		ServiceAddr: getEnv("CONTENT_SERVICE_ADDR", ":8091"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://studed:studed@localhost:5433/studed?sslmode=disable"),
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
