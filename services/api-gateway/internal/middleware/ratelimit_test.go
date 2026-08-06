package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRateLimiter_NilRdbFailsOpen(t *testing.T) {
	limiter := NewRateLimiter(nil)

	handler := limiter.RateLimit()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	}))

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status OK 200 when rdb is nil, got %d", rec.Code)
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
