package handler

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCodeRunProxyRequiresASignedInUser(t *testing.T) {
	proxy := NewCodeRunProxy("http://unreachable:9999")
	req := httptest.NewRequest(http.MethodPost, "/code/run", strings.NewReader(`{"code":"print(1)"}`))
	rec := httptest.NewRecorder()
	proxy.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 without auth, got %d", rec.Code)
	}
}

func TestCodeRunProxyLetsStudentsRunCode(t *testing.T) {
	proxy := NewCodeRunProxy("http://unreachable:9999")
	req := httptest.NewRequest(http.MethodPost, "/code/run", strings.NewReader(`{"code":"print(1)"}`))
	rec := httptest.NewRecorder()
	proxy.ServeHTTP(rec, withUser(req, "u1", "STUDENT"))
	// Authorized, so it fails at the unreachable upstream rather than on role.
	if rec.Code != http.StatusBadGateway {
		t.Errorf("expected the student to pass authorization, got %d", rec.Code)
	}
}

func TestCodeRunProxyRejectsEmptyCodeAndNonPost(t *testing.T) {
	proxy := NewCodeRunProxy("http://unreachable:9999")

	req := httptest.NewRequest(http.MethodPost, "/code/run", strings.NewReader(`{"code":""}`))
	rec := httptest.NewRecorder()
	proxy.ServeHTTP(rec, withUser(req, "u1", "STUDENT"))
	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for empty code, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodGet, "/code/run", nil)
	rec = httptest.NewRecorder()
	proxy.ServeHTTP(rec, withUser(req, "u1", "STUDENT"))
	if rec.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected 405 for GET, got %d", rec.Code)
	}
}

func TestCodeRunProxyPassesTheSandboxResponseThrough(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"stdout":"","stderr":"ZeroDivisionError: division by zero","exitCode":1}`))
	}))
	defer upstream.Close()

	proxy := NewCodeRunProxy(upstream.URL)
	req := httptest.NewRequest(http.MethodPost, "/code/run", strings.NewReader(`{"code":"print(1/0)"}`))
	rec := httptest.NewRecorder()
	proxy.ServeHTTP(rec, withUser(req, "u1", "STUDENT"))

	if rec.Code != http.StatusOK {
		t.Fatalf("a crashing program must come back as 200, got %d", rec.Code)
	}
	if !strings.Contains(rec.Body.String(), "ZeroDivisionError") {
		t.Errorf("the traceback must reach the student verbatim, got %q", rec.Body.String())
	}
}
