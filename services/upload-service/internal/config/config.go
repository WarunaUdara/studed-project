package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

// Config is the full runtime configuration of upload-service.
//
// The deployment story is deliberately two variables wide: set GCS_BUCKET_NAME
// and the service talks to real GCS via Workload Identity; additionally set
// STORAGE_EMULATOR_HOST and it talks to the local floci-gcp emulator with the
// same code path. Set neither and it falls back to disk so `go run .` works
// with no cloud dependency at all.
type Config struct {
	ServiceAddr   string
	BucketName    string
	EmulatorHost  string
	LocalDir      string
	ServiceToken  string
	MaxUploadByte int64
	AllowedTypes  []string
	PublicBaseURL string
}

// Defaults chosen so an image-heavy course page stays cheap to serve while a
// single request cannot exhaust the 128Mi container memory limit.
const (
	defaultAddr     = ":8093"
	defaultLocalDir = "/tmp/studed-uploads"
	defaultMaxBytes = 10 << 20 // 10MiB
)

var defaultAllowedTypes = []string{
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
}

func Load() (*Config, error) {
	cfg := &Config{
		ServiceAddr:   getEnv("UPLOAD_SERVICE_ADDR", defaultAddr),
		BucketName:    os.Getenv("GCS_BUCKET_NAME"),
		EmulatorHost:  firstNonEmpty(os.Getenv("STORAGE_EMULATOR_HOST"), os.Getenv("FLOCI_GCP_BASE_URL")),
		LocalDir:      getEnv("UPLOAD_LOCAL_DIR", defaultLocalDir),
		ServiceToken:  os.Getenv("SERVICE_TOKEN"),
		MaxUploadByte: int64(envInt("UPLOAD_MAX_BYTES", defaultMaxBytes)),
		PublicBaseURL: strings.TrimRight(os.Getenv("UPLOAD_PUBLIC_BASE_URL"), "/"),
	}

	if raw := os.Getenv("UPLOAD_ALLOWED_TYPES"); raw != "" {
		for _, t := range strings.Split(raw, ",") {
			if t = strings.ToLower(strings.TrimSpace(t)); t != "" {
				cfg.AllowedTypes = append(cfg.AllowedTypes, t)
			}
		}
	} else {
		cfg.AllowedTypes = defaultAllowedTypes
	}

	if cfg.MaxUploadByte <= 0 {
		return nil, fmt.Errorf("UPLOAD_MAX_BYTES must be positive, got %d", cfg.MaxUploadByte)
	}
	if len(cfg.AllowedTypes) == 0 {
		return nil, fmt.Errorf("UPLOAD_ALLOWED_TYPES resolved to an empty allowlist")
	}

	return cfg, nil
}

// UsesGCS reports whether object storage is configured. When false the service
// runs in disk mode, which is intended for local development only.
func (c *Config) UsesGCS() bool { return c.BucketName != "" }

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if v != "" {
			return v
		}
	}
	return ""
}

func envInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}
