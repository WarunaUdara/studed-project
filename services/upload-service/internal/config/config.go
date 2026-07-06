package config

import (
	"fmt"
	"os"
)

type Config struct {
	ServiceAddr string
	DatabaseURL string
	StoragePath string
	BaseURL     string
}

func Load() (*Config, error) {
	cfg := &Config{
		ServiceAddr: getEnv("UPLOAD_SERVICE_ADDR", ":8093"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://studed:studed@localhost:5433/studed?sslmode=disable"),
		StoragePath: getEnv("UPLOAD_STORAGE_PATH", "/tmp/uploads"),
		BaseURL:     getEnv("UPLOAD_BASE_URL", "/uploads"),
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
