package config

import (
	"os"
)

type Config struct {
	ServiceAddr      string
	DatabaseURL      string
	AuthServiceAddr  string
	ElasticsearchURL string
}

func Load() (*Config, error) {
	return &Config{
		ServiceAddr:      getEnv("COURSE_SERVICE_ADDR", ":8083"),
		DatabaseURL:      getEnv("DATABASE_URL", "postgres://studed:studed@localhost:5433/studed?sslmode=disable"),
		AuthServiceAddr:  getEnv("AUTH_SERVICE_ADDR", "localhost:8081"),
		ElasticsearchURL: getEnv("ELASTICSEARCH_URL", "http://localhost:9200"),
	}, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
