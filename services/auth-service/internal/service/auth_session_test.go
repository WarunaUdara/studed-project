package service

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/studed/auth-service/internal/jwt"
	"github.com/studed/auth-service/internal/model"
)

func TestAuthSession_RefreshTokenRotation(t *testing.T) {
	repo := &inMemoryUserRepo{}
	jwtMgr := jwt.NewManager("access-secret", "refresh-secret", 15*time.Minute, 60*time.Minute)
	svc := NewAuthService(repo, jwtMgr)
	ctx := context.Background()

	// 1. Register user
	grade := model.GradeG10
	regResp, err := svc.Register(ctx, "session-test@example.com", "password1234", "Session User", &grade, "en")
	if err != nil {
		t.Fatalf("register failed: %v", err)
	}

	// 2. Refresh token using valid refresh token
	refResp, err := svc.RefreshToken(ctx, regResp.RefreshToken)
	if err != nil {
		t.Fatalf("refresh token failed: %v", err)
	}

	if refResp.AccessToken == "" {
		t.Fatalf("expected non-empty new access token")
	}
	if refResp.RefreshToken == "" {
		t.Fatalf("expected non-empty new refresh token")
	}
	if refResp.RefreshToken == regResp.RefreshToken {
		t.Fatalf("expected refresh token rotation to produce a new refresh token")
	}
}

func TestAuthSession_ExpiredOrInvalidRefreshTokenRejected(t *testing.T) {
	repo := &inMemoryUserRepo{}
	jwtMgr := jwt.NewManager("access-secret", "refresh-secret", 15*time.Minute, -1*time.Minute) // Expired immediately
	svc := NewAuthService(repo, jwtMgr)
	ctx := context.Background()

	// Register user
	grade := model.GradeG10
	regResp, err := svc.Register(ctx, "expired-token@example.com", "password1234", "Expired User", &grade, "en")
	if err != nil {
		t.Fatalf("register failed: %v", err)
	}

	// Refresh token using expired token
	_, err = svc.RefreshToken(ctx, regResp.RefreshToken)
	if err == nil {
		t.Fatalf("expected error when refreshing with expired refresh token")
	}
	if !strings.Contains(err.Error(), "invalid") && !strings.Contains(err.Error(), "expired") {
		t.Fatalf("expected invalid/expired error message, got: %v", err)
	}
}
