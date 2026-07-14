package service

import (
	"context"
	"testing"
	"time"

	"github.com/studed/gamification-service/internal/model"
	"github.com/studed/gamification-service/internal/repository"
	gampb "github.com/studed/shared/proto/gen/go/gamification"
)

type fakeXpRepo struct {
	totalXp map[string]int32
}

func newFakeXpRepo() *fakeXpRepo {
	return &fakeXpRepo{totalXp: make(map[string]int32)}
}

func (r *fakeXpRepo) GetOrCreateUserXp(ctx context.Context, userID string) (*model.UserXp, error) {
	return &model.UserXp{UserID: userID, TotalXp: r.totalXp[userID]}, nil
}

func (r *fakeXpRepo) AddXp(ctx context.Context, userID string, amount int32, reason, sourceID string) (int32, error) {
	r.totalXp[userID] += amount
	return r.totalXp[userID], nil
}

func (r *fakeXpRepo) GetUserXp(ctx context.Context, userID string) (int32, error) {
	return r.totalXp[userID], nil
}

type fakeLeaderboardRepo struct{}

func (r *fakeLeaderboardRepo) UpdateLeaderboard(ctx context.Context, userID, fullName string, totalXp int32, scope, courseID string, grade int32) error {
	return nil
}

func (r *fakeLeaderboardRepo) GetLeaderboard(ctx context.Context, scope, courseID string, grade int32, limit int32) ([]*gampb.LeaderboardEntry, error) {
	return nil, nil
}

func (r *fakeLeaderboardRepo) GetRank(ctx context.Context, userID string, scope, courseID string, grade int32) (int64, error) {
	return 0, nil
}

type fakeAchievementRepo struct {
	unlocked map[string]map[string]bool
	streaks  map[string]*model.UserStreak
}

func newFakeAchievementRepo() *fakeAchievementRepo {
	return &fakeAchievementRepo{
		unlocked: make(map[string]map[string]bool),
		streaks:  make(map[string]*model.UserStreak),
	}
}

func (r *fakeAchievementRepo) UnlockAchievement(ctx context.Context, userID, achievementID string) (bool, error) {
	if r.unlocked[userID] == nil {
		r.unlocked[userID] = make(map[string]bool)
	}
	if r.unlocked[userID][achievementID] {
		return false, nil
	}
	r.unlocked[userID][achievementID] = true
	return true, nil
}

func (r *fakeAchievementRepo) GetAchievementsMetadata(ctx context.Context) ([]*repository.AchievementMetadata, error) {
	return nil, nil
}

func (r *fakeAchievementRepo) GetUnlockedAchievements(ctx context.Context, userID string) ([]*model.UserAchievement, error) {
	return nil, nil
}

func (r *fakeAchievementRepo) GetOrCreateStreak(ctx context.Context, userID string) (*model.UserStreak, error) {
	if s, ok := r.streaks[userID]; ok {
		return s, nil
	}
	s := &model.UserStreak{UserID: userID}
	r.streaks[userID] = s
	return s, nil
}

func (r *fakeAchievementRepo) SaveStreak(ctx context.Context, streak *model.UserStreak) error {
	r.streaks[streak.UserID] = streak
	return nil
}

func newTestService() (*gamificationService, *fakeXpRepo, *fakeAchievementRepo) {
	xpRepo := newFakeXpRepo()
	achievementRepo := newFakeAchievementRepo()
	svc := NewGamificationService(xpRepo, &fakeLeaderboardRepo{}, achievementRepo).(*gamificationService)
	return svc, xpRepo, achievementRepo
}

func TestCalculateAndAwardXp_BelowPassingThreshold(t *testing.T) {
	svc, xpRepo, _ := newTestService()

	resp, err := svc.CalculateAndAwardXp(context.Background(), "u1", "w1", 50, 100, 70)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.XpEarned != 0 || resp.TotalXp != 0 {
		t.Fatalf("expected no xp on failing score, got %+v", resp)
	}
	if xpRepo.totalXp["u1"] != 0 {
		t.Fatalf("xp repo should not have been touched on a failing attempt")
	}
}

func TestCalculateAndAwardXp_TieredScoring(t *testing.T) {
	tests := []struct {
		name             string
		score            int32
		xpReward         int32
		passingThreshold int32
		wantXp           int32
	}{
		{"perfect score = full reward", 100, 100, 70, 100},
		{"80-99 = 80% of reward", 85, 100, 70, 80},
		{"60-79 = 60% of reward", 65, 100, 60, 60},
		{"between threshold and 60 = 40% of reward", 55, 100, 50, 40},
		{"exactly at passing threshold, threshold below 60", 50, 100, 50, 40},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc, _, _ := newTestService()
			resp, err := svc.CalculateAndAwardXp(context.Background(), "u1", "w1", tt.score, tt.xpReward, tt.passingThreshold)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if resp.XpEarned != tt.wantXp {
				t.Fatalf("expected %d xp, got %d", tt.wantXp, resp.XpEarned)
			}
			if resp.TotalXp != tt.wantXp {
				t.Fatalf("expected total xp %d, got %d", tt.wantXp, resp.TotalXp)
			}
		})
	}
}

func TestCalculateAndAwardXp_AccumulatesAcrossAttempts(t *testing.T) {
	svc, xpRepo, _ := newTestService()

	if _, err := svc.CalculateAndAwardXp(context.Background(), "u1", "w1", 100, 100, 70); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	resp, err := svc.CalculateAndAwardXp(context.Background(), "u1", "w2", 100, 50, 70)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.XpEarned != 50 {
		t.Fatalf("expected 50 xp for second wave, got %d", resp.XpEarned)
	}
	if resp.TotalXp != 150 {
		t.Fatalf("expected cumulative total of 150, got %d", resp.TotalXp)
	}
	if xpRepo.totalXp["u1"] != 150 {
		t.Fatalf("xp repo not updated correctly: %+v", xpRepo.totalXp)
	}
}

func TestCalculateAndAwardXp_UnlocksPerfectScoreAchievementOnlyAt100(t *testing.T) {
	svc, _, achievementRepo := newTestService()

	if _, err := svc.CalculateAndAwardXp(context.Background(), "u1", "w1", 85, 100, 70); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if achievementRepo.unlocked["u1"]["perfect_score"] {
		t.Fatalf("perfect_score should not unlock below 100%%")
	}
	if !achievementRepo.unlocked["u1"]["first_wave"] {
		t.Fatalf("first_wave should unlock on any passing attempt")
	}

	if _, err := svc.CalculateAndAwardXp(context.Background(), "u1", "w2", 100, 100, 70); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !achievementRepo.unlocked["u1"]["perfect_score"] {
		t.Fatalf("perfect_score should unlock at 100%%")
	}
}

func TestCalculateAndAwardXp_UnlocksXpMilestoneAchievements(t *testing.T) {
	svc, _, achievementRepo := newTestService()

	// 5 waves of 100 xp reward each get the user to 500 total xp.
	for i := 0; i < 5; i++ {
		if _, err := svc.CalculateAndAwardXp(context.Background(), "u1", "w", 100, 100, 70); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
	}
	if !achievementRepo.unlocked["u1"]["rising_star"] {
		t.Fatalf("rising_star should unlock at 500 total xp")
	}
	if achievementRepo.unlocked["u1"]["scholar"] {
		t.Fatalf("scholar should not unlock before 2000 total xp")
	}
}

func TestCalculateAndAwardXp_RequiresUserAndWaveID(t *testing.T) {
	svc, _, _ := newTestService()

	if _, err := svc.CalculateAndAwardXp(context.Background(), "", "w1", 100, 100, 70); err == nil {
		t.Fatalf("expected error for missing user id")
	}
	if _, err := svc.CalculateAndAwardXp(context.Background(), "u1", "", 100, 100, 70); err == nil {
		t.Fatalf("expected error for missing wave id")
	}
}

func TestAwardXp_ManualGrant(t *testing.T) {
	svc, xpRepo, _ := newTestService()

	resp, err := svc.AwardXp(context.Background(), "u1", 30, "manual_grant", "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.TotalXp != 30 {
		t.Fatalf("expected total xp of 30, got %d", resp.TotalXp)
	}
	if xpRepo.totalXp["u1"] != 30 {
		t.Fatalf("xp repo not updated: %+v", xpRepo.totalXp)
	}
}

func TestUnlockAchievement_IsIdempotent(t *testing.T) {
	svc, _, _ := newTestService()

	first, err := svc.UnlockAchievement(context.Background(), "u1", "first_wave")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !first.Unlocked {
		t.Fatalf("expected first unlock to report true")
	}

	second, err := svc.UnlockAchievement(context.Background(), "u1", "first_wave")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if second.Unlocked {
		t.Fatalf("expected repeat unlock to report false")
	}
}

func TestUnlockAchievement_AwardsBonusXpForLessonMilestones(t *testing.T) {
	svc, xpRepo, _ := newTestService()

	if _, err := svc.UnlockAchievement(context.Background(), "u1", "lesson_complete"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if xpRepo.totalXp["u1"] != 20 {
		t.Fatalf("expected 20 bonus xp for lesson_complete, got %d", xpRepo.totalXp["u1"])
	}
}

func TestGetUserStreak_FirstLoginStartsStreakAtOne(t *testing.T) {
	svc, xpRepo, _ := newTestService()

	resp, err := svc.GetUserStreak(context.Background(), "u1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.CurrentStreak != 1 || resp.LongestStreak != 1 {
		t.Fatalf("expected streak of 1 on first login, got %+v", resp)
	}
	if xpRepo.totalXp["u1"] != 5 {
		t.Fatalf("expected 5 xp streak bonus on first login, got %d", xpRepo.totalXp["u1"])
	}
}

func TestGetUserStreak_ConsecutiveDayIncrementsStreak(t *testing.T) {
	svc, _, achievementRepo := newTestService()

	achievementRepo.streaks["u1"] = &model.UserStreak{
		UserID:        "u1",
		CurrentStreak: 3,
		LongestStreak: 3,
		LastLoginDate: time.Now().UTC().AddDate(0, 0, -1),
	}

	resp, err := svc.GetUserStreak(context.Background(), "u1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.CurrentStreak != 4 {
		t.Fatalf("expected streak to increment to 4, got %d", resp.CurrentStreak)
	}
}

func TestGetUserStreak_GapResetsStreak(t *testing.T) {
	svc, _, achievementRepo := newTestService()

	achievementRepo.streaks["u1"] = &model.UserStreak{
		UserID:        "u1",
		CurrentStreak: 3,
		LongestStreak: 3,
		LastLoginDate: time.Now().UTC().AddDate(0, 0, -3),
	}

	resp, err := svc.GetUserStreak(context.Background(), "u1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.CurrentStreak != 1 {
		t.Fatalf("expected streak to reset to 1 after a gap, got %d", resp.CurrentStreak)
	}
	if resp.LongestStreak != 3 {
		t.Fatalf("longest streak should be preserved, got %d", resp.LongestStreak)
	}
}
