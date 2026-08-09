package config

import (
	"os"
)

type Config struct {
	ServiceAddr string

	// Provider selection: "opencode" (default) or "gemini".
	AIProvider string

	// OpenCode (primary) provider.
	OpenCodeBaseURL string
	OpenCodeAPIKey  string
	OpenCodeModel   string
	OpenCodeVisionModel string

	// Gemini fallback provider.
	GeminiAPIKey string
	GeminiModel  string

	// Agent loop bounds.
	MaxAgentIterations int
	MaxBodyBytes       int64
}

func Load() (*Config, error) {
	return &Config{
		ServiceAddr:        getEnv("AI_SERVICE_ADDR", ":8090"),
		AIProvider:         getEnv("AI_PROVIDER", "opencode"),
		OpenCodeBaseURL:    getEnv("OPENCODE_BASE_URL", "https://opencode.ai/zen/go/v1"),
		OpenCodeAPIKey:     os.Getenv("OPENCODE_API_KEY"),
		OpenCodeModel:      getEnv("OPENCODE_MODEL", "deepseek-v4-flash"),
		OpenCodeVisionModel: getEnv("OPENCODE_VISION_MODEL", "qwen3.7-plus"),
		GeminiAPIKey:       os.Getenv("GEMINI_API_KEY"),
		GeminiModel:        getEnv("GEMINI_MODEL", "gemini-2.5-flash"),
		MaxAgentIterations: getEnvInt("MAX_AGENT_ITERATIONS", 6),
		MaxBodyBytes:       int64(getEnvInt("MAX_BODY_BYTES", 15<<20)),
	}, nil
}

// HasConfiguredProvider reports whether at least one LLM backend is usable.
func (c *Config) HasConfiguredProvider() bool {
	if c.AIProvider == "gemini" {
		return c.GeminiAPIKey != ""
	}
	return c.OpenCodeAPIKey != ""
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	n := 0
	for _, c := range v {
		if c < '0' || c > '9' {
			return fallback
		}
		n = n*10 + int(c-'0')
	}
	if n <= 0 {
		return fallback
	}
	return n
}
