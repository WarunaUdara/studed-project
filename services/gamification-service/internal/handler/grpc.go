package handler

import (
	"context"

	"github.com/studed/gamification-service/internal/service"
	gampb "github.com/studed/shared/proto/gen/go/gamification"
)

type GamificationGRPCHandler struct {
	gampb.UnimplementedGamificationServiceServer
	svc service.GamificationService
}

func NewGamificationGRPCHandler(svc service.GamificationService) *GamificationGRPCHandler {
	return &GamificationGRPCHandler{svc: svc}
}

func (h *GamificationGRPCHandler) CalculateAndAwardXp(ctx context.Context, req *gampb.XpCalculationRequest) (*gampb.XpCalculationResponse, error) {
	resp, err := h.svc.CalculateAndAwardXp(ctx, req.UserId, req.WaveId, req.Score, req.XpReward, req.PassingThreshold)
	if err != nil {
		return &gampb.XpCalculationResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *GamificationGRPCHandler) AwardXp(ctx context.Context, req *gampb.AwardXpRequest) (*gampb.AwardXpResponse, error) {
	resp, err := h.svc.AwardXp(ctx, req.UserId, req.Amount, req.Reason, req.SourceId)
	if err != nil {
		return &gampb.AwardXpResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *GamificationGRPCHandler) GetUserXp(ctx context.Context, req *gampb.GetUserXpRequest) (*gampb.GetUserXpResponse, error) {
	resp, err := h.svc.GetUserXp(ctx, req.UserId)
	if err != nil {
		return &gampb.GetUserXpResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *GamificationGRPCHandler) GetLeaderboard(ctx context.Context, req *gampb.GetLeaderboardRequest) (*gampb.GetLeaderboardResponse, error) {
	resp, err := h.svc.GetLeaderboard(ctx, req.Scope, req.CourseId, int32(req.Grade), req.Limit)
	if err != nil {
		return &gampb.GetLeaderboardResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *GamificationGRPCHandler) UpdateLeaderboard(ctx context.Context, req *gampb.UpdateLeaderboardRequest) (*gampb.UpdateLeaderboardResponse, error) {
	resp, err := h.svc.UpdateLeaderboard(ctx, req.UserId, req.FullName, req.TotalXp, req.Scope, req.CourseId, int32(req.Grade))
	if err != nil {
		return &gampb.UpdateLeaderboardResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *GamificationGRPCHandler) GetRank(ctx context.Context, req *gampb.GetRankRequest) (*gampb.GetRankResponse, error) {
	resp, err := h.svc.GetRank(ctx, req.UserId, req.Scope, req.CourseId, int32(req.Grade))
	if err != nil {
		return &gampb.GetRankResponse{Error: err.Error()}, nil
	}
	return resp, nil
}
