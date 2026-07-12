package middleware

import (
	"context"
	"net/http"
)

type responseWriterKey struct{}
type requestKey struct{}

func WithResponseWriter(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), responseWriterKey{}, w)
		ctx = context.WithValue(ctx, requestKey{}, r)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func ResponseWriterFromContext(ctx context.Context) (http.ResponseWriter, bool) {
	w, ok := ctx.Value(responseWriterKey{}).(http.ResponseWriter)
	return w, ok
}

func RequestFromContext(ctx context.Context) (*http.Request, bool) {
	r, ok := ctx.Value(requestKey{}).(*http.Request)
	return r, ok
}
