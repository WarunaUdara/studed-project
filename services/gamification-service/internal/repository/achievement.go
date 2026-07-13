package repository

import (
	"context"
	"time"

	"github.com/studed/gamification-service/internal/model"
	"gorm.io/gorm"
)

type AchievementRepository interface {
	GetUnlockedAchievements(ctx context.Context, userID string) ([]*model.UserAchievement, error)
	IsAchievementUnlocked(ctx context.Context, userID, achievementID string) (bool, error)
	UnlockAchievement(ctx context.Context, userID, achievementID string) (bool, error)
	GetAchievementsMetadata(ctx context.Context) ([]*model.Achievement, error)
	
	GetOrCreateStreak(ctx context.Context, userID string) (*model.UserStreak, error)
	SaveStreak(ctx context.Context, streak *model.UserStreak) error
}

type achievementRepository struct {
	db *gorm.DB
}

func NewAchievementRepository(db *gorm.DB) AchievementRepository {
	return &achievementRepository{db: db}
}

func (r *achievementRepository) GetUnlockedAchievements(ctx context.Context, userID string) ([]*model.UserAchievement, error) {
	var unlocked []*model.UserAchievement
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&unlocked).Error; err != nil {
		return nil, err
	}
	return unlocked, nil
}

func (r *achievementRepository) IsAchievementUnlocked(ctx context.Context, userID, achievementID string) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&model.UserAchievement{}).
		Where("user_id = ? AND achievement_id = ?", userID, achievementID).
		Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *achievementRepository) UnlockAchievement(ctx context.Context, userID, achievementID string) (bool, error) {
	unlocked, err := r.IsAchievementUnlocked(ctx, userID, achievementID)
	if err != nil {
		return false, err
	}
	if unlocked {
		return false, nil
	}

	ua := &model.UserAchievement{
		UserID:        userID,
		AchievementID: achievementID,
		UnlockedAt:    time.Now(),
	}
	if err := r.db.WithContext(ctx).Create(ua).Error; err != nil {
		return false, err
	}
	return true, nil
}

func (r *achievementRepository) GetAchievementsMetadata(ctx context.Context) ([]*model.Achievement, error) {
	var achievements []*model.Achievement
	if err := r.db.WithContext(ctx).Find(&achievements).Error; err != nil {
		return nil, err
	}
	return achievements, nil
}

func (r *achievementRepository) GetOrCreateStreak(ctx context.Context, userID string) (*model.UserStreak, error) {
	var streak model.UserStreak
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&streak).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			streak = model.UserStreak{
				UserID:        userID,
				CurrentStreak: 0,
				LongestStreak: 0,
				LastLoginDate: time.Time{},
				CreatedAt:     time.Now(),
				UpdatedAt:     time.Now(),
			}
			if err := r.db.WithContext(ctx).Create(&streak).Error; err != nil {
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
