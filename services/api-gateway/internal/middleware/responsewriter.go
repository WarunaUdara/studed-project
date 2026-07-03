package middleware

import (
	"context"
	"net/http"
)

type responseWriterKey struct{}

func WithResponseWriter(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), responseWriterKey{}, w)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func ResponseWriterFromContext(ctx context.Context) (http.ResponseWriter, bool) {
	w, ok := ctx.Value(responseWriterKey{}).(http.ResponseWriter)
	return w, ok
}
