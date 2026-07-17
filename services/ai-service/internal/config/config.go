package config

import (
	"os"
)

type Config struct {
	ServiceAddr  string
	GeminiAPIKey string
	GeminiModel  string
}

func Load() (*Config, error) {
	return &Config{
		ServiceAddr:  getEnv("AI_SERVICE_ADDR", ":8090"),
		GeminiAPIKey: os.Getenv("GEMINI_API_KEY"),
		GeminiModel:  getEnv("GEMINI_MODEL", "gemini-2.5-flash"),
	}, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
