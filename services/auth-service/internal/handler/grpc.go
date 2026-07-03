package handler

import (
	"context"

	"github.com/studed/auth-service/internal/jwt"
	"github.com/studed/auth-service/internal/model"
	"github.com/studed/auth-service/internal/service"
	authpb "github.com/studed/shared/proto/gen/go"
)

type AuthGRPCHandler struct {
	authpb.UnimplementedAuthServiceServer
	svc service.AuthService
}

func NewAuthGRPCHandler(svc service.AuthService) *AuthGRPCHandler {
	return &AuthGRPCHandler{svc: svc}
}

func (h *AuthGRPCHandler) Register(ctx context.Context, req *authpb.RegisterRequest) (*authpb.AuthResponse, error) {
	var grade *model.Grade
	if req.Grade != authpb.Grade_GRADE_UNSPECIFIED {
		g := service.ProtoToModelGrade(req.Grade)
		if g != nil {
			grade = g
		}
	}

	resp, err := h.svc.Register(
		ctx,
		req.Email,
		req.Password,
		req.FullName,
		service.ProtoToModelRole(req.Role),
		grade,
		req.PreferredLanguage,
	)
	if err != nil {
		return &authpb.AuthResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *AuthGRPCHandler) Login(ctx context.Context, req *authpb.LoginRequest) (*authpb.AuthResponse, error) {
	resp, err := h.svc.Login(ctx, req.Email, req.Password)
	if err != nil {
		return &authpb.AuthResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *AuthGRPCHandler) ValidateToken(ctx context.Context, req *authpb.ValidateTokenRequest) (*authpb.ValidateTokenResponse, error) {
	return h.svc.ValidateToken(ctx, req.AccessToken)
}

func EnsureJWTManagerInContext(ctx context.Context, mgr *jwt.Manager) context.Context {
	return jwt.ContextWithUserID(ctx, "")
}
