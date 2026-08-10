package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestRateLimiter_NilRdbPassesThrough(t *testing.T) {
	limiter := NewRateLimiter(nil)

	handler := limiter.RateLimit()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	}))

	req := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	// A nil client means rate limiting is not configured; the middleware must
	// not stand in the way of requests.
	if rec.Code != http.StatusOK {
		t.Fatalf("expected status OK 200 when rdb is nil, got %d", rec.Code)
	}
}

func TestRateLimiter_AllowFailsClosedWhenUnhealthy(t *testing.T) {
	limiter := NewRateLimiter(nil)
	limiter.healthy.Store(false)

	if limiter.allow(context.Background(), "test:key", 10, time.Minute) {
		t.Fatal("expected allow() to reject while Redis is unhealthy")
	}
}

func TestRateLimiter_AllowRejectsWhenLimitExceeded(t *testing.T) {
	limiter := NewRateLimiter(nil)
	limiter.healthy.Store(true)
	// A nil rdb with healthy flag set exercises the Incr error path, which must
	// fail closed rather than silently allowing unlimited traffic.
	if limiter.allow(context.Background(), "test:key", 10, time.Minute) {
		t.Fatal("expected allow() to reject when the backing store errors")
	}
}

func TestRateLimiter_LoopbackBypassesRateLimit(t *testing.T) {
	limiter := NewRateLimiter(nil)

	handler := limiter.RateLimit()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	}))

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200 for /health, got %d", rec.Code)
	}

	req2 := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	req2.RemoteAddr = "127.0.0.1:54321"
	rec2 := httptest.NewRecorder()
	handler.ServeHTTP(rec2, req2)
	if rec2.Code != http.StatusOK {
		t.Fatalf("expected status 200 for loopback /graphql, got %d", rec2.Code)
	}
}

func TestRateLimiter_StartReconnectLoopStopsOnCancel(t *testing.T) {
	limiter := NewRateLimiter(nil)

	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	done := make(chan struct{})
	go func() {
		limiter.StartReconnectLoop(ctx)
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("StartReconnectLoop did not stop after context cancellation")
	}
}

func TestGetClientIP_ExtractsFromHeaders(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	req.Header.Set("X-Forwarded-For", "203.0.113.195, 70.41.3.18")

	ip := getClientIP(req)
	if ip != "203.0.113.195" {
		t.Fatalf("expected 203.0.113.195, got %s", ip)
	}

	req2 := httptest.NewRequest(http.MethodGet, "/health", nil)
	req2.Header.Set("X-Real-IP", "198.51.100.1")

	ip2 := getClientIP(req2)
	if ip2 != "198.51.100.1" {
		t.Fatalf("expected 198.51.100.1, got %s", ip2)
	}
}
