package service

import (
	"context"
	"fmt"

	"github.com/studed/gamification-service/internal/repository"
	gampb "github.com/studed/shared/proto/gen/go/gamification"
)

type GamificationService interface {
	CalculateAndAwardXp(ctx context.Context, userID, waveID string, score, xpReward, passingThreshold int32) (*gampb.XpCalculationResponse, error)
	AwardXp(ctx context.Context, userID string, amount int32, reason, sourceID string) (*gampb.AwardXpResponse, error)
	GetUserXp(ctx context.Context, userID string) (*gampb.GetUserXpResponse, error)
	GetLeaderboard(ctx context.Context, scope, courseID string, grade int32, limit int32) (*gampb.GetLeaderboardResponse, error)
	UpdateLeaderboard(ctx context.Context, userID, fullName string, totalXp int32, scope, courseID string, grade int32) (*gampb.UpdateLeaderboardResponse, error)
}

type gamificationService struct {
	xpRepo          repository.XpRepository
	leaderboardRepo repository.LeaderboardRepository
}

func NewGamificationService(xpRepo repository.XpRepository, leaderboardRepo repository.LeaderboardRepository) GamificationService {
	return &gamificationService{
		xpRepo:          xpRepo,
		leaderboardRepo: leaderboardRepo,
	}
}

func (s *gamificationService) CalculateAndAwardXp(ctx context.Context, userID, waveID string, score, xpReward, passingThreshold int32) (*gampb.XpCalculationResponse, error) {
	if userID == "" || waveID == "" {
		return nil, fmt.Errorf("user id and wave id are required")
	}

	if score < passingThreshold {
		return &gampb.XpCalculationResponse{
			XpEarned: 0,
			TotalXp:  0,
		}, nil
	}

	xpEarned := calculateXp(score, xpReward, passingThreshold)

	totalXp, err := s.xpRepo.AddXp(ctx, userID, xpEarned, "wave_completed", waveID)
	if err != nil {
		return nil, fmt.Errorf("failed to award xp: %w", err)
	}

	return &gampb.XpCalculationResponse{
		XpEarned: xpEarned,
		TotalXp:  totalXp,
	}, nil
}

func calculateXp(score, xpReward, passingThreshold int32) int32 {
	if score >= 100 {
		return xpReward
	}
	if score >= 80 {
		return int32(float64(xpReward) * 0.8)
	}
	if score >= 60 {
		return int32(float64(xpReward) * 0.6)
	}
	if score >= passingThreshold {
		return int32(float64(xpReward) * 0.4)
	}
	return 0
}

func (s *gamificationService) AwardXp(ctx context.Context, userID string, amount int32, reason, sourceID string) (*gampb.AwardXpResponse, error) {
	if userID == "" {
		return nil, fmt.Errorf("user id is required")
	}

	totalXp, err := s.xpRepo.AddXp(ctx, userID, amount, reason, sourceID)
	if err != nil {
		return nil, fmt.Errorf("failed to award xp: %w", err)
	}

	return &gampb.AwardXpResponse{
		TotalXp: totalXp,
	}, nil
}

func (s *gamificationService) GetUserXp(ctx context.Context, userID string) (*gampb.GetUserXpResponse, error) {
	if userID == "" {
		return nil, fmt.Errorf("user id is required")
	}

	totalXp, err := s.xpRepo.GetUserXp(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user xp: %w", err)
	}

	return &gampb.GetUserXpResponse{
		TotalXp: totalXp,
	}, nil
}

func (s *gamificationService) GetLeaderboard(ctx context.Context, scope, courseID string, grade int32, limit int32) (*gampb.GetLeaderboardResponse, error) {
	entries, err := s.leaderboardRepo.GetLeaderboard(ctx, scope, courseID, grade, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get leaderboard: %w", err)
	}

	return &gampb.GetLeaderboardResponse{
		Entries: entries,
	}, nil
}

func (s *gamificationService) UpdateLeaderboard(ctx context.Context, userID, fullName string, totalXp int32, scope, courseID string, grade int32) (*gampb.UpdateLeaderboardResponse, error) {
	if err := s.leaderboardRepo.UpdateLeaderboard(ctx, userID, fullName, totalXp, scope, courseID, grade); err != nil {
		return nil, fmt.Errorf("failed to update leaderboard: %w", err)
	}
	return &gampb.UpdateLeaderboardResponse{}, nil
}
