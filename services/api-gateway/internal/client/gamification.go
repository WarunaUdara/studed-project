package client

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/studed/api-gateway/graph/model"
	gampb "github.com/studed/shared/proto/gen/go/gamification"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type GamificationClient struct {
	client gampb.GamificationServiceClient
	conn   *grpc.ClientConn
}

func NewGamificationClient(addr string) (*GamificationClient, error) {
	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to gamification service: %w", err)
	}

	return &GamificationClient{
		client: gampb.NewGamificationServiceClient(conn),
		conn:   conn,
	}, nil
}

func (c *GamificationClient) Close() error {
	return c.conn.Close()
}

func (c *GamificationClient) GetUserXp(ctx context.Context, userID string) (int, error) {
	resp, err := c.client.GetUserXp(ctx, &gampb.GetUserXpRequest{UserId: userID})
	if err != nil {
		return 0, fmt.Errorf("get user xp failed: %w", err)
	}
	if resp.Error != "" {
		return 0, fmt.Errorf("get user xp failed: %s", resp.Error)
	}
	return int(resp.TotalXp), nil
}

func (c *GamificationClient) GetLeaderboard(ctx context.Context, scope model.LeaderboardScope, courseID *string, grade *model.Grade, limit int32) ([]*model.LeaderboardEntry, error) {
	req := &gampb.GetLeaderboardRequest{
		Scope: string(scope),
		Limit: limit,
	}
	if courseID != nil {
		req.CourseId = *courseID
	}
	if grade != nil {
		req.Grade = modelGradeToProto(*grade)
	}

	resp, err := c.client.GetLeaderboard(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("get leaderboard failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("get leaderboard failed: %s", resp.Error)
	}

	entries := make([]*model.LeaderboardEntry, len(resp.Entries))
	for i, e := range resp.Entries {
		entries[i] = &model.LeaderboardEntry{
			Rank:   int(e.Rank),
			User:   &model.User{ID: e.UserId, FullName: e.FullName},
			TotalXp: int(e.TotalXp),
		}
	}

	return entries, nil
}

func (c *GamificationClient) UpdateLeaderboard(ctx context.Context, userID, fullName string, totalXp int, scope model.LeaderboardScope, courseID string, grade *model.Grade) (*gampb.UpdateLeaderboardResponse, error) {
	req := &gampb.UpdateLeaderboardRequest{
		UserId:   userID,
		FullName: fullName,
		TotalXp:  int32(totalXp),
		Scope:    string(scope),
		CourseId: courseID,
	}
	if grade != nil {
		req.Grade = modelGradeToProto(*grade)
	}

	resp, err := c.client.UpdateLeaderboard(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("update leaderboard failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("update leaderboard failed: %s", resp.Error)
	}
	return resp, nil
}

func (c *GamificationClient) GetMyRank(ctx context.Context, userID string, scope model.LeaderboardScope, courseID *string, grade *model.Grade) (int, error) {
	req := &gampb.GetRankRequest{
		UserId: userID,
		Scope:  string(scope),
	}
	if courseID != nil {
		req.CourseId = *courseID
	}
	if grade != nil {
		req.Grade = modelGradeToProto(*grade)
	}

	resp, err := c.client.GetRank(ctx, req)
	if err != nil {
		return 0, fmt.Errorf("get my rank failed: %w", err)
	}
	if resp.Error != "" {
		if strings.Contains(resp.Error, "not found") {
			return 0, nil
		}
		return 0, fmt.Errorf("get my rank failed: %s", resp.Error)
	}

	return int(resp.Rank), nil
}

func (c *GamificationClient) GetUserStreak(ctx context.Context, userID string) (int, error) {
	resp, err := c.client.GetUserStreak(ctx, &gampb.GetUserStreakRequest{UserId: userID})
	if err != nil {
		return 0, fmt.Errorf("get user streak failed: %w", err)
	}
	if resp.Error != "" {
		return 0, fmt.Errorf("get user streak failed: %s", resp.Error)
	}
	return int(resp.CurrentStreak), nil
}

func (c *GamificationClient) GetAchievements(ctx context.Context, userID string) ([]*model.Achievement, error) {
	resp, err := c.client.GetAchievements(ctx, &gampb.GetAchievementsRequest{UserId: userID})
	if err != nil {
		return nil, fmt.Errorf("get achievements failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("get achievements failed: %s", resp.Error)
	}

	achievements := make([]*model.Achievement, len(resp.Achievements))
	for i, a := range resp.Achievements {
		unlockedAt := time.Unix(a.UnlockedAtUnix, 0)
		achievements[i] = &model.Achievement{
			ID:          a.Id,
			Name:        a.Name,
			Description: a.Description,
			IconURL:     &a.IconUrl,
			UnlockedAt:  unlockedAt,
		}
	}
	return achievements, nil
}

