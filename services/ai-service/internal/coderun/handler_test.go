package coderun

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func testHandler(t *testing.T) http.Handler {
	t.Helper()
	mux := http.NewServeMux()
	NewHandler(New(Config{Timeout: 3 * time.Second}), slog.New(slog.NewTextHandler(io.Discard, nil))).Register(mux)
	return mux
}

func TestRunCodeEndpointReturnsOutput(t *testing.T) {
	r := New(Config{})
	if !r.Available() {
		t.Skip("no python interpreter on this machine")
	}

	req := httptest.NewRequest(http.MethodPost, "/v1/run-code", strings.NewReader(`{"code":"print(6*7)"}`))
	rec := httptest.NewRecorder()
	testHandler(t).ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
	var result Result
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("response was not a run result: %v", err)
	}
	if strings.TrimSpace(result.Stdout) != "42" {
		t.Errorf("expected the printed value, got %q", result.Stdout)
	}
}

func TestRunCodeEndpointRejectsAnEmptyProgram(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/v1/run-code", strings.NewReader(`{"code":""}`))
	rec := httptest.NewRecorder()
	testHandler(t).ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for an empty program, got %d", rec.Code)
	}
}

func TestRunCodeEndpointRejectsMalformedJSON(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/v1/run-code", strings.NewReader(`{not json`))
	rec := httptest.NewRecorder()
	testHandler(t).ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for malformed JSON, got %d", rec.Code)
	}
}

// A failing program is a normal 200 with a traceback, not an HTTP error: the
// panel needs the traceback to show it.
func TestRunCodeEndpointReturns200ForAFailingProgram(t *testing.T) {
	r := New(Config{})
	if !r.Available() {
		t.Skip("no python interpreter on this machine")
	}

	req := httptest.NewRequest(http.MethodPost, "/v1/run-code", strings.NewReader(`{"code":"raise ValueError('nope')"}`))
	rec := httptest.NewRecorder()
	testHandler(t).ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 for a crashing program, got %d", rec.Code)
	}
	var result Result
	_ = json.Unmarshal(rec.Body.Bytes(), &result)
	if !strings.Contains(result.Stderr, "ValueError") {
		t.Errorf("expected the traceback in the response, got %q", result.Stderr)
	}
}

func TestRunCodeEndpointSaysSoWhenPythonIsMissing(t *testing.T) {
	mux := http.NewServeMux()
	runner := New(Config{})
	runner.python = ""
	NewHandler(runner, slog.New(slog.NewTextHandler(io.Discard, nil))).Register(mux)

	req := httptest.NewRequest(http.MethodPost, "/v1/run-code", strings.NewReader(`{"code":"print(1)"}`))
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("expected 503 when no interpreter is installed, got %d", rec.Code)
	}
}
