package graph

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/studed/api-gateway/internal/middleware"
)

func TestRequireUser_ReturnsUserWhenPresent(t *testing.T) {
	ctx := context.WithValue(context.Background(), middleware.UserContextKey, middleware.UserContext{
		UserID: "user-1", Role: "STUDENT",
	})

	user, err := requireUser(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if user.UserID != "user-1" {
		t.Fatalf("unexpected user: %+v", user)
	}
}

func TestRequireUser_RejectsMissingContext(t *testing.T) {
	if _, err := requireUser(context.Background()); err == nil {
		t.Fatal("expected an unauthorized error when no user is in context")
	}
}

func TestRequireUser_RejectsEmptyUserID(t *testing.T) {
	ctx := context.WithValue(context.Background(), middleware.UserContextKey, middleware.UserContext{
		UserID: "", Role: "STUDENT",
	})
	if _, err := requireUser(ctx); err == nil {
		t.Fatal("expected an unauthorized error for a user context with an empty user id")
	}
}

func TestRequireEducator_AllowsEducatorRoles(t *testing.T) {
	for _, role := range []string{"EDUCATOR", "HEAD_EDUCATOR", "ADMIN"} {
		if err := requireEducator(middleware.UserContext{Role: role}); err != nil {
			t.Fatalf("expected role %s to be allowed, got error: %v", role, err)
		}
	}
}

func TestRequireEducator_RejectsStudent(t *testing.T) {
	if err := requireEducator(middleware.UserContext{Role: "STUDENT"}); err == nil {
		t.Fatal("expected a forbidden error for a STUDENT role")
	}
}

func TestSetAuthCookies_SetsHttpOnlySecureCookies(t *testing.T) {
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/graphql", nil)

	var cookies []*http.Cookie
	middleware.WithResponseWriter(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		setAuthCookies(r.Context(), "access-token-value", "refresh-token-value")
		cookies = w.(*httptest.ResponseRecorder).Result().Cookies()
	})).ServeHTTP(rec, req)

	var access, refresh *http.Cookie
	for _, c := range cookies {
		switch c.Name {
		case "access_token":
			access = c
		case "refresh_token":
			refresh = c
		}
	}

	if access == nil || access.Value != "access-token-value" {
		t.Fatalf("expected an access_token cookie with the right value, got %+v", access)
	}
	if !access.HttpOnly {
		t.Fatal("expected access_token cookie to be HttpOnly")
	}
	if refresh == nil || refresh.Value != "refresh-token-value" {
		t.Fatalf("expected a refresh_token cookie with the right value, got %+v", refresh)
	}
	if refresh.MaxAge <= access.MaxAge {
		t.Fatalf("expected refresh token to outlive access token, got access=%d refresh=%d", access.MaxAge, refresh.MaxAge)
	}
}
