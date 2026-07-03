package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const UserContextKey contextKey = "user"

type UserContext struct {
	UserID            string
	Email             string
	FullName          string
	Role              string
	PreferredLanguage string
}

func Auth(accessSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tokenString := ""

			authHeader := r.Header.Get("Authorization")
			if authHeader != "" {
				tokenString = strings.TrimPrefix(authHeader, "Bearer ")
			}

			if tokenString == "" {
				if cookie, err := r.Cookie("access_token"); err == nil {
					tokenString = cookie.Value
				}
			}

			if tokenString == "" {
				next.ServeHTTP(w, r)
				return
			}

			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return []byte(accessSecret), nil
			})
			if err != nil || !token.Valid {
				next.ServeHTTP(w, r)
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				next.ServeHTTP(w, r)
				return
			}

			userCtx := UserContext{
				UserID:            stringValue(claims["user_id"]),
				Email:             stringValue(claims["email"]),
				FullName:          stringValue(claims["full_name"]),
				Role:              stringValue(claims["role"]),
				PreferredLanguage: stringValue(claims["preferred_language"]),
			}

			ctx := context.WithValue(r.Context(), UserContextKey, userCtx)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func UserFromContext(ctx context.Context) (UserContext, bool) {
	user, ok := ctx.Value(UserContextKey).(UserContext)
	return user, ok
}

func stringValue(v interface{}) string {
	s, _ := v.(string)
	return s
}
