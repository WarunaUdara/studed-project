package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const testAccessSecret = "test-access-secret"

func signToken(t *testing.T, secret string, claims jwt.MapClaims) string {
	t.Helper()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("failed to sign test token: %v", err)
	}
	return signed
}

func validClaims() jwt.MapClaims {
	return jwt.MapClaims{
		"user_id":            "user-1",
		"email":              "student@example.com",
		"full_name":          "Test Student",
		"role":               "STUDENT",
		"preferred_language": "en",
		"exp":                time.Now().Add(time.Hour).Unix(),
	}
}

func runThroughAuth(t *testing.T, req *http.Request) (UserContext, bool) {
	t.Helper()
	var captured UserContext
	var ok bool

	handler := Auth(testAccessSecret)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		captured, ok = UserFromContext(r.Context())
	}))

	handler.ServeHTTP(httptest.NewRecorder(), req)
	return captured, ok
}

func TestAuth_AuthorizationHeaderSetsUserContext(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	req.Header.Set("Authorization", "Bearer "+signToken(t, testAccessSecret, validClaims()))

	user, ok := runThroughAuth(t, req)
	if !ok {
		t.Fatal("expected user context to be set for a valid Authorization header")
	}
	if user.UserID != "user-1" || user.Role != "STUDENT" {
		t.Fatalf("unexpected user context: %+v", user)
	}
}

func TestAuth_FallsBackToAccessTokenCookie(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	req.AddCookie(&http.Cookie{Name: "access_token", Value: signToken(t, testAccessSecret, validClaims())})

	user, ok := runThroughAuth(t, req)
	if !ok {
		t.Fatal("expected user context to be set from the access_token cookie")
	}
	if user.Email != "student@example.com" {
		t.Fatalf("unexpected user context: %+v", user)
	}
}

func TestAuth_AuthorizationHeaderTakesPrecedenceOverCookie(t *testing.T) {
	headerClaims := validClaims()
	headerClaims["user_id"] = "header-user"
	cookieClaims := validClaims()
	cookieClaims["user_id"] = "cookie-user"

	req := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	req.Header.Set("Authorization", "Bearer "+signToken(t, testAccessSecret, headerClaims))
	req.AddCookie(&http.Cookie{Name: "access_token", Value: signToken(t, testAccessSecret, cookieClaims)})

	user, ok := runThroughAuth(t, req)
	if !ok {
		t.Fatal("expected user context to be set")
	}
	if user.UserID != "header-user" {
		t.Fatalf("expected the Authorization header to win over the cookie, got %q", user.UserID)
	}
}

func TestAuth_MissingTokenPassesThroughUnauthenticated(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/graphql", nil)

	_, ok := runThroughAuth(t, req)
	if ok {
		t.Fatal("expected no user context for a request with no token")
	}
}

func TestAuth_InvalidTokenPassesThroughUnauthenticated(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	req.Header.Set("Authorization", "Bearer not-a-real-token")

	_, ok := runThroughAuth(t, req)
	if ok {
		t.Fatal("expected no user context for a malformed token (fails open to the resolver-level auth check)")
	}
}

func TestAuth_WrongSigningSecretIsRejected(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	req.Header.Set("Authorization", "Bearer "+signToken(t, "a-different-secret", validClaims()))

	_, ok := runThroughAuth(t, req)
	if ok {
		t.Fatal("expected a token signed with the wrong secret to be rejected")
	}
}

func TestAuth_ExpiredTokenIsRejected(t *testing.T) {
	claims := validClaims()
	claims["exp"] = time.Now().Add(-time.Hour).Unix()

	req := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	req.Header.Set("Authorization", "Bearer "+signToken(t, testAccessSecret, claims))

	_, ok := runThroughAuth(t, req)
	if ok {
		t.Fatal("expected an expired token to be rejected")
	}
}

func TestAuth_RejectsNoneAlgorithm(t *testing.T) {
	// "alg confusion" — a token signed with the "none" algorithm must never
	// be accepted regardless of claims content.
	unsafeToken := jwt.NewWithClaims(jwt.SigningMethodNone, validClaims())
	signed, err := unsafeToken.SignedString(jwt.UnsafeAllowNoneSignatureType)
	if err != nil {
		t.Fatalf("failed to build none-alg token: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	req.Header.Set("Authorization", "Bearer "+signed)

	_, ok := runThroughAuth(t, req)
	if ok {
		t.Fatal("expected a token using the 'none' algorithm to be rejected")
	}
}
