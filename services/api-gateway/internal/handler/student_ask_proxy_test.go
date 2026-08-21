package handler

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestStudentAskProxyRequiresASignedInUser(t *testing.T) {
	proxy := NewStudentAskProxy("http://unreachable:9999")

	req := httptest.NewRequest(http.MethodPost, "/ai/ask", strings.NewReader(`{"prompt":"why is my bulb dark?"}`))
	rec := httptest.NewRecorder()
	proxy.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 without auth, got %d", rec.Code)
	}
}

// Unlike the educator chat, a student must be able to use this one: it is the
// whole point of the lesson tutor.
func TestStudentAskProxyAllowsStudents(t *testing.T) {
	proxy := NewStudentAskProxy("http://unreachable:9999")

	req := httptest.NewRequest(http.MethodPost, "/ai/ask", strings.NewReader(`{"prompt":"why is my bulb dark?"}`))
	rec := httptest.NewRecorder()
	proxy.ServeHTTP(rec, withUser(req, "u1", "STUDENT"))

	// The upstream is unreachable in tests, so a permitted request fails at the
	// proxy hop rather than at the role check.
	if rec.Code != http.StatusBadGateway {
		t.Errorf("expected the student to pass authorization and fail upstream, got %d", rec.Code)
	}
}

func TestStudentAskProxyRejectsEmptyPromptAndNonPost(t *testing.T) {
	proxy := NewStudentAskProxy("http://unreachable:9999")

	req := httptest.NewRequest(http.MethodPost, "/ai/ask", strings.NewReader(`{}`))
	rec := httptest.NewRecorder()
	proxy.ServeHTTP(rec, withUser(req, "u1", "STUDENT"))
	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for an empty prompt, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodGet, "/ai/ask", nil)
	rec = httptest.NewRecorder()
	proxy.ServeHTTP(rec, withUser(req, "u1", "STUDENT"))
	if rec.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected 405 for GET, got %d", rec.Code)
	}
}

func TestStudentAskProxyCapsTheRequestBody(t *testing.T) {
	proxy := NewStudentAskProxy("http://unreachable:9999")

	// A body past the cap is truncated mid-JSON, so it fails to parse and is
	// rejected rather than being forwarded upstream.
	huge := `{"prompt":"` + strings.Repeat("x", maxStudentAskBytes+1024) + `"}`
	req := httptest.NewRequest(http.MethodPost, "/ai/ask", strings.NewReader(huge))
	rec := httptest.NewRecorder()
	proxy.ServeHTTP(rec, withUser(req, "u1", "STUDENT"))
	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected an oversized question to be rejected, got %d", rec.Code)
	}
}
