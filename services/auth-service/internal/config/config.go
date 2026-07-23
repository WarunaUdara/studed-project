package config

import (
	"fmt"
	"os"
	"time"
)

type Config struct {
	ServiceAddr     string
	DatabaseURL     string
	AccessSecret    string
	RefreshSecret   string
	AccessTokenTTL  time.Duration
	RefreshTokenTTL time.Duration
}

func Load() (*Config, error) {
	accessTTL, err := parseDuration(getEnv("JWT_ACCESS_TTL", "15m"))
	if err != nil {
		return nil, fmt.Errorf("invalid JWT_ACCESS_TTL: %w", err)
	}

	refreshTTL, err := parseDuration(getEnv("JWT_REFRESH_TTL", "168h"))
	if err != nil {
		return nil, fmt.Errorf("invalid JWT_REFRESH_TTL: %w", err)
	}

	accessSecret := os.Getenv("JWT_ACCESS_SECRET")
	if accessSecret == "" {
		return nil, fmt.Errorf("JWT_ACCESS_SECRET is required")
	}

	refreshSecret := os.Getenv("JWT_REFRESH_SECRET")
	if refreshSecret == "" {
		return nil, fmt.Errorf("JWT_REFRESH_SECRET is required")
	}

	return &Config{
		ServiceAddr:     getEnv("LISTEN_ADDR", ":8081"),
		DatabaseURL:     getEnv("DATABASE_URL", "postgres://studed:studed@localhost:5433/studed?sslmode=disable"),
		AccessSecret:    accessSecret,
		RefreshSecret:   refreshSecret,
		AccessTokenTTL:  accessTTL,
		RefreshTokenTTL: refreshTTL,
	}, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func parseDuration(s string) (time.Duration, error) {
	return time.ParseDuration(s)
}
