package repository

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"github.com/redis/go-redis/v9"
	gampb "github.com/studed/shared/proto/gen/go/gamification"
)

type LeaderboardRepository interface {
	UpdateLeaderboard(ctx context.Context, userID, fullName string, totalXp int32, scope, courseID string, grade int32) error
	GetLeaderboard(ctx context.Context, scope, courseID string, grade int32, limit int32) ([]*gampb.LeaderboardEntry, error)
}

type leaderboardRepository struct {
	client *redis.Client
}

func NewLeaderboardRepository(client *redis.Client) LeaderboardRepository {
	return &leaderboardRepository{client: client}
}

func leaderboardKey(scope, courseID string, grade int32) string {
	switch scope {
	case "COURSE":
		return fmt.Sprintf("leaderboard:course:%s", courseID)
	case "GRADE":
		return fmt.Sprintf("leaderboard:grade:%d", grade)
	default:
		return "leaderboard:global"
	}
}

func memberKey(userID, fullName string) string {
	return fmt.Sprintf("%s|%s", userID, fullName)
}

func parseMemberKey(key string) (string, string) {
	key = strings.TrimSpace(key)
	parts := splitKey(key, '|')
	if len(parts) == 2 {
		return parts[0], strings.TrimSpace(parts[1])
	}
	return key, ""
}

func splitKey(s string, sep rune) []string {
	var parts []string
	var current string
	for _, r := range s {
		if r == sep {
			parts = append(parts, current)
			current = ""
		} else {
			current += string(r)
		}
	}
	parts = append(parts, current)
	return parts
}

func (r *leaderboardRepository) UpdateLeaderboard(ctx context.Context, userID, fullName string, totalXp int32, scope, courseID string, grade int32) error {
	key := leaderboardKey(scope, courseID, grade)
	oldMember := memberKey(userID, "")
	_ = r.client.ZRem(ctx, key, oldMember).Err()

	member := memberKey(userID, fullName)
	return r.client.ZAdd(ctx, key, redis.Z{
		Score:  float64(totalXp),
		Member: member,
	}).Err()
}

func (r *leaderboardRepository) GetLeaderboard(ctx context.Context, scope, courseID string, grade int32, limit int32) ([]*gampb.LeaderboardEntry, error) {
	key := leaderboardKey(scope, courseID, grade)
	if limit <= 0 {
		limit = 20
	}

	results, err := r.client.ZRevRangeWithScores(ctx, key, 0, int64(limit-1)).Result()
	if err != nil {
		return nil, err
	}

	entries := make([]*gampb.LeaderboardEntry, len(results))
	for i, result := range results {
		memberStr := fmt.Sprintf("%v", result.Member)
		userID, fullName := parseMemberKey(memberStr)
		entries[i] = &gampb.LeaderboardEntry{
			Rank:     int32(i + 1),
			UserId:   userID,
			FullName: fullName,
			TotalXp:  int32(result.Score),
		}
	}

	return entries, nil
}

func int32ToString(v int32) string {
	return strconv.Itoa(int(v))
}
