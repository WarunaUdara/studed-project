package service

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/studed/gamification-service/internal/events"
	"github.com/studed/gamification-service/internal/model"
	"github.com/studed/gamification-service/internal/repository"
	gampb "github.com/studed/shared/proto/gen/go/gamification"
)

const (
	// maxLeaderboardPage caps a single board read. Without it the query returns
	// every ranked user, which is fine at demo scale and is not at 10,000.
	maxLeaderboardPage = 100
	streakBonusCap     = 50
)

// EventPublisher pushes real-time gamification events to Redis pub/sub for
// the api-gateway's GraphQL subscriptions.
type EventPublisher interface {
	PublishXpAwarded(ctx context.Context, e events.XpAwardedEvent) error
	PublishAchievementUnlocked(ctx context.Context, e events.AchievementUnlockedEvent) error
}

type GamificationService interface {
	CalculateAndAwardXp(ctx context.Context, userID, waveID, courseID string, score, xpReward, passingThreshold int32) (*gampb.XpCalculationResponse, error)
	AwardXp(ctx context.Context, userID string, amount int32, reason, sourceID, courseID string) (*gampb.AwardXpResponse, error)
	GetUserXp(ctx context.Context, userID string) (*gampb.GetUserXpResponse, error)
	GetLeaderboard(ctx context.Context, scope, courseID string, grade, limit, offset int32) (*gampb.GetLeaderboardResponse, error)
	UpdateLeaderboard(ctx context.Context, userID, fullName, courseID string, grade int32) (*gampb.UpdateLeaderboardResponse, error)
	GetRank(ctx context.Context, userID string, scope, courseID string, grade int32) (*gampb.GetRankResponse, error)

	GetAchievements(ctx context.Context, userID string) (*gampb.GetAchievementsResponse, error)
	UnlockAchievement(ctx context.Context, userID, achievementID string) (*gampb.UnlockAchievementResponse, error)
	GetUserStreak(ctx context.Context, userID string) (*gampb.GetUserStreakResponse, error)
	TouchStreak(ctx context.Context, userID string) (*gampb.GetUserStreakResponse, error)
	RebuildLeaderboards(ctx context.Context) error
}

type gamificationService struct {
	xpRepo          repository.XpRepository
	leaderboardRepo repository.LeaderboardRepository
	achievementRepo repository.AchievementRepository
	publisher       EventPublisher
	// now is injectable so week rollover and streak day maths are testable.
	now func() time.Time
}

type Option func(*gamificationService)

// WithEventPublisher enables real-time event publishing over Redis pub/sub.
func WithEventPublisher(p EventPublisher) Option {
	return func(s *gamificationService) {
		s.publisher = p
	}
}

// WithClock pins the service clock, for tests that cross a week or day boundary.
func WithClock(now func() time.Time) Option {
	return func(s *gamificationService) {
		s.now = now
	}
}

func NewGamificationService(
	xpRepo repository.XpRepository,
	leaderboardRepo repository.LeaderboardRepository,
	achievementRepo repository.AchievementRepository,
	opts ...Option,
) GamificationService {
	s := &gamificationService{
		xpRepo:          xpRepo,
		leaderboardRepo: leaderboardRepo,
		achievementRepo: achievementRepo,
		now:             time.Now,
	}
	for _, opt := range opts {
		opt(s)
	}
	return s
}

// publishXpAwarded emits an XP event; publish failures never fail the award.
func (s *gamificationService) publishXpAwarded(ctx context.Context, userID, sourceID string, amount, totalXp int32, reason string) {
	if s.publisher == nil || amount == 0 {
		return
	}
	if err := s.publisher.PublishXpAwarded(ctx, events.XpAwardedEvent{
		UserID:   userID,
		SourceID: sourceID,
		Amount:   amount,
		TotalXp:  totalXp,
		Reason:   reason,
	}); err != nil {
		slog.Warn("failed to publish xp event", slog.Any("error", err))
	}
}

func (s *gamificationService) CalculateAndAwardXp(ctx context.Context, userID, waveID, courseID string, score, xpReward, passingThreshold int32) (*gampb.XpCalculationResponse, error) {
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

	// Award-once: re-passing an already-completed wave grants no additional XP.
	alreadyAwarded, err := s.xpRepo.HasAwardedXp(ctx, userID, "wave_completed", waveID)
	if err != nil {
		return nil, fmt.Errorf("failed to check previous award: %w", err)
	}
	if alreadyAwarded {
		totalXp, err := s.xpRepo.GetUserXp(ctx, userID)
		if err != nil {
			return nil, fmt.Errorf("failed to get user xp: %w", err)
		}
		return &gampb.XpCalculationResponse{
			XpEarned: 0,
			TotalXp:  totalXp,
		}, nil
	}

	totalXp, err := s.xpRepo.AddXp(ctx, userID, xpEarned, "wave_completed", waveID, courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to award xp: %w", err)
	}

	s.publishXpAwarded(ctx, userID, waveID, xpEarned, totalXp, "wave_completed")

	// Trigger achievement evaluation
	if xpEarned > 0 {
		if _, err := s.UnlockAchievement(ctx, userID, "first_wave"); err != nil {
			slog.Warn("failed to unlock achievement", slog.String("achievement", "first_wave"), slog.Any("error", err))
		}
		if score == 100 {
			if _, err := s.UnlockAchievement(ctx, userID, "perfect_score"); err != nil {
				slog.Warn("failed to unlock achievement", slog.String("achievement", "perfect_score"), slog.Any("error", err))
			}
		}
		totalXp = s.unlockXpMilestones(ctx, userID, totalXp)
	}

	// Refresh every board this award touches. A ranking failure is never
	// allowed to undo a durable XP award, so it is logged, not returned.
	if err := s.syncScopes(ctx, userID, courseID); err != nil {
		slog.Error("leaderboard sync failed after award",
			slog.String("user_id", userID), slog.Any("error", err))
	}

	return &gampb.XpCalculationResponse{
		XpEarned: xpEarned,
		TotalXp:  totalXp,
	}, nil
}

// unlockXpMilestones awards the cumulative-XP achievements and returns the
// total including any bonus those unlocks paid out.
func (s *gamificationService) unlockXpMilestones(ctx context.Context, userID string, totalXp int32) int32 {
	milestones := []struct {
		at int32
		id string
	}{
		{500, "rising_star"},
		{2000, "scholar"},
		{5000, "master"},
	}
	for _, m := range milestones {
		if totalXp < m.at {
			continue
		}
		if _, err := s.UnlockAchievement(ctx, userID, m.id); err != nil {
			slog.Warn("failed to unlock achievement", slog.String("achievement", m.id), slog.Any("error", err))
		}
	}
	if refreshed, err := s.xpRepo.GetUserXp(ctx, userID); err == nil {
		return refreshed
	}
	return totalXp
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

func (s *gamificationService) AwardXp(ctx context.Context, userID string, amount int32, reason, sourceID, courseID string) (*gampb.AwardXpResponse, error) {
	if userID == "" {
		return nil, fmt.Errorf("user id is required")
	}

	totalXp, err := s.xpRepo.AddXp(ctx, userID, amount, reason, sourceID, courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to award xp: %w", err)
	}

	s.publishXpAwarded(ctx, userID, sourceID, amount, totalXp, reason)

	// Achievement bonuses call back into AwardXp. Re-entering the milestone
	// check from there would recurse, so only direct awards evaluate them.
	if !strings.HasPrefix(reason, "achievement_") {
		totalXp = s.unlockXpMilestones(ctx, userID, totalXp)
	}

	if err := s.syncScopes(ctx, userID, courseID); err != nil {
		slog.Error("leaderboard sync failed after award",
			slog.String("user_id", userID), slog.Any("error", err))
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

// scopeKeyFor lists every board a single user appears on. Course boards are
// only touched when the award is attributable to a course.
func (s *gamificationService) syncScopes(ctx context.Context, userID, courseID string) error {
	now := s.now()

	identity, err := s.xpRepo.GetIdentities(ctx, []string{userID})
	if err != nil {
		return fmt.Errorf("failed to read identity: %w", err)
	}
	who := identity[userID]

	if err := s.leaderboardRepo.Set(ctx, repository.ScopeGlobal, "", 0, userID, who.TotalXp, now); err != nil {
		return fmt.Errorf("global: %w", err)
	}
	if who.Grade != 0 {
		if err := s.leaderboardRepo.Set(ctx, repository.ScopeGrade, "", who.Grade, userID, who.TotalXp, now); err != nil {
			return fmt.Errorf("grade: %w", err)
		}
	}

	weekly, err := s.xpRepo.SumSince(ctx, userID, startOfWeek(now))
	if err != nil {
		return fmt.Errorf("weekly sum: %w", err)
	}
	if err := s.leaderboardRepo.Set(ctx, repository.ScopeWeekly, "", 0, userID, weekly, now); err != nil {
		return fmt.Errorf("weekly: %w", err)
	}

	if courseID != "" {
		courseXp, err := s.xpRepo.CourseXp(ctx, userID, courseID)
		if err != nil {
			return fmt.Errorf("course sum: %w", err)
		}
		if err := s.leaderboardRepo.Set(ctx, repository.ScopeCourse, courseID, 0, userID, courseXp, now); err != nil {
			return fmt.Errorf("course: %w", err)
		}
	}

	return nil
}

// startOfWeek is Monday 00:00 UTC, matching the weekly board's bucket.
func startOfWeek(at time.Time) time.Time {
	utc := at.UTC()
	offset := (int(utc.Weekday()) + 6) % 7
	day := time.Date(utc.Year(), utc.Month(), utc.Day(), 0, 0, 0, 0, time.UTC)
	return day.AddDate(0, 0, -offset)
}

func (s *gamificationService) GetLeaderboard(ctx context.Context, scope, courseID string, grade, limit, offset int32) (*gampb.GetLeaderboardResponse, error) {
	if limit <= 0 || limit > maxLeaderboardPage {
		limit = maxLeaderboardPage
	}

	ranked, total, err := s.leaderboardRepo.Page(ctx, scope, courseID, grade, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get leaderboard: %w", err)
	}

	// One lookup for the whole page, not one per row.
	ids := make([]string, 0, len(ranked))
	for _, r := range ranked {
		ids = append(ids, r.UserID)
	}
	identities, err := s.xpRepo.GetIdentities(ctx, ids)
	if err != nil {
		return nil, fmt.Errorf("failed to resolve leaderboard names: %w", err)
	}

	entries := make([]*gampb.LeaderboardEntry, len(ranked))
	for i, r := range ranked {
		entries[i] = &gampb.LeaderboardEntry{
			Rank:     r.Rank,
			UserId:   r.UserID,
			FullName: identities[r.UserID].DisplayName,
			TotalXp:  r.TotalXp,
		}
	}

	return &gampb.GetLeaderboardResponse{Entries: entries, TotalRanked: total}, nil
}

// UpdateLeaderboard records who a user is and refreshes every board they are
// on. It takes no XP total: totals come from this service's own ledger, so a
// caller can never publish a figure that disagrees with it.
func (s *gamificationService) UpdateLeaderboard(ctx context.Context, userID, fullName, courseID string, grade int32) (*gampb.UpdateLeaderboardResponse, error) {
	if userID == "" {
		return nil, fmt.Errorf("user id is required")
	}
	if err := s.xpRepo.SaveIdentity(ctx, userID, fullName, grade); err != nil {
		return nil, fmt.Errorf("failed to save leaderboard identity: %w", err)
	}
	if err := s.syncScopes(ctx, userID, courseID); err != nil {
		return nil, fmt.Errorf("failed to update leaderboard: %w", err)
	}
	return &gampb.UpdateLeaderboardResponse{}, nil
}

func (s *gamificationService) GetRank(ctx context.Context, userID string, scope, courseID string, grade int32) (*gampb.GetRankResponse, error) {
	if userID == "" {
		return nil, fmt.Errorf("user id is required")
	}
	ranked, total, err := s.leaderboardRepo.RankOf(ctx, scope, courseID, grade, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get rank: %w", err)
	}
	// Rank 0 means "not ranked in this scope yet" — an ordinary answer.
	return &gampb.GetRankResponse{
		Rank:        ranked.Rank,
		TotalXp:     ranked.TotalXp,
		TotalRanked: total,
	}, nil
}

// RebuildLeaderboards reconstructs every scope from Postgres. Redis is a
// derived index: a flush, a failover, or an eviction must cost nothing but the
// time this takes. Called on boot.
func (s *gamificationService) RebuildLeaderboards(ctx context.Context) error {
	now := s.now()

	users, err := s.xpRepo.GetAllUserXp(ctx)
	if err != nil {
		return fmt.Errorf("failed to read user xp: %w", err)
	}
	grades := make(map[int32]struct{})
	for _, u := range users {
		if err := s.leaderboardRepo.Set(ctx, repository.ScopeGlobal, "", 0, u.UserID, u.TotalXp, now); err != nil {
			return fmt.Errorf("global rebuild: %w", err)
		}
		if u.Grade != 0 {
			if err := s.leaderboardRepo.Set(ctx, repository.ScopeGrade, "", u.Grade, u.UserID, u.TotalXp, now); err != nil {
				return fmt.Errorf("grade rebuild: %w", err)
			}
			grades[u.Grade] = struct{}{}
		}
	}

	weekly, err := s.xpRepo.AllSumsSince(ctx, startOfWeek(now))
	if err != nil {
		return fmt.Errorf("failed to read weekly sums: %w", err)
	}
	for _, w := range weekly {
		if err := s.leaderboardRepo.Set(ctx, repository.ScopeWeekly, "", 0, w.UserID, w.TotalXp, now); err != nil {
			return fmt.Errorf("weekly rebuild: %w", err)
		}
	}

	courses, err := s.xpRepo.AllCourseXp(ctx)
	if err != nil {
		return fmt.Errorf("failed to read course xp: %w", err)
	}
	for _, c := range courses {
		if err := s.leaderboardRepo.Set(ctx, repository.ScopeCourse, c.CourseID, 0, c.UserID, c.TotalXp, now); err != nil {
			return fmt.Errorf("course rebuild: %w", err)
		}
	}

	slog.Info("leaderboard rebuild complete",
		slog.Int("users", len(users)),
		slog.Int("grades", len(grades)),
		slog.Int("weekly_entries", len(weekly)),
		slog.Int("course_entries", len(courses)))
	return nil
}

// GetAchievements returns the whole catalog, unlocked ones flagged. The UI
// must be able to show what is still locked without knowing the unlock rules,
// which is what let a parallel copy of those rules grow in the frontend.
func (s *gamificationService) GetAchievements(ctx context.Context, userID string) (*gampb.GetAchievementsResponse, error) {
	if userID == "" {
		return nil, fmt.Errorf("user id is required")
	}

	metadata, err := s.achievementRepo.GetAchievementsMetadata(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch achievements metadata: %w", err)
	}

	unlocked, err := s.achievementRepo.GetUnlockedAchievements(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch unlocked achievements: %w", err)
	}

	unlockedMap := make(map[string]*model.UserAchievement, len(unlocked))
	for _, u := range unlocked {
		unlockedMap[u.AchievementID] = u
	}

	pbAchievements := make([]*gampb.Achievement, 0, len(metadata))
	for _, m := range metadata {
		entry := &gampb.Achievement{
			Id:          m.ID,
			Name:        m.Name,
			Description: m.Description,
			IconUrl:     m.IconUrl,
		}
		if u, exists := unlockedMap[m.ID]; exists {
			entry.Unlocked = true
			entry.UnlockedAtUnix = u.UnlockedAt.Unix()
		}
		pbAchievements = append(pbAchievements, entry)
	}

	return &gampb.GetAchievementsResponse{
		Achievements: pbAchievements,
	}, nil
}

func (s *gamificationService) UnlockAchievement(ctx context.Context, userID, achievementID string) (*gampb.UnlockAchievementResponse, error) {
	if userID == "" || achievementID == "" {
		return nil, fmt.Errorf("user id and achievement id are required")
	}

	unlocked, err := s.achievementRepo.UnlockAchievement(ctx, userID, achievementID)
	if err != nil {
		return nil, fmt.Errorf("failed to unlock achievement: %w", err)
	}

	if unlocked {
		if s.publisher != nil {
			event := events.AchievementUnlockedEvent{
				UserID:         userID,
				ID:             achievementID,
				Name:           achievementID,
				UnlockedAtUnix: time.Now().Unix(),
			}
			if metadata, err := s.achievementRepo.GetAchievementsMetadata(ctx); err == nil {
				for _, m := range metadata {
					if m.ID == achievementID {
						event.Name = m.Name
						event.Description = m.Description
						event.IconURL = m.IconUrl
						break
					}
				}
			}
			if err := s.publisher.PublishAchievementUnlocked(ctx, event); err != nil {
				slog.Warn("failed to publish achievement event", slog.Any("error", err))
			}
		}

		var bonusXp int32
		switch achievementID {
		case "lesson_complete":
			bonusXp = 20
		case "lesson_proficient":
			bonusXp = 100
		case "first_course":
			bonusXp = 200
		}

		if bonusXp > 0 {
			if _, err := s.AwardXp(ctx, userID, bonusXp, fmt.Sprintf("achievement_%s", achievementID), achievementID, ""); err != nil {
				slog.Warn("failed to award achievement bonus xp",
					slog.String("achievement", achievementID), slog.Any("error", err))
			}
		}
	}

	return &gampb.UnlockAchievementResponse{
		Unlocked: unlocked,
	}, nil
}

// GetUserStreak is a pure read. It must never advance the streak: `me` calls
// it on every page load, and a streak that grows by browsing measures the
// wrong thing entirely.
func (s *gamificationService) GetUserStreak(ctx context.Context, userID string) (*gampb.GetUserStreakResponse, error) {
	if userID == "" {
		return nil, fmt.Errorf("user id is required")
	}

	streak, err := s.achievementRepo.GetOrCreateStreak(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get streak: %w", err)
	}

	current := streak.CurrentStreak
	// A streak whose last active day is older than yesterday has already
	// lapsed; report it as broken rather than waiting for the next write.
	if !streak.LastLoginDate.IsZero() && daysBetween(streak.LastLoginDate, s.now()) > 1 {
		current = 0
	}

	return &gampb.GetUserStreakResponse{
		CurrentStreak:     current,
		LongestStreak:     streak.LongestStreak,
		LastLoginDateUnix: lastActiveUnix(streak.LastLoginDate),
	}, nil
}

// TouchStreak records learning activity for today and advances the streak.
// Called when a student actually does something — a recorded wave attempt —
// not when they open a page.
func (s *gamificationService) TouchStreak(ctx context.Context, userID string) (*gampb.GetUserStreakResponse, error) {
	if userID == "" {
		return nil, fmt.Errorf("user id is required")
	}

	streak, err := s.achievementRepo.GetOrCreateStreak(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get or create streak: %w", err)
	}

	now := s.now().UTC()

	// Already counted today: nothing to advance, nothing to award.
	if !streak.LastLoginDate.IsZero() && daysBetween(streak.LastLoginDate, now) == 0 {
		return &gampb.GetUserStreakResponse{
			CurrentStreak:     streak.CurrentStreak,
			LongestStreak:     streak.LongestStreak,
			LastLoginDateUnix: lastActiveUnix(streak.LastLoginDate),
		}, nil
	}

	if !streak.LastLoginDate.IsZero() && daysBetween(streak.LastLoginDate, now) == 1 {
		streak.CurrentStreak++
	} else {
		streak.CurrentStreak = 1
	}
	if streak.CurrentStreak > streak.LongestStreak {
		streak.LongestStreak = streak.CurrentStreak
	}
	streak.LastLoginDate = now

	if err := s.achievementRepo.SaveStreak(ctx, streak); err != nil {
		return nil, fmt.Errorf("failed to save streak: %w", err)
	}

	// streak_bonus = min(streak * 5, 50), per 05-Gamification/XP-System.md.
	bonus := streak.CurrentStreak * 5
	if bonus > streakBonusCap {
		bonus = streakBonusCap
	}
	// Award-once per day: the source is the date, so a replay cannot pay twice.
	if _, err := s.AwardXp(ctx, userID, bonus, "streak_bonus", now.Format("2006-01-02"), ""); err != nil {
		slog.Warn("failed to award streak xp", slog.String("user_id", userID), slog.Any("error", err))
	}

	return &gampb.GetUserStreakResponse{
		CurrentStreak:     streak.CurrentStreak,
		LongestStreak:     streak.LongestStreak,
		LastLoginDateUnix: streak.LastLoginDate.Unix(),
	}, nil
}

// daysBetween counts whole UTC calendar days from `from` to `to`.
func daysBetween(from, to time.Time) int {
	a := from.UTC().Truncate(24 * time.Hour)
	b := to.UTC().Truncate(24 * time.Hour)
	return int(b.Sub(a).Hours() / 24)
}

func lastActiveUnix(t time.Time) int64 {
	if t.IsZero() {
		return 0
	}
	return t.Unix()
}
