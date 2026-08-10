package service

import (
	"context"
	"testing"
	"time"
)

// Extensible Table-Driven Regression Test Suite for Gamification XP & Streak Logic
func TestGamificationRegression_XpThresholdMatrix(t *testing.T) {
	regressionMatrix := []struct {
		name       string
		score      int32
		expectedXp int32
	}{
		{"perfect score 100% awards 100 XP", 100, 100},
		{"high score 90% awards 90 XP", 90, 90},
		{"passing score 70% awards 70 XP", 70, 70},
		{"failing score 50% awards 0 XP", 50, 0},
		{"zero score awards 0 XP", 0, 0},
		{"boundary negative score awards 0 XP", -10, 0},
		{"boundary over 100 capped at 100 XP", 150, 100},
	}

	for _, tt := range regressionMatrix {
		t.Run(tt.name, func(t *testing.T) {
			got := calculateXpForScore(tt.score)
			if got != tt.expectedXp {
				t.Errorf("calculateXpForScore(%d) = %d; expected %d", tt.score, got, tt.expectedXp)
			}
		})
	}
}

func TestGamificationRegression_StreakCalculationMatrix(t *testing.T) {
	now := time.Date(2026, 8, 9, 12, 0, 0, 0, time.UTC)
	yesterday := now.AddDate(0, 0, -1)
	twoDaysAgo := now.AddDate(0, 0, -2)

	regressionMatrix := []struct {
		name           string
		currentStreak  int32
		lastActive     time.Time
		expectedStreak int32
	}{
		{
			name:           "First activity sets streak to 1",
			currentStreak:  0,
			lastActive:     time.Time{},
			expectedStreak: 1,
		},
		{
			name:           "Activity on consecutive day increments streak",
			currentStreak:  5,
			lastActive:     yesterday,
			expectedStreak: 6,
		},
		{
			name:           "Multiple activities on same day keeps streak unchanged",
			currentStreak:  5,
			lastActive:     now,
			expectedStreak: 5,
		},
		{
			name:           "Missed day resets streak to 1",
			currentStreak:  10,
			lastActive:     twoDaysAgo,
			expectedStreak: 1,
		},
	}

	for _, tt := range regressionMatrix {
		t.Run(tt.name, func(t *testing.T) {
			streak := computeNextStreak(tt.currentStreak, tt.lastActive, now)
			if streak != tt.expectedStreak {
				t.Errorf("computeNextStreak(%d, %v, %v) = %d; expected %d", tt.currentStreak, tt.lastActive, now, streak, tt.expectedStreak)
			}
		})
	}
}

// Helper functions for testing
func calculateXpForScore(score int32) int32 {
	if score < 70 {
		return 0
	}
	if score > 100 {
		return 100
	}
	return score
}

func computeNextStreak(currentStreak int32, lastActive, now time.Time) int32 {
	if lastActive.IsZero() {
		return 1
	}

	lastDate := lastActive.Truncate(24 * time.Hour)
	nowDate := now.Truncate(24 * time.Hour)
	daysDiff := int(nowDate.Sub(lastDate).Hours() / 24)

	if daysDiff == 0 {
		return currentStreak
	} else if daysDiff == 1 {
		return currentStreak + 1
	} else {
		return 1
	}
}

func TestGamificationRegression_AddXpIdempotency(t *testing.T) {
	xpRepo := newFakeXpRepo()
	achieveRepo := newFakeAchievementRepo()
	leaderboardRepo := &fakeLeaderboardRepo{}

	svc := NewGamificationService(xpRepo, leaderboardRepo, achieveRepo)
	ctx := context.Background()

	// 1. First award for wave_completed source-101
	res1, err := svc.AwardXp(ctx, "user-reg-1", 50, "wave_completed", "source-101")
	if err != nil {
		t.Fatalf("unexpected error on first award: %v", err)
	}
	if res1.TotalXp != 50 {
		t.Fatalf("expected 50 total XP, got %d", res1.TotalXp)
	}

	// 2. Duplicate award for same wave_completed source-101 should be idempotent (0 additional XP)
	res2, err := svc.AwardXp(ctx, "user-reg-1", 50, "wave_completed", "source-101")
	if err != nil {
		t.Fatalf("unexpected error on duplicate award: %v", err)
	}
	if res2.TotalXp != 50 {
		t.Fatalf("expected total XP to remain 50 on duplicate award, got %d", res2.TotalXp)
	}
}
