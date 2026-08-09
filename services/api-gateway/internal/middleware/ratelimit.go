package middleware

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

type RateLimiter struct {
	rdb *redis.Client
}

func NewRateLimiter(rdb *redis.Client) *RateLimiter {
	return &RateLimiter{rdb: rdb}
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
	count, err := rl.rdb.Incr(ctx, key).Result()
	if err != nil {
		// If Redis is unreachable, fail open to avoid service outage
		return true
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
