package middleware

import (
	"context"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync/atomic"
	"time"

	"github.com/redis/go-redis/v9"
)

// RateLimitConfig holds the tunable rate-limit values. Production defaults
// match the original hardcoded limits; development can raise them via env.
type RateLimitConfig struct {
	GlobalLimit  int64
	GlobalWindow time.Duration
	UserLimit    int64
	UserWindow   time.Duration
}

// RateLimitConfigFromEnv builds a config from environment variables with
// production-safe defaults:
//
//	RATE_LIMIT_GLOBAL    requests per window per IP (default 100)
//	RATE_LIMIT_GLOBAL_WINDOW_SECONDS (default 60)
//	RATE_LIMIT_USER      requests per window per authenticated user (default 60)
//	RATE_LIMIT_USER_WINDOW_SECONDS  (default 60)
func RateLimitConfigFromEnv() RateLimitConfig {
	return RateLimitConfig{
		GlobalLimit:  int64(envInt("RATE_LIMIT_GLOBAL", 100)),
		GlobalWindow: time.Duration(envInt("RATE_LIMIT_GLOBAL_WINDOW_SECONDS", 60)) * time.Second,
		UserLimit:    int64(envInt("RATE_LIMIT_USER", 60)),
		UserWindow:   time.Duration(envInt("RATE_LIMIT_USER_WINDOW_SECONDS", 60)) * time.Second,
	}
}

type RateLimiter struct {
	rdb     *redis.Client
	config  RateLimitConfig
	healthy atomic.Bool
	log     *slog.Logger

	initialBackoff time.Duration
	maxBackoff     time.Duration
	backoffFactor  float64
}

func NewRateLimiter(rdb *redis.Client) *RateLimiter {
	return NewRateLimiterWithConfig(rdb, RateLimitConfigFromEnv())
}

func NewRateLimiterWithConfig(rdb *redis.Client, cfg RateLimitConfig) *RateLimiter {
	rl := &RateLimiter{
		rdb:            rdb,
		config:         cfg,
		log:            slog.Default(),
		initialBackoff: 250 * time.Millisecond,
		maxBackoff:     30 * time.Second,
		backoffFactor:  2.0,
	}
	if rdb != nil {
		rl.healthy.Store(true)
	}
	return rl
}

// StartReconnectLoop monitors Redis connectivity with exponential backoff and
// restores rate limiting once Redis becomes available again.
func (rl *RateLimiter) StartReconnectLoop(ctx context.Context) {
	if rl.rdb == nil {
		return
	}

	backoff := rl.initialBackoff
	for {
		err := rl.rdb.Ping(ctx).Err()
		if err == nil {
			if !rl.healthy.Load() {
				rl.healthy.Store(true)
				rl.log.Info("redis reconnected", slog.String("component", "ratelimit"))
			}
			backoff = rl.initialBackoff
		} else {
			if rl.healthy.Load() {
				rl.healthy.Store(false)
				rl.log.Warn("redis unreachable, rate limiting disabled", slog.Any("error", err))
			}
			backoff = time.Duration(float64(backoff) * rl.backoffFactor)
			if backoff > rl.maxBackoff {
				backoff = rl.maxBackoff
			}
		}

		select {
		case <-ctx.Done():
			return
		case <-time.After(backoff):
		}
	}
}

// RateLimit returns a middleware enforcing rate limits based on path and user context.
func (rl *RateLimiter) RateLimit() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if rl.rdb == nil {
				next.ServeHTTP(w, r)
				return
			}

			ip := getClientIP(r)
			path := strings.TrimRight(r.URL.Path, "/")
			if path == "/health" || path == "/metrics" || path == "/ready" || ip == "127.0.0.1" || ip == "::1" || ip == "localhost" || strings.HasPrefix(ip, "172.") {
				next.ServeHTTP(w, r)
				return
			}

			// Global IP rate limit.
			if !rl.allow(r.Context(), fmt.Sprintf("ratelimit:global:%s", ip), rl.config.GlobalLimit, rl.config.GlobalWindow) {
				http.Error(w, `{"error":"rate limit exceeded"}`, http.StatusTooManyRequests)
				return
			}

			// Path-specific rate limits
			if path == "/graphql" && r.Method == http.MethodPost {
				user, _ := UserFromContext(r.Context())
				if user.UserID != "" {
					// User-scoped AI / mutation limit.
					if !rl.allow(r.Context(), fmt.Sprintf("ratelimit:user:%s", user.UserID), rl.config.UserLimit, rl.config.UserWindow) {
						http.Error(w, `{"error":"rate limit exceeded"}`, http.StatusTooManyRequests)
						return
					}
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}

func (rl *RateLimiter) allow(ctx context.Context, key string, limit int64, window time.Duration) bool {
	// Fail closed while Redis is known-unreachable: without a backing store the
	// rate limit cannot be enforced, so reject rather than let the limit lapse.
	if rl.rdb == nil || !rl.healthy.Load() {
		return false
	}

	count, err := rl.rdb.Incr(ctx, key).Result()
	if err != nil {
		rl.healthy.Store(false)
		rl.log.Warn("redis rate limit command failed", slog.Any("error", err))
		return false
	}

	if count == 1 {
		rl.rdb.Expire(ctx, key, window)
	}

	return count <= limit
}

func getClientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}
	if xreal := r.Header.Get("X-Real-IP"); xreal != "" {
		return strings.TrimSpace(xreal)
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

func envInt(key string, fallback int) int {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil || n <= 0 {
		return fallback
	}
	return n
}
