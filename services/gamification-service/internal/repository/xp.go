package repository

import (
	"context"
	"time"

	"github.com/studed/gamification-service/internal/model"
	"gorm.io/gorm"
)

type XpRepository interface {
	GetOrCreateUserXp(ctx context.Context, userID string) (*model.UserXp, error)
	AddXp(ctx context.Context, userID string, amount int32, reason, sourceID string) (int32, error)
	GetUserXp(ctx context.Context, userID string) (int32, error)
}

type xpRepository struct {
	db *gorm.DB
}

func NewXpRepository(db *gorm.DB) XpRepository {
	return &xpRepository{db: db}
}

func (r *xpRepository) GetOrCreateUserXp(ctx context.Context, userID string) (*model.UserXp, error) {
	var userXp model.UserXp
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&userXp).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			userXp = model.UserXp{
				UserID:    userID,
				TotalXp:   0,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}
			if err := r.db.WithContext(ctx).Create(&userXp).Error; err != nil {
				return nil, err
			}
			return &userXp, nil
		}
		return nil, err
	}
	return &userXp, nil
}

func (r *xpRepository) AddXp(ctx context.Context, userID string, amount int32, reason, sourceID string) (int32, error) {
	userXp, err := r.GetOrCreateUserXp(ctx, userID)
	if err != nil {
		return 0, err
	}

	userXp.TotalXp += amount
	userXp.UpdatedAt = time.Now()

	if err := r.db.WithContext(ctx).Save(userXp).Error; err != nil {
		return 0, err
	}

	history := &model.XpHistory{
		UserID:    userID,
		Amount:    amount,
		Reason:    reason,
		SourceID:  sourceID,
		CreatedAt: time.Now(),
	}
	if err := r.db.WithContext(ctx).Create(history).Error; err != nil {
		return 0, err
	}

	return userXp.TotalXp, nil
}

func (r *xpRepository) GetUserXp(ctx context.Context, userID string) (int32, error) {
	userXp, err := r.GetOrCreateUserXp(ctx, userID)
	if err != nil {
		return 0, err
	}
	return userXp.TotalXp, nil
}
