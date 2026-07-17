package config

import (
	"fmt"
	"os"
)

type Config struct {
	ServiceAddr             string
	AuthServiceAddr         string
	CourseServiceAddr       string
	ProgressServiceAddr     string
	GamificationServiceAddr string
	RedisAddr               string
	AccessSecret            string
	GraphQLPlayground       bool
}

func Load() (*Config, error) {
	accessSecret := os.Getenv("JWT_ACCESS_SECRET")
	if accessSecret == "" {
		return nil, fmt.Errorf("JWT_ACCESS_SECRET is required")
	}

	return &Config{
		ServiceAddr:             getEnv("API_GATEWAY_ADDR", ":8080"),
		AuthServiceAddr:         getEnv("AUTH_SERVICE_ADDR", "localhost:8081"),
		CourseServiceAddr:       getEnv("COURSE_SERVICE_ADDR", "localhost:8083"),
		ProgressServiceAddr:     getEnv("PROGRESS_SERVICE_ADDR", "localhost:8086"),
		GamificationServiceAddr: getEnv("GAMIFICATION_SERVICE_ADDR", "localhost:8088"),
		RedisAddr:               getEnv("REDIS_ADDR", "localhost:6379"),
		AccessSecret:            accessSecret,
		GraphQLPlayground:       getEnv("GRAPHQL_PLAYGROUND", "false") == "true",
	}, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
