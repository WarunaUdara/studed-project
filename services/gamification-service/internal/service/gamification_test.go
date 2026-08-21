package service

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/studed/gamification-service/internal/events"
	"github.com/studed/gamification-service/internal/model"
	"github.com/studed/gamification-service/internal/repository"
)

type xpEntry struct {
	amount   int32
	reason   string
	sourceID string
	courseID string
	at       time.Time
}

type fakeXpRepo struct {
	totalXp       map[string]int32
	awarded       map[string]bool
	identities    map[string]model.UserXp
	history       []xpEntry
	addXpErr      error
	hasAwardedErr error
	now           func() time.Time
}

func newFakeXpRepo() *fakeXpRepo {
	return &fakeXpRepo{
		totalXp:    make(map[string]int32),
		awarded:    make(map[string]bool),
		identities: make(map[string]model.UserXp),
		now:        time.Now,
	}
}

func (r *fakeXpRepo) GetOrCreateUserXp(ctx context.Context, userID string) (*model.UserXp, error) {
	return &model.UserXp{UserID: userID, TotalXp: r.totalXp[userID]}, nil
}

func (r *fakeXpRepo) AddXp(ctx context.Context, userID string, amount int32, reason, sourceID, courseID string) (int32, error) {
	if r.addXpErr != nil {
		return 0, r.addXpErr
	}
	if reason == "wave_completed" && r.awarded[userID+":"+sourceID] {
		return r.totalXp[userID], nil
	}
	if reason == "wave_completed" {
		r.awarded[userID+":"+sourceID] = true
	}
	r.totalXp[userID] += amount
	r.history = append(r.history, xpEntry{amount: amount, reason: reason, sourceID: sourceID, courseID: courseID, at: r.now()})
	return r.totalXp[userID], nil
}

func (r *fakeXpRepo) GetUserXp(ctx context.Context, userID string) (int32, error) {
	return r.totalXp[userID], nil
}

func (r *fakeXpRepo) GetAllUserXp(ctx context.Context) ([]model.UserXp, error) {
	var result []model.UserXp
	for id, xp := range r.totalXp {
		who := r.identities[id]
		who.UserID = id
		who.TotalXp = xp
		result = append(result, who)
	}
	return result, nil
}

func (r *fakeXpRepo) SaveIdentity(ctx context.Context, userID, displayName string, grade int32) error {
	who := r.identities[userID]
	who.UserID = userID
	if displayName != "" {
		who.DisplayName = displayName
	}
	if grade != 0 {
		who.Grade = grade
	}
	r.identities[userID] = who
	return nil
}

func (r *fakeXpRepo) GetIdentities(ctx context.Context, userIDs []string) (map[string]model.UserXp, error) {
	out := make(map[string]model.UserXp, len(userIDs))
	for _, id := range userIDs {
		who := r.identities[id]
		who.UserID = id
		who.TotalXp = r.totalXp[id]
		out[id] = who
	}
	return out, nil
}

func (r *fakeXpRepo) CourseXp(ctx context.Context, userID, courseID string) (int32, error) {
	var total int32
	for _, h := range r.history {
		if h.courseID == courseID {
			total += h.amount
		}
	}
	return total, nil
}

func (r *fakeXpRepo) SumSince(ctx context.Context, userID string, since time.Time) (int32, error) {
	var total int32
	for _, h := range r.history {
		if !h.at.Before(since) {
			total += h.amount
		}
	}
	return total, nil
}

func (r *fakeXpRepo) AllCourseXp(ctx context.Context) ([]repository.CourseXp, error) {
	sums := map[string]int32{}
	for _, h := range r.history {
		if h.courseID != "" {
			sums[h.courseID] += h.amount
		}
	}
	var out []repository.CourseXp
	for courseID, xp := range sums {
		out = append(out, repository.CourseXp{CourseID: courseID, TotalXp: xp})
	}
	return out, nil
}

func (r *fakeXpRepo) AllSumsSince(ctx context.Context, since time.Time) ([]repository.UserSum, error) {
	var out []repository.UserSum
	for id := range r.totalXp {
		xp, _ := r.SumSince(ctx, id, since)
		out = append(out, repository.UserSum{UserID: id, TotalXp: xp})
	}
	return out, nil
}

func (r *fakeXpRepo) HasAwardedXp(ctx context.Context, userID, reason, sourceID string) (bool, error) {
	if r.hasAwardedErr != nil {
		return false, r.hasAwardedErr
	}
	if reason != "wave_completed" {
		return false, nil
	}
	return r.awarded[userID+":"+sourceID], nil
}

// fakeLeaderboardRepo records what was written to each scope so tests can
// assert that an award reaches the global, grade, weekly and course boards.
type fakeLeaderboardRepo struct {
	writes map[string]map[string]int32
	setErr error
}

func newFakeLeaderboardRepo() *fakeLeaderboardRepo {
	return &fakeLeaderboardRepo{writes: make(map[string]map[string]int32)}
}

func (r *fakeLeaderboardRepo) Set(ctx context.Context, scope, courseID string, grade int32, userID string, totalXp int32, at time.Time) error {
	if r.setErr != nil {
		return r.setErr
	}
	if r.writes == nil {
		r.writes = make(map[string]map[string]int32)
	}
	key := repository.LeaderboardKey(scope, courseID, grade, at)
	if r.writes[key] == nil {
		r.writes[key] = make(map[string]int32)
	}
	r.writes[key][userID] = totalXp
	return nil
}

func (r *fakeLeaderboardRepo) Page(ctx context.Context, scope, courseID string, grade, limit, offset int32) ([]repository.Ranked, int32, error) {
	return nil, 0, nil
}

func (r *fakeLeaderboardRepo) RankOf(ctx context.Context, scope, courseID string, grade int32, userID string) (repository.Ranked, int32, error) {
	return repository.Ranked{UserID: userID}, 0, nil
}

func (r *fakeLeaderboardRepo) Clear(ctx context.Context, scope, courseID string, grade int32) error {
	return nil
}

type fakeAchievementRepo struct {
	unlocked  map[string]map[string]bool
	streaks   map[string]*model.UserStreak
	unlockErr error
}

func newFakeAchievementRepo() *fakeAchievementRepo {
	return &fakeAchievementRepo{
		unlocked: make(map[string]map[string]bool),
		streaks:  make(map[string]*model.UserStreak),
	}
}

func (r *fakeAchievementRepo) UnlockAchievement(ctx context.Context, userID, achievementID string) (bool, error) {
	if r.unlockErr != nil {
		return false, r.unlockErr
	}
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
	svc := NewGamificationService(xpRepo, newFakeLeaderboardRepo(), achievementRepo).(*gamificationService)
	return svc, xpRepo, achievementRepo
}

type fakePublisher struct {
	xpErr error
}

func (p *fakePublisher) PublishXpAwarded(ctx context.Context, e events.XpAwardedEvent) error {
	return p.xpErr
}

func (p *fakePublisher) PublishAchievementUnlocked(ctx context.Context, e events.AchievementUnlockedEvent) error {
	return nil
}

func TestCalculateAndAwardXp_BelowPassingThreshold(t *testing.T) {
	svc, xpRepo, _ := newTestService()

	resp, err := svc.CalculateAndAwardXp(context.Background(), "u1", "w1", "", 50, 100, 70)
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
			resp, err := svc.CalculateAndAwardXp(context.Background(), "u1", "w1", "", tt.score, tt.xpReward, tt.passingThreshold)
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

	if _, err := svc.CalculateAndAwardXp(context.Background(), "u1", "w1", "", 100, 100, 70); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	resp, err := svc.CalculateAndAwardXp(context.Background(), "u1", "w2", "", 100, 50, 70)
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

	if _, err := svc.CalculateAndAwardXp(context.Background(), "u1", "w1", "", 85, 100, 70); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if achievementRepo.unlocked["u1"]["perfect_score"] {
		t.Fatalf("perfect_score should not unlock below 100%%")
	}
	if !achievementRepo.unlocked["u1"]["first_wave"] {
		t.Fatalf("first_wave should unlock on any passing attempt")
	}

	if _, err := svc.CalculateAndAwardXp(context.Background(), "u1", "w2", "", 100, 100, 70); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !achievementRepo.unlocked["u1"]["perfect_score"] {
		t.Fatalf("perfect_score should unlock at 100%%")
	}
}

func TestCalculateAndAwardXp_UnlocksXpMilestoneAchievements(t *testing.T) {
	svc, _, achievementRepo := newTestService()

	// 5 distinct waves of 100 xp reward each get the user to 500 total xp.
	// Re-passing the same wave awards no XP, so each wave must be distinct.
	for i := 0; i < 5; i++ {
		waveID := fmt.Sprintf("w%d", i)
		if _, err := svc.CalculateAndAwardXp(context.Background(), "u1", waveID, "", 100, 100, 70); err != nil {
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

func TestCalculateAndAwardXp_RepassingWaveGrantsNoAdditionalXp(t *testing.T) {
	svc, xpRepo, _ := newTestService()

	first, err := svc.CalculateAndAwardXp(context.Background(), "u1", "w1", "", 100, 100, 70)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if first.XpEarned != 100 || first.TotalXp != 100 {
		t.Fatalf("expected 100 xp on first completion, got %+v", first)
	}

	second, err := svc.CalculateAndAwardXp(context.Background(), "u1", "w1", "", 100, 100, 70)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if second.XpEarned != 0 {
		t.Fatalf("re-passing a completed wave should award 0 xp, got %d", second.XpEarned)
	}
	if second.TotalXp != 100 {
		t.Fatalf("total xp should stay at 100 on re-pass, got %d", second.TotalXp)
	}
	if xpRepo.totalXp["u1"] != 100 {
		t.Fatalf("xp repo should remain at 100 on re-pass, got %d", xpRepo.totalXp["u1"])
	}
}

func TestCalculateAndAwardXp_RequiresUserAndWaveID(t *testing.T) {
	svc, _, _ := newTestService()

	if _, err := svc.CalculateAndAwardXp(context.Background(), "", "w1", "", 100, 100, 70); err == nil {
		t.Fatalf("expected error for missing user id")
	}
	if _, err := svc.CalculateAndAwardXp(context.Background(), "u1", "", "", 100, 100, 70); err == nil {
		t.Fatalf("expected error for missing wave id")
	}
}

func TestAwardXp_ManualGrant(t *testing.T) {
	svc, xpRepo, _ := newTestService()

	resp, err := svc.AwardXp(context.Background(), "u1", 30, "manual_grant", "", "")
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

func TestTouchStreak_FirstActivityStartsStreakAtOne(t *testing.T) {
	svc, xpRepo, _ := newTestService()

	resp, err := svc.TouchStreak(context.Background(), "u1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.CurrentStreak != 1 || resp.LongestStreak != 1 {
		t.Fatalf("expected streak of 1 on first activity, got %+v", resp)
	}
	if xpRepo.totalXp["u1"] != 5 {
		t.Fatalf("expected 5 xp streak bonus on first activity, got %d", xpRepo.totalXp["u1"])
	}
}

func TestTouchStreak_ConsecutiveDayIncrementsStreak(t *testing.T) {
	svc, _, achievementRepo := newTestService()

	achievementRepo.streaks["u1"] = &model.UserStreak{
		UserID:        "u1",
		CurrentStreak: 3,
		LongestStreak: 3,
		LastLoginDate: time.Now().UTC().AddDate(0, 0, -1),
	}

	resp, err := svc.TouchStreak(context.Background(), "u1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.CurrentStreak != 4 {
		t.Fatalf("expected streak to increment to 4, got %d", resp.CurrentStreak)
	}
}

func TestTouchStreak_GapResetsStreakAndKeepsLongest(t *testing.T) {
	svc, _, achievementRepo := newTestService()

	achievementRepo.streaks["u1"] = &model.UserStreak{
		UserID:        "u1",
		CurrentStreak: 3,
		LongestStreak: 3,
		LastLoginDate: time.Now().UTC().AddDate(0, 0, -3),
	}

	resp, err := svc.TouchStreak(context.Background(), "u1")
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

func TestTouchStreak_SameDayIsIdempotent(t *testing.T) {
	svc, xpRepo, _ := newTestService()
	ctx := context.Background()

	if _, err := svc.TouchStreak(ctx, "u1"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	afterFirst := xpRepo.totalXp["u1"]

	resp, err := svc.TouchStreak(ctx, "u1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.CurrentStreak != 1 {
		t.Fatalf("a second activity the same day must not advance the streak, got %d", resp.CurrentStreak)
	}
	if xpRepo.totalXp["u1"] != afterFirst {
		t.Fatalf("a second activity the same day must not pay a second bonus: %d then %d", afterFirst, xpRepo.totalXp["u1"])
	}
}

// GetUserStreak is a pure read. `me` calls it on every page load, so a streak
// that advances here would measure browsing rather than learning.
func TestGetUserStreak_DoesNotMutate(t *testing.T) {
	svc, xpRepo, achievementRepo := newTestService()
	ctx := context.Background()

	achievementRepo.streaks["u1"] = &model.UserStreak{
		UserID:        "u1",
		CurrentStreak: 3,
		LongestStreak: 7,
		LastLoginDate: time.Now().UTC().AddDate(0, 0, -1),
	}

	for i := 0; i < 3; i++ {
		resp, err := svc.GetUserStreak(ctx, "u1")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if resp.CurrentStreak != 3 {
			t.Fatalf("read %d advanced the streak to %d", i, resp.CurrentStreak)
		}
		if resp.LongestStreak != 7 {
			t.Fatalf("read %d changed the longest streak to %d", i, resp.LongestStreak)
		}
	}

	if xpRepo.totalXp["u1"] != 0 {
		t.Fatalf("reading a streak must never award xp, got %d", xpRepo.totalXp["u1"])
	}
	if achievementRepo.streaks["u1"].CurrentStreak != 3 {
		t.Fatalf("reading a streak must not write it back")
	}
}

// A streak whose last active day has already passed reads as broken, rather
// than showing a stale count until the next write.
func TestGetUserStreak_LapsedStreakReadsAsZero(t *testing.T) {
	svc, _, achievementRepo := newTestService()

	achievementRepo.streaks["u1"] = &model.UserStreak{
		UserID:        "u1",
		CurrentStreak: 9,
		LongestStreak: 9,
		LastLoginDate: time.Now().UTC().AddDate(0, 0, -4),
	}

	resp, err := svc.GetUserStreak(context.Background(), "u1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.CurrentStreak != 0 {
		t.Fatalf("expected a lapsed streak to read as 0, got %d", resp.CurrentStreak)
	}
	if resp.LongestStreak != 9 {
		t.Fatalf("longest streak should survive a lapse, got %d", resp.LongestStreak)
	}
}

func TestCalculateAndAwardXp_SurfacesAddXpError(t *testing.T) {
	svc, xpRepo, _ := newTestService()
	xpRepo.addXpErr = errors.New("db unavailable")

	if _, err := svc.CalculateAndAwardXp(context.Background(), "u1", "w1", "", 100, 100, 70); err == nil {
		t.Fatal("expected the add-xp error to be surfaced")
	}
	if xpRepo.totalXp["u1"] != 0 {
		t.Fatalf("no xp should be recorded when the repository fails, got %d", xpRepo.totalXp["u1"])
	}
}

func TestCalculateAndAwardXp_SurfacesAwardCheckError(t *testing.T) {
	svc, xpRepo, _ := newTestService()
	xpRepo.hasAwardedErr = errors.New("db unavailable")

	if _, err := svc.CalculateAndAwardXp(context.Background(), "u1", "w1", "", 100, 100, 70); err == nil {
		t.Fatal("expected the award-once check error to be surfaced")
	}
}

func TestCalculateAndAwardXp_AchievementErrorsDoNotFailAward(t *testing.T) {
	svc, xpRepo, achievementRepo := newTestService()
	achievementRepo.unlockErr = errors.New("achievement db unavailable")

	resp, err := svc.CalculateAndAwardXp(context.Background(), "u1", "w1", "", 100, 100, 70)
	if err != nil {
		t.Fatalf("achievement failures must not fail the xp award: %v", err)
	}
	if resp.XpEarned != 100 || resp.TotalXp != 100 {
		t.Fatalf("expected the full xp award despite achievement failures, got %+v", resp)
	}
	if xpRepo.totalXp["u1"] != 100 {
		t.Fatalf("xp repo must keep the award, got %d", xpRepo.totalXp["u1"])
	}
}

func TestCalculateAndAwardXp_PublisherErrorDoesNotFailAward(t *testing.T) {
	xpRepo := newFakeXpRepo()
	pub := &fakePublisher{xpErr: errors.New("redis unavailable")}
	svc := NewGamificationService(xpRepo, newFakeLeaderboardRepo(), newFakeAchievementRepo(), WithEventPublisher(pub)).(*gamificationService)

	resp, err := svc.CalculateAndAwardXp(context.Background(), "u1", "w1", "", 100, 100, 70)
	if err != nil {
		t.Fatalf("publish failures must not fail the xp award: %v", err)
	}
	if resp.XpEarned != 100 || resp.TotalXp != 100 {
		t.Fatalf("expected the full xp award despite publish failure, got %+v", resp)
	}
	if xpRepo.totalXp["u1"] != 100 {
		t.Fatalf("xp repo must keep the award, got %d", xpRepo.totalXp["u1"])
	}
}
