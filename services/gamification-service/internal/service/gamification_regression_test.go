package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/studed/gamification-service/internal/model"
	"github.com/studed/gamification-service/internal/repository"
)

var errRedisDown = errors.New("redis unavailable")

// This suite previously defined its own calculateXpForScore and
// computeNextStreak helpers and asserted against those, so it passed while
// disagreeing with the shipped rules. Every case here now drives the real
// service.

func TestGamificationRegression_XpThresholdMatrix(t *testing.T) {
	// The tiers are absolute score bands, not offsets from the threshold:
	// 100 pays full, 80-99 pays 80%, 60-79 pays 60%, and threshold-59 pays 40%.
	// The 40% band is therefore only reachable when the threshold is below 60.
	regressionMatrix := []struct {
		name             string
		score            int32
		xpReward         int32
		passingThreshold int32
		expectedXp       int32
	}{
		{"perfect score pays the full reward", 100, 100, 70, 100},
		{"90 percent pays the 80 percent tier", 90, 100, 70, 80},
		{"exactly 80 pays the 80 percent tier", 80, 100, 70, 80},
		{"79 falls to the 60 percent tier", 79, 100, 70, 60},
		{"a bare pass at 70 sits in the 60 percent band", 70, 100, 70, 60},
		{"below the threshold pays nothing", 69, 100, 70, 0},
		{"a bare pass under a low threshold pays the 40 percent tier", 50, 100, 50, 40},
		{"59 with a low threshold is still the 40 percent tier", 59, 100, 40, 40},
		{"a failing score pays nothing", 50, 100, 70, 0},
		{"zero pays nothing", 0, 100, 70, 0},
		{"a negative score pays nothing", -10, 100, 70, 0},
		{"above 100 is still capped at the full reward", 150, 100, 70, 100},
	}

	for _, tt := range regressionMatrix {
		t.Run(tt.name, func(t *testing.T) {
			svc, _, _ := newTestService()
			resp, err := svc.CalculateAndAwardXp(context.Background(), "u1", "w1", "", tt.score, tt.xpReward, tt.passingThreshold)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if resp.XpEarned != tt.expectedXp {
				t.Errorf("score %d awarded %d XP; expected %d", tt.score, resp.XpEarned, tt.expectedXp)
			}
		})
	}
}

func TestGamificationRegression_StreakMatrix(t *testing.T) {
	now := time.Date(2026, 8, 12, 12, 0, 0, 0, time.UTC)

	regressionMatrix := []struct {
		name           string
		currentStreak  int32
		lastActive     time.Time
		expectedStreak int32
	}{
		{"first activity sets the streak to 1", 0, time.Time{}, 1},
		{"activity on a consecutive day increments", 5, now.AddDate(0, 0, -1), 6},
		{"a second activity the same day is a no-op", 5, now, 5},
		{"a missed day resets to 1", 10, now.AddDate(0, 0, -2), 1},
		{"a long gap resets to 1", 30, now.AddDate(0, 0, -90), 1},
		{"a late-evening then early-morning pair still increments", 2, now.AddDate(0, 0, -1).Add(11 * time.Hour), 3},
	}

	for _, tt := range regressionMatrix {
		t.Run(tt.name, func(t *testing.T) {
			svc, _, achievementRepo := newTestService()
			svc.now = func() time.Time { return now }

			if !tt.lastActive.IsZero() {
				achievementRepo.streaks["u1"] = &model.UserStreak{
					UserID:        "u1",
					CurrentStreak: tt.currentStreak,
					LongestStreak: tt.currentStreak,
					LastLoginDate: tt.lastActive,
				}
			}

			resp, err := svc.TouchStreak(context.Background(), "u1")
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if resp.CurrentStreak != tt.expectedStreak {
				t.Errorf("streak %d last active %v gave %d; expected %d",
					tt.currentStreak, tt.lastActive, resp.CurrentStreak, tt.expectedStreak)
			}
		})
	}
}

func TestGamificationRegression_AddXpIdempotency(t *testing.T) {
	svc, _, _ := newTestService()
	ctx := context.Background()

	res1, err := svc.AwardXp(ctx, "user-reg-1", 50, "wave_completed", "source-101", "")
	if err != nil {
		t.Fatalf("unexpected error on first award: %v", err)
	}
	if res1.TotalXp != 50 {
		t.Fatalf("expected 50 total XP, got %d", res1.TotalXp)
	}

	res2, err := svc.AwardXp(ctx, "user-reg-1", 50, "wave_completed", "source-101", "")
	if err != nil {
		t.Fatalf("unexpected error on duplicate award: %v", err)
	}
	if res2.TotalXp != 50 {
		t.Fatalf("expected total XP to remain 50 on duplicate award, got %d", res2.TotalXp)
	}
}

// An award has to reach every board the student stands on, not just the global
// one. Before this, weekly and course boards were never written at all.
func TestGamificationRegression_AwardSyncsEveryScope(t *testing.T) {
	now := time.Date(2026, 8, 12, 9, 0, 0, 0, time.UTC)

	xpRepo := newFakeXpRepo()
	xpRepo.now = func() time.Time { return now }
	lbRepo := newFakeLeaderboardRepo()
	svc := NewGamificationService(xpRepo, lbRepo, newFakeAchievementRepo(), WithClock(func() time.Time { return now })).(*gamificationService)
	ctx := context.Background()

	if _, err := svc.UpdateLeaderboard(ctx, "u1", "Nimal Perera", "", 11); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, err := svc.CalculateAndAwardXp(ctx, "u1", "w1", "course-1", 100, 100, 70); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	for _, scope := range []struct {
		name     string
		key      string
		expected int32
	}{
		{"global", repository.LeaderboardKey(repository.ScopeGlobal, "", 0, now), 100},
		{"grade", repository.LeaderboardKey(repository.ScopeGrade, "", 11, now), 100},
		{"weekly", repository.LeaderboardKey(repository.ScopeWeekly, "", 0, now), 100},
		{"course", repository.LeaderboardKey(repository.ScopeCourse, "course-1", 0, now), 100},
	} {
		board, ok := lbRepo.writes[scope.key]
		if !ok {
			t.Fatalf("%s board was never written (key %q)", scope.name, scope.key)
		}
		if board["u1"] != scope.expected {
			t.Errorf("%s board holds %d XP for u1; expected %d", scope.name, board["u1"], scope.expected)
		}
	}
}

// The course board ranks by XP earned in that course. Ranking it by the global
// total let a student's unrelated XP decide a subject competition.
func TestGamificationRegression_CourseBoardUsesCourseXpNotGlobal(t *testing.T) {
	now := time.Date(2026, 8, 12, 9, 0, 0, 0, time.UTC)

	xpRepo := newFakeXpRepo()
	xpRepo.now = func() time.Time { return now }
	lbRepo := newFakeLeaderboardRepo()
	svc := NewGamificationService(xpRepo, lbRepo, newFakeAchievementRepo(), WithClock(func() time.Time { return now })).(*gamificationService)
	ctx := context.Background()

	// 300 XP earned elsewhere, then 60 XP inside course-1.
	if _, err := svc.AwardXp(ctx, "u1", 300, "manual_grant", "elsewhere", ""); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, err := svc.CalculateAndAwardXp(ctx, "u1", "w1", "course-1", 100, 60, 70); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	globalKey := repository.LeaderboardKey(repository.ScopeGlobal, "", 0, now)
	courseKey := repository.LeaderboardKey(repository.ScopeCourse, "course-1", 0, now)

	if got := lbRepo.writes[globalKey]["u1"]; got != 360 {
		t.Errorf("global board should carry the full 360 XP, got %d", got)
	}
	if got := lbRepo.writes[courseKey]["u1"]; got != 60 {
		t.Errorf("course board should carry only the 60 XP earned in it, got %d", got)
	}
}

// A ranking write is a side effect of an award. The award is already durable
// in Postgres, so a Redis failure must not turn it into an error.
func TestGamificationRegression_LeaderboardFailureDoesNotFailTheAward(t *testing.T) {
	xpRepo := newFakeXpRepo()
	lbRepo := newFakeLeaderboardRepo()
	lbRepo.setErr = errRedisDown
	svc := NewGamificationService(xpRepo, lbRepo, newFakeAchievementRepo())

	resp, err := svc.CalculateAndAwardXp(context.Background(), "u1", "w1", "course-1", 100, 100, 70)
	if err != nil {
		t.Fatalf("a leaderboard outage must not fail the award: %v", err)
	}
	if resp.XpEarned != 100 {
		t.Fatalf("expected 100 XP to still be awarded, got %d", resp.XpEarned)
	}
	if xpRepo.totalXp["u1"] != 100 {
		t.Fatalf("expected the XP to be durable, got %d", xpRepo.totalXp["u1"])
	}
}
