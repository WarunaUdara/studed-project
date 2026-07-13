package service

import (
	"context"
	"fmt"
	"time"

	"github.com/studed/gamification-service/internal/model"
	"github.com/studed/gamification-service/internal/repository"
	gampb "github.com/studed/shared/proto/gen/go/gamification"
)

type GamificationService interface {
	CalculateAndAwardXp(ctx context.Context, userID, waveID string, score, xpReward, passingThreshold int32) (*gampb.XpCalculationResponse, error)
	AwardXp(ctx context.Context, userID string, amount int32, reason, sourceID string) (*gampb.AwardXpResponse, error)
	GetUserXp(ctx context.Context, userID string) (*gampb.GetUserXpResponse, error)
	GetLeaderboard(ctx context.Context, scope, courseID string, grade int32, limit int32) (*gampb.GetLeaderboardResponse, error)
	UpdateLeaderboard(ctx context.Context, userID, fullName string, totalXp int32, scope, courseID string, grade int32) (*gampb.UpdateLeaderboardResponse, error)
	GetRank(ctx context.Context, userID string, scope, courseID string, grade int32) (*gampb.GetRankResponse, error)
	
	GetAchievements(ctx context.Context, userID string) (*gampb.GetAchievementsResponse, error)
	UnlockAchievement(ctx context.Context, userID, achievementID string) (*gampb.UnlockAchievementResponse, error)
	GetUserStreak(ctx context.Context, userID string) (*gampb.GetUserStreakResponse, error)
}

type gamificationService struct {
	xpRepo          repository.XpRepository
	leaderboardRepo repository.LeaderboardRepository
	achievementRepo repository.AchievementRepository
}

func NewGamificationService(
	xpRepo repository.XpRepository,
	leaderboardRepo repository.LeaderboardRepository,
	achievementRepo repository.AchievementRepository,
) GamificationService {
	return &gamificationService{
		xpRepo:          xpRepo,
		leaderboardRepo: leaderboardRepo,
		achievementRepo: achievementRepo,
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

	// Trigger achievement evaluation
	if xpEarned > 0 {
		if _, err := s.UnlockAchievement(ctx, userID, "first_wave"); err != nil {
			fmt.Printf("failed to unlock first_wave achievement: %v\n", err)
		}

		if score == 100 {
			if _, err := s.UnlockAchievement(ctx, userID, "perfect_score"); err != nil {
				fmt.Printf("failed to unlock perfect_score achievement: %v\n", err)
			}
		}

		if totalXp >= 500 {
			if _, err := s.UnlockAchievement(ctx, userID, "rising_star"); err != nil {
				fmt.Printf("failed to unlock rising_star achievement: %v\n", err)
			}
		}
		if totalXp >= 2000 {
			if _, err := s.UnlockAchievement(ctx, userID, "scholar"); err != nil {
				fmt.Printf("failed to unlock scholar achievement: %v\n", err)
			}
		}
		if totalXp >= 5000 {
			if _, err := s.UnlockAchievement(ctx, userID, "master"); err != nil {
				fmt.Printf("failed to unlock master achievement: %v\n", err)
			}
		}
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

	// Trigger achievement checks based on total XP after manually awarding XP as well
	if totalXp >= 500 {
		if _, err := s.UnlockAchievement(ctx, userID, "rising_star"); err != nil {
			fmt.Printf("failed to unlock rising_star achievement: %v\n", err)
		}
	}
	if totalXp >= 2000 {
		if _, err := s.UnlockAchievement(ctx, userID, "scholar"); err != nil {
			fmt.Printf("failed to unlock scholar achievement: %v\n", err)
		}
	}
	if totalXp >= 5000 {
		if _, err := s.UnlockAchievement(ctx, userID, "master"); err != nil {
			fmt.Printf("failed to unlock master achievement: %v\n", err)
		}
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

func (s *gamificationService) GetRank(ctx context.Context, userID string, scope, courseID string, grade int32) (*gampb.GetRankResponse, error) {
	rank, err := s.leaderboardRepo.GetRank(ctx, userID, scope, courseID, grade)
	if err != nil {
		return nil, err
	}
	return &gampb.GetRankResponse{
		Rank: int32(rank),
	}, nil
}

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

	unlockedMap := make(map[string]*model.UserAchievement)
	for _, u := range unlocked {
		unlockedMap[u.AchievementID] = u
	}

	var pbAchievements []*gampb.Achievement
	for _, m := range metadata {
		if u, exists := unlockedMap[m.ID]; exists {
			pbAchievements = append(pbAchievements, &gampb.Achievement{
				Id:             m.ID,
				Name:           m.Name,
				Description:    m.Description,
				IconUrl:        m.IconUrl,
				UnlockedAtUnix: u.UnlockedAt.Unix(),
			})
		}
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
			if _, err := s.AwardXp(ctx, userID, bonusXp, fmt.Sprintf("achievement_%s", achievementID), achievementID); err != nil {
				fmt.Printf("failed to award achievement bonus xp: %v\n", err)
			}
		}
	}

	return &gampb.UnlockAchievementResponse{
		Unlocked: unlocked,
	}, nil
}

func (s *gamificationService) GetUserStreak(ctx context.Context, userID string) (*gampb.GetUserStreakResponse, error) {
	if userID == "" {
		return nil, fmt.Errorf("user id is required")
	}

	streak, err := s.achievementRepo.GetOrCreateStreak(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get or create streak: %w", err)
	}

	now := time.Now().UTC()
	todayStr := now.Format("2006-01-02")
	yesterdayStr := now.AddDate(0, 0, -1).Format("2006-01-02")

	if streak.LastLoginDate.IsZero() {
		streak.CurrentStreak = 1
		streak.LongestStreak = 1
		streak.LastLoginDate = now
		if err := s.achievementRepo.SaveStreak(ctx, streak); err != nil {
			return nil, fmt.Errorf("failed to save streak: %w", err)
		}
		if _, err := s.AwardXp(ctx, userID, 5, "streak_bonus", ""); err != nil {
			fmt.Printf("failed to award streak xp: %v\n", err)
		}
	} else {
		lastLoginStr := streak.LastLoginDate.Format("2006-01-02")
		if lastLoginStr == todayStr {
			// Already logged in today, do nothing.
		} else if lastLoginStr == yesterdayStr {
			streak.CurrentStreak += 1
			if streak.CurrentStreak > streak.LongestStreak {
				streak.LongestStreak = streak.CurrentStreak
			}
			streak.LastLoginDate = now
			if err := s.achievementRepo.SaveStreak(ctx, streak); err != nil {
				return nil, fmt.Errorf("failed to save streak: %w", err)
			}
			xpAmount := streak.CurrentStreak * 5
			if xpAmount > 50 {
				xpAmount = 50
			}
			if _, err := s.AwardXp(ctx, userID, xpAmount, "streak_bonus", ""); err != nil {
				fmt.Printf("failed to award streak xp: %v\n", err)
			}
		} else {
			streak.CurrentStreak = 1
			streak.LastLoginDate = now
			if err := s.achievementRepo.SaveStreak(ctx, streak); err != nil {
				return nil, fmt.Errorf("failed to save streak: %w", err)
			}
			if _, err := s.AwardXp(ctx, userID, 5, "streak_bonus", ""); err != nil {
				fmt.Printf("failed to award streak xp: %v\n", err)
			}
		}
	}

	return &gampb.GetUserStreakResponse{
		CurrentStreak:     streak.CurrentStreak,
		LongestStreak:     streak.LongestStreak,
		LastLoginDateUnix: streak.LastLoginDate.Unix(),
	}, nil
}
