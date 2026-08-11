// Package httpauth provides a small, shared service-to-service token
// middleware used by internal HTTP services (payment, notification).
package httpauth

import (
	"crypto/subtle"
	"net/http"
	"strings"
)

// ServiceTokenMiddleware rejects any request that does not carry the shared
// service token in an "Authorization: Bearer <token>" header (or the legacy
// "X-Service-Token" header). An empty expected token means the service is
// misconfigured and refuses all requests rather than silently opening access.
func ServiceTokenMiddleware(expectedToken string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !validToken(r, expectedToken) {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// ValidToken reports whether r carries the expected service token. It is
// exported for services that protect only some routes (upload-service serves
// public reads but token-guarded writes) and so cannot wrap the whole mux.
func ValidToken(r *http.Request, expected string) bool {
	return validToken(r, expected)
}

func validToken(r *http.Request, expected string) bool {
	if expected == "" {
		return false
	}
	if auth := r.Header.Get("Authorization"); strings.HasPrefix(auth, "Bearer ") {
		return subtle.ConstantTimeCompare([]byte(strings.TrimPrefix(auth, "Bearer ")), []byte(expected)) == 1
	}
	if tok := r.Header.Get("X-Service-Token"); tok != "" {
		return subtle.ConstantTimeCompare([]byte(tok), []byte(expected)) == 1
	}
	return false
}
