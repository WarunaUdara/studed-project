package client

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/studed/api-gateway/graph/model"
	"github.com/studed/shared/go/grpcauth"
	gampb "github.com/studed/shared/proto/gen/go/gamification"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type GamificationClient struct {
	client gampb.GamificationServiceClient
	conn   *grpc.ClientConn
}

func NewGamificationClient(addr, serviceToken string) (*GamificationClient, error) {
	interceptors := []grpc.UnaryClientInterceptor{
		grpcauth.UnaryClientTraceInterceptor(),
		grpcauth.UnaryClientTimeoutInterceptor(60 * time.Second),
	}
	if serviceToken != "" {
		interceptors = append(interceptors, grpcauth.UnaryClientInterceptor(serviceToken))
	}
	opts := []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithChainUnaryInterceptor(interceptors...),
	}
	conn, err := grpc.NewClient(addr, opts...)
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

// GetLeaderboard returns one page of a board. Display names are masked here —
// once, on the way out — so the stored name stays intact and the masking rule
// can change without rewriting every ranked row.
func (c *GamificationClient) GetLeaderboard(ctx context.Context, viewerID string, scope model.LeaderboardScope, courseID *string, grade *model.Grade, limit, offset int32) ([]*model.LeaderboardEntry, int, error) {
	req := &gampb.GetLeaderboardRequest{
		Scope:  string(scope),
		Limit:  limit,
		Offset: offset,
	}
	if courseID != nil {
		req.CourseId = *courseID
	}
	if grade != nil {
		req.Grade = modelGradeToProto(*grade)
	}

	resp, err := c.client.GetLeaderboard(ctx, req)
	if err != nil {
		return nil, 0, fmt.Errorf("get leaderboard failed: %w", err)
	}
	if resp.Error != "" {
		return nil, 0, fmt.Errorf("get leaderboard failed: %s", resp.Error)
	}

	entries := make([]*model.LeaderboardEntry, len(resp.Entries))
	for i, e := range resp.Entries {
		entries[i] = &model.LeaderboardEntry{
			Rank:        int(e.Rank),
			UserID:      e.UserId,
			DisplayName: MaskDisplayName(e.FullName),
			TotalXp:     int(e.TotalXp),
			IsMe:        e.UserId == viewerID,
		}
	}

	return entries, int(resp.TotalRanked), nil
}

// MaskDisplayName renders a student as "First L." for public ranking, per
// 05-Gamification/Leaderboards.md. This is the only implementation: masking at
// write time used to bake the rule into Redis, and two more copies of it had
// grown in the frontend.
func MaskDisplayName(fullName string) string {
	name := strings.TrimSpace(fullName)
	if name == "" || isUUIDString(name) {
		return "Student Scholar"
	}
	parts := strings.Fields(name)
	if len(parts) < 2 {
		return parts[0]
	}
	last := []rune(parts[len(parts)-1])
	if len(last) == 0 {
		return parts[0]
	}
	return fmt.Sprintf("%s %s.", parts[0], string(last[0]))
}

func isUUIDString(s string) bool {
	return len(s) == 36 && strings.Count(s, "-") == 4
}

// UpdateLeaderboard records who a ranked user is and refreshes every board they
// stand on. It sends no XP total: gamification reads totals from its own ledger,
// so the gateway cannot publish a figure that disagrees with it.
func (c *GamificationClient) UpdateLeaderboard(ctx context.Context, userID, fullName, courseID string, grade *model.Grade) error {
	req := &gampb.UpdateLeaderboardRequest{
		UserId:   userID,
		FullName: fullName,
		CourseId: courseID,
	}
	if grade != nil {
		req.Grade = modelGradeToProto(*grade)
	}

	resp, err := c.client.UpdateLeaderboard(ctx, req)
	if err != nil {
		return fmt.Errorf("update leaderboard failed: %w", err)
	}
	if resp.Error != "" {
		return fmt.Errorf("update leaderboard failed: %s", resp.Error)
	}
	return nil
}

// GetMyRank returns the viewer's standing in a scope. Rank 0 means "not ranked
// here yet", which is an ordinary answer rather than an error.
func (c *GamificationClient) GetMyRank(ctx context.Context, userID string, scope model.LeaderboardScope, courseID *string, grade *model.Grade) (rank int, totalXp int, totalRanked int, err error) {
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
		return 0, 0, 0, fmt.Errorf("get my rank failed: %w", err)
	}
	if resp.Error != "" {
		return 0, 0, 0, fmt.Errorf("get my rank failed: %s", resp.Error)
	}

	return int(resp.Rank), int(resp.TotalXp), int(resp.TotalRanked), nil
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
		var unlockedAt *time.Time
		if a.Unlocked && a.UnlockedAtUnix > 0 {
			at := time.Unix(a.UnlockedAtUnix, 0)
			unlockedAt = &at
		}
		achievements[i] = &model.Achievement{
			ID:          a.Id,
			Name:        a.Name,
			Description: a.Description,
			IconURL:     &a.IconUrl,
			Unlocked:    a.Unlocked,
			UnlockedAt:  unlockedAt,
		}
	}
	return achievements, nil
}
