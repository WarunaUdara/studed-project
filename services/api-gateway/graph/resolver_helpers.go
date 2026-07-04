package graph

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/studed/api-gateway/internal/middleware"
)

func requireUser(ctx context.Context) (middleware.UserContext, error) {
	userCtx, ok := middleware.UserFromContext(ctx)
	if !ok || userCtx.UserID == "" {
		return middleware.UserContext{}, errors.New("unauthorized")
	}
	return userCtx, nil
}

func requireEducator(userCtx middleware.UserContext) error {
	switch userCtx.Role {
	case "EDUCATOR", "HEAD_EDUCATOR", "ADMIN":
		return nil
	default:
		return errors.New("forbidden: educator role required")
	}
}

func setAuthCookies(ctx context.Context, accessToken, refreshToken string) {
	w, ok := middleware.ResponseWriterFromContext(ctx)
	if !ok {
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
		MaxAge:   int(15 * time.Minute / time.Second),
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
		MaxAge:   int(7 * 24 * time.Hour / time.Second),
	})
}
