package handler

import (
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// newProxy points an UploadProxy at a stub upstream that records what it saw.
func newProxy(t *testing.T) (*UploadProxy, *upstreamSpy) {
	t.Helper()

	spy := &upstreamSpy{}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		spy.called = true
		spy.authHeader = r.Header.Get("Authorization")
		spy.cookie = r.Header.Get("Cookie")
		spy.path = r.URL.Path
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"ok":true}`))
	}))
	t.Cleanup(server.Close)

	proxy, err := NewUploadProxy(server.URL, "internal-service-token", slog.New(slog.DiscardHandler))
	if err != nil {
		t.Fatalf("build proxy: %v", err)
	}
	return proxy, spy
}

type upstreamSpy struct {
	called     bool
	authHeader string
	cookie     string
	path       string
}

func TestUploadProxyAllowsAnonymousReads(t *testing.T) {
	proxy, spy := newProxy(t)

	req := httptest.NewRequest(http.MethodGet, "/v1/uploads/files/uploads/2026/08/abc.png", nil)
	rec := httptest.NewRecorder()
	proxy.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 for a public read, got %d", rec.Code)
	}
	if !spy.called {
		t.Fatal("expected the read to reach upload-service")
	}
}

func TestUploadProxyRejectsAnonymousWrite(t *testing.T) {
	proxy, spy := newProxy(t)

	req := httptest.NewRequest(http.MethodPost, "/v1/uploads", strings.NewReader("data"))
	rec := httptest.NewRecorder()
	proxy.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for an anonymous upload, got %d", rec.Code)
	}
	if spy.called {
		t.Fatal("anonymous upload must not reach upload-service")
	}
}

// A logged-in student must not be able to write to course storage.
func TestUploadProxyRejectsStudentWrite(t *testing.T) {
	proxy, spy := newProxy(t)

	req := withUser(httptest.NewRequest(http.MethodPost, "/v1/uploads", strings.NewReader("data")), "user-1", "STUDENT")
	rec := httptest.NewRecorder()
	proxy.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for a student upload, got %d", rec.Code)
	}
	if spy.called {
		t.Fatal("student upload must not reach upload-service")
	}
}

func TestUploadProxyAllowsEducatorWriteAndInjectsServiceToken(t *testing.T) {
	proxy, spy := newProxy(t)

	req := withUser(httptest.NewRequest(http.MethodPost, "/v1/uploads", strings.NewReader("data")), "user-1", "EDUCATOR")
	req.Header.Set("Cookie", "access_token=secret-session")
	rec := httptest.NewRecorder()
	proxy.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 for an educator upload, got %d", rec.Code)
	}
	if spy.authHeader != "Bearer internal-service-token" {
		t.Errorf("expected the service token upstream, got %q", spy.authHeader)
	}
	// The end user's session cookie must never be forwarded to an internal service.
	if spy.cookie != "" {
		t.Errorf("expected the user cookie to be stripped, got %q", spy.cookie)
	}
}

func TestUploadProxyAllowsEducatorDelete(t *testing.T) {
	proxy, spy := newProxy(t)

	req := withUser(httptest.NewRequest(http.MethodDelete, "/v1/uploads/files/uploads/2026/08/abc.png", nil), "user-1", "ADMIN")
	rec := httptest.NewRecorder()
	proxy.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 for an admin delete, got %d", rec.Code)
	}
	if !spy.called {
		t.Fatal("expected the delete to reach upload-service")
	}
}

// Only the files/ subtree is publicly readable; a bare GET must not expose
// anything else upload-service might serve later.
func TestUploadProxyRejectsUnknownPublicRead(t *testing.T) {
	proxy, spy := newProxy(t)

	req := httptest.NewRequest(http.MethodGet, "/v1/uploads", nil)
	rec := httptest.NewRecorder()
	proxy.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rec.Code)
	}
	if spy.called {
		t.Fatal("unexpected upstream call")
	}
}

func TestUploadProxyRejectsUnsupportedMethod(t *testing.T) {
	proxy, _ := newProxy(t)

	req := withUser(httptest.NewRequest(http.MethodPut, "/v1/uploads", nil), "user-1", "EDUCATOR")
	rec := httptest.NewRecorder()
	proxy.ServeHTTP(rec, req)

	if rec.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405 for PUT, got %d", rec.Code)
	}
}
