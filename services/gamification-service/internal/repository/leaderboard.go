package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// Scopes a leaderboard can be ranked by. FRIENDS is deliberately absent: there
// is no friends model, and an enum value that always returns an empty board is
// a broken feature rather than an unfinished one.
const (
	ScopeGlobal = "GLOBAL"
	ScopeGrade  = "GRADE"
	ScopeCourse = "COURSE"
	ScopeWeekly = "WEEKLY"
)

// Weekly boards expire on their own. Two weeks of slack means a board is still
// readable through the weekend after it closes, without a reset job to run.
const weeklyTTL = 15 * 24 * time.Hour

// Ranked is one member of a leaderboard, before display names are attached.
type Ranked struct {
	UserID  string
	TotalXp int32
	// Rank is competition standard: equal XP shares a rank and the next
	// distinct total skips (1, 2, 2, 4).
	Rank int32
}

type LeaderboardRepository interface {
	Set(ctx context.Context, scope, courseID string, grade int32, userID string, totalXp int32, at time.Time) error
	Page(ctx context.Context, scope, courseID string, grade int32, limit, offset int32) ([]Ranked, int32, error)
	RankOf(ctx context.Context, scope, courseID string, grade int32, userID string) (Ranked, int32, error)
	Clear(ctx context.Context, scope, courseID string, grade int32) error
}

type leaderboardRepository struct {
	client *redis.Client
	// now is injectable so week bucketing and tie-break ordering are testable.
	now func() time.Time
}

func NewLeaderboardRepository(client *redis.Client) LeaderboardRepository {
	return &leaderboardRepository{client: client, now: time.Now}
}

// NewLeaderboardRepositoryWithClock builds a repository with a fixed clock.
func NewLeaderboardRepositoryWithClock(client *redis.Client, now func() time.Time) LeaderboardRepository {
	return &leaderboardRepository{client: client, now: now}
}

// WeekBucket is the ISO-year/week key segment a weekly board is filed under.
// Weeks start Monday 00:00 UTC, so the board rolls over on its own.
func WeekBucket(at time.Time) string {
	y, w := at.UTC().ISOWeek()
	return fmt.Sprintf("%04d-W%02d", y, w)
}

// LeaderboardKey names the sorted set for a scope. Weekly keys carry their week
// so a new week starts an empty board rather than inheriting the old one.
func LeaderboardKey(scope, courseID string, grade int32, at time.Time) string {
	switch scope {
	case ScopeCourse:
		return fmt.Sprintf("leaderboard:course:%s", courseID)
	case ScopeGrade:
		return fmt.Sprintf("leaderboard:grade:%d", grade)
	case ScopeWeekly:
		return fmt.Sprintf("leaderboard:weekly:%s", WeekBucket(at))
	default:
		return "leaderboard:global"
	}
}

// Ties are broken by who reached the total first (05-Gamification/Leaderboards.md).
// Redis sorts by a single float, so XP and the timestamp share one score: XP in
// the high bits, and an inverted second count in the low bits so an earlier
// arrival scores higher. float64 carries 53 bits of integer precision, which
// covers totals to 16.7M XP and ~17 years of timestamps exactly.
const scoreShift = int64(1) << 29

var scoreEpoch = time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

func compositeScore(totalXp int32, at time.Time) float64 {
	xp := int64(totalXp)
	if xp < 0 {
		xp = 0
	}
	secs := int64(at.UTC().Sub(scoreEpoch).Seconds())
	if secs < 0 {
		secs = 0
	}
	if secs > scoreShift-1 {
		secs = scoreShift - 1
	}
	return float64(xp*scoreShift + (scoreShift - 1 - secs))
}

// xpFromScore recovers the XP a composite score was built from.
func xpFromScore(score float64) int32 {
	if score < 0 {
		return 0
	}
	return int32(int64(score) / scoreShift)
}

// minScoreForXp is the lowest composite score any member with this XP total can
// hold, so `>= minScoreForXp(n+1)` selects exactly the members ahead of n.
func minScoreForXp(totalXp int32) float64 {
	if totalXp < 0 {
		totalXp = 0
	}
	return float64(int64(totalXp) * scoreShift)
}

// Set records a user's standing in one scope. The member is the bare user ID:
// display names live in Postgres so a Redis flush cannot lose them, and so the
// masking rule can change without rewriting every sorted set. Re-adding an
// existing member updates its score in place, so a renamed or re-scored user
// can never appear twice.
func (r *leaderboardRepository) Set(ctx context.Context, scope, courseID string, grade int32, userID string, totalXp int32, at time.Time) error {
	if userID == "" {
		return errors.New("user id is required")
	}
	key := LeaderboardKey(scope, courseID, grade, at)

	pipe := r.client.TxPipeline()
	pipe.ZAdd(ctx, key, redis.Z{Score: compositeScore(totalXp, at), Member: userID})
	if scope == ScopeWeekly {
		pipe.Expire(ctx, key, weeklyTTL)
	}
	_, err := pipe.Exec(ctx)
	return err
}

// Page returns one page of a board plus the total number of ranked members.
func (r *leaderboardRepository) Page(ctx context.Context, scope, courseID string, grade int32, limit, offset int32) ([]Ranked, int32, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	key := LeaderboardKey(scope, courseID, grade, r.now())

	pipe := r.client.Pipeline()
	rangeCmd := pipe.ZRevRangeWithScores(ctx, key, int64(offset), int64(offset+limit-1))
	countCmd := pipe.ZCard(ctx, key)
	if _, err := pipe.Exec(ctx); err != nil && !errors.Is(err, redis.Nil) {
		return nil, 0, err
	}

	results, err := rangeCmd.Result()
	if err != nil && !errors.Is(err, redis.Nil) {
		return nil, 0, err
	}
	total, err := countCmd.Result()
	if err != nil && !errors.Is(err, redis.Nil) {
		return nil, 0, err
	}

	ranked := make([]Ranked, 0, len(results))
	// The first row of a page is not necessarily rank offset+1: members above
	// it may share its XP. Ask Redis how many members strictly outrank it.
	var baseRank int32
	if len(results) > 0 {
		first := xpFromScore(results[0].Score)
		ahead, err := r.client.ZCount(ctx, key, fmt.Sprintf("%.0f", minScoreForXp(first+1)), "+inf").Result()
		if err != nil {
			return nil, 0, err
		}
		baseRank = int32(ahead) + 1
	}

	var prevXp int32
	var prevRank int32
	for i, res := range results {
		member, ok := res.Member.(string)
		if !ok {
			member = fmt.Sprintf("%v", res.Member)
		}
		xp := xpFromScore(res.Score)

		rank := baseRank + int32(i)
		if i > 0 && xp == prevXp {
			rank = prevRank
		}
		prevXp, prevRank = xp, rank

		ranked = append(ranked, Ranked{UserID: member, TotalXp: xp, Rank: rank})
	}

	return ranked, int32(total), nil
}

// RankOf returns a user's competition-standard rank in a scope, plus the size
// of the board. An unranked user gets rank 0 and no error: "you have not scored
// in this scope yet" is an ordinary answer, not a failure.
func (r *leaderboardRepository) RankOf(ctx context.Context, scope, courseID string, grade int32, userID string) (Ranked, int32, error) {
	key := LeaderboardKey(scope, courseID, grade, r.now())

	pipe := r.client.Pipeline()
	scoreCmd := pipe.ZScore(ctx, key, userID)
	countCmd := pipe.ZCard(ctx, key)
	if _, err := pipe.Exec(ctx); err != nil && !errors.Is(err, redis.Nil) {
		return Ranked{}, 0, err
	}

	total, err := countCmd.Result()
	if err != nil && !errors.Is(err, redis.Nil) {
		return Ranked{}, 0, err
	}

	score, err := scoreCmd.Result()
	if errors.Is(err, redis.Nil) {
		return Ranked{UserID: userID}, int32(total), nil
	}
	if err != nil {
		return Ranked{}, 0, err
	}

	xp := xpFromScore(score)
	ahead, err := r.client.ZCount(ctx, key, fmt.Sprintf("%.0f", minScoreForXp(xp+1)), "+inf").Result()
	if err != nil {
		return Ranked{}, 0, err
	}

	return Ranked{UserID: userID, TotalXp: xp, Rank: int32(ahead) + 1}, int32(total), nil
}

// Clear drops a board. Used by the rebuild so a stale member who no longer
// qualifies does not survive the refresh.
func (r *leaderboardRepository) Clear(ctx context.Context, scope, courseID string, grade int32) error {
	return r.client.Del(ctx, LeaderboardKey(scope, courseID, grade, r.now())).Err()
}
