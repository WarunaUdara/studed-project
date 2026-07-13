package repository

import (
	"context"
	"errors"
	"time"

	"github.com/studed/gamification-service/internal/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type AchievementMetadata struct {
	ID          string
	Name        string
	Description string
	IconUrl     string
}

var staticAchievements = []*AchievementMetadata{
	{
		ID:          "first_wave",
		Name:        "First Wave",
		Description: "Complete your first wave",
		IconUrl:     "waves",
	},
	{
		ID:          "perfect_score",
		Name:        "Perfect Score",
		Description: "Score 100% on any wave",
		IconUrl:     "target",
	},
	{
		ID:          "lesson_complete",
		Name:        "Lesson Complete",
		Description: "Complete all waves in a lesson",
		IconUrl:     "book",
	},
	{
		ID:          "lesson_proficient",
		Name:        "Lesson Proficient",
		Description: "Reach Proficient in a lesson",
		IconUrl:     "star",
	},
	{
		ID:          "rising_star",
		Name:        "Rising Star",
		Description: "Earn 500 XP",
		IconUrl:     "sparkles",
	},
	{
		ID:          "scholar",
		Name:        "Scholar",
		Description: "Earn 2,000 XP",
		IconUrl:     "graduation",
	},
	{
		ID:          "master",
		Name:        "Master",
		Description: "Earn 5,000 XP",
		IconUrl:     "crown",
	},
	{
		ID:          "first_course",
		Name:        "Course Conqueror",
		Description: "Complete an entire course",
		IconUrl:     "trophy",
	},
}

type AchievementRepository interface {
	UnlockAchievement(ctx context.Context, userID, achievementID string) (bool, error)
	GetAchievementsMetadata(ctx context.Context) ([]*AchievementMetadata, error)
	GetUnlockedAchievements(ctx context.Context, userID string) ([]*model.UserAchievement, error)
	GetOrCreateStreak(ctx context.Context, userID string) (*model.UserStreak, error)
	SaveStreak(ctx context.Context, streak *model.UserStreak) error
}

type achievementRepository struct {
	db *gorm.DB
}

func NewAchievementRepository(db *gorm.DB) AchievementRepository {
	return &achievementRepository{db: db}
}

func (r *achievementRepository) UnlockAchievement(ctx context.Context, userID, achievementID string) (bool, error) {
	ua := model.UserAchievement{
		UserID:        userID,
		AchievementID: achievementID,
		UnlockedAt:    time.Now(),
	}

	result := r.db.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(&ua)
	if result.Error != nil {
		return false, result.Error
	}
	return result.RowsAffected > 0, nil
}

func (r *achievementRepository) GetAchievementsMetadata(ctx context.Context) ([]*AchievementMetadata, error) {
	var achievements []*AchievementMetadata
	err := r.db.WithContext(ctx).Table("achievements").Find(&achievements).Error
	return achievements, err
}

func (r *achievementRepository) GetUnlockedAchievements(ctx context.Context, userID string) ([]*model.UserAchievement, error) {
	var achievements []*model.UserAchievement
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&achievements).Error
	return achievements, err
}

func (r *achievementRepository) GetOrCreateStreak(ctx context.Context, userID string) (*model.UserStreak, error) {
	var streak model.UserStreak
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&streak).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			now := time.Now()
			streak = model.UserStreak{
				UserID:        userID,
				CurrentStreak: 0,
				LongestStreak: 0,
				CreatedAt:     now,
				UpdatedAt:     now,
			}
			err = r.db.WithContext(ctx).Create(&streak).Error
			if err != nil {
				return nil, err
			}
			return &streak, nil
		}
		return nil, err
	}
	return &streak, nil
}

func (r *achievementRepository) SaveStreak(ctx context.Context, streak *model.UserStreak) error {
	streak.UpdatedAt = time.Now()
	return r.db.WithContext(ctx).Save(streak).Error
}
