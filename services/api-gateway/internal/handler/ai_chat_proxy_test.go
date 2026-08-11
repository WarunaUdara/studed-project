package handler

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/studed/api-gateway/internal/middleware"
)

func withUser(r *http.Request, userID, role string) *http.Request {
	ctx := context.WithValue(r.Context(), middleware.UserContextKey, middleware.UserContext{
		UserID: userID,
		Role:   role,
	})
	return r.WithContext(ctx)
}

func TestAIChatProxyRequiresAuth(t *testing.T) {
	proxy := NewAIChatProxy("http://unreachable:9999")

	// No user context at all.
	req := httptest.NewRequest(http.MethodPost, "/ai/chat", strings.NewReader(`{"prompt":"hi"}`))
	rec := httptest.NewRecorder()
	proxy.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 without auth, got %d", rec.Code)
	}

	// Student is forbidden.
	req = httptest.NewRequest(http.MethodPost, "/ai/chat", strings.NewReader(`{"prompt":"hi"}`))
	rec = httptest.NewRecorder()
	proxy.ServeHTTP(rec, withUser(req, "u1", "STUDENT"))
	if rec.Code != http.StatusForbidden {
		t.Errorf("expected 403 for student, got %d", rec.Code)
	}
}

func TestAIChatProxyRejectsEmptyPrompt(t *testing.T) {
	proxy := NewAIChatProxy("http://unreachable:9999")
	req := httptest.NewRequest(http.MethodPost, "/ai/chat", strings.NewReader(`{}`))
	rec := httptest.NewRecorder()
	proxy.ServeHTTP(rec, withUser(req, "u1", "EDUCATOR"))
	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for empty prompt, got %d", rec.Code)
	}
}

func TestAIChatProxyRejectsNonPost(t *testing.T) {
	proxy := NewAIChatProxy("http://unreachable:9999")
	req := httptest.NewRequest(http.MethodGet, "/ai/chat", nil)
	rec := httptest.NewRecorder()
	proxy.ServeHTTP(rec, withUser(req, "u1", "EDUCATOR"))
	if rec.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected 405 for GET, got %d", rec.Code)
	}
}
