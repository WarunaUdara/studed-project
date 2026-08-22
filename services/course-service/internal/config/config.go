package config

import (
	"os"
)

type Config struct {
	ServiceAddr      string
	DatabaseURL      string
	DatabaseOwnerURL string
	AuthServiceAddr  string
	ElasticsearchURL string
	ServiceToken     string
}

func Load() (*Config, error) {
	return &Config{
		ServiceAddr:      getEnv("LISTEN_ADDR", ":8083"),
		DatabaseURL:      getEnv("DATABASE_URL", "postgres://studed:studed@localhost:5433/studed?sslmode=disable"),
		DatabaseOwnerURL: getEnv("DATABASE_OWNER_URL", getEnv("DATABASE_URL", "postgres://studed:studed@localhost:5433/studed?sslmode=disable")),
		AuthServiceAddr:  getEnv("AUTH_SERVICE_ADDR", "localhost:8081"),
		ElasticsearchURL: getEnv("ELASTICSEARCH_URL", "http://localhost:9200"),
		ServiceToken:     getEnv("SERVICE_TOKEN", ""),
	}, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
