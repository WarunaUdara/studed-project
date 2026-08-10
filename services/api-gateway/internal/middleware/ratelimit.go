package middleware

import (
	"context"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"strings"
	"sync/atomic"
	"time"

	"github.com/redis/go-redis/v9"
)

type RateLimiter struct {
	rdb     *redis.Client
	healthy atomic.Bool
	log     *slog.Logger

	initialBackoff time.Duration
	maxBackoff     time.Duration
	backoffFactor  float64
}

func NewRateLimiter(rdb *redis.Client) *RateLimiter {
	rl := &RateLimiter{
		rdb:            rdb,
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

// StartReconnectLoop monitors Redis connectivity and applies exponential
// backoff between probes so a downed Redis is not hammered. It flips the
// healthy flag used by allow() to decide between fail-open and fail-closed.
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

			// Global IP rate limit (600 req / min)
			if !rl.allow(r.Context(), fmt.Sprintf("ratelimit:global:%s", ip), 600, 1*time.Minute) {
				http.Error(w, `{"error":"rate limit exceeded"}`, http.StatusTooManyRequests)
				return
			}

			// Path-specific rate limits
			if path == "/graphql" && r.Method == http.MethodPost {
				user, _ := UserFromContext(r.Context())
				if user.UserID != "" {
					// User-scoped AI / mutation limit (60 req / min)
					if !rl.allow(r.Context(), fmt.Sprintf("ratelimit:user:%s", user.UserID), 60, 1*time.Minute) {
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
