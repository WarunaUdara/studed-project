package repository

import (
	"context"
	"errors"
	"time"

	"github.com/studed/gamification-service/internal/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type XpRepository interface {
	GetOrCreateUserXp(ctx context.Context, userID string) (*model.UserXp, error)
	AddXp(ctx context.Context, userID string, amount int32, reason, sourceID string) (int32, error)
	GetUserXp(ctx context.Context, userID string) (int32, error)
	HasAwardedXp(ctx context.Context, userID, reason, sourceID string) (bool, error)
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

// AddXp atomically increments the user's XP and records a history entry.
//
// Wave-completion rewards are award-once: if a history row already exists for
// the same (user, wave) the reward is skipped and the current total returned.
// The user_xp row is locked with SELECT ... FOR UPDATE so concurrent attempts
// for the same user cannot lose updates.
func (r *xpRepository) AddXp(ctx context.Context, userID string, amount int32, reason, sourceID string) (int32, error) {
	if userID == "" {
		return 0, errors.New("user id is required")
	}

	var totalXp int32
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Ensure the user_xp row exists before locking.
		if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&model.UserXp{
			UserID:    userID,
			TotalXp:   0,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}).Error; err != nil {
			return err
		}

		// Serialize concurrent awards for this user.
		var locked model.UserXp
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("user_id = ?", userID).First(&locked).Error; err != nil {
			return err
		}

		// Award-once: re-passing a completed wave grants no additional XP.
		if reason == "wave_completed" {
			var count int64
			if err := tx.Model(&model.XpHistory{}).
				Where("user_id = ? AND source_id = ? AND reason = ?", userID, sourceID, reason).
				Count(&count).Error; err != nil {
				return err
			}
			if count > 0 {
				totalXp = locked.TotalXp
				return nil
			}
		}

		totalXp = locked.TotalXp + amount
		if err := tx.Model(&model.UserXp{}).Where("user_id = ?", userID).
			UpdateColumn("total_xp", totalXp).
			UpdateColumn("updated_at", time.Now()).Error; err != nil {
			return err
		}

		return tx.Create(&model.XpHistory{
			UserID:    userID,
			Amount:    amount,
			Reason:    reason,
			SourceID:  sourceID,
			CreatedAt: time.Now(),
		}).Error
	})
	if err != nil {
		return 0, err
	}
	return totalXp, nil
}

func (r *xpRepository) GetUserXp(ctx context.Context, userID string) (int32, error) {
	userXp, err := r.GetOrCreateUserXp(ctx, userID)
	if err != nil {
		return 0, err
	}
	return userXp.TotalXp, nil
}

// HasAwardedXp reports whether a history row already exists for the given
// (user, reason, source). Used to gate award-once rewards before calling AddXp.
func (r *xpRepository) HasAwardedXp(ctx context.Context, userID, reason, sourceID string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.XpHistory{}).
		Where("user_id = ? AND reason = ? AND source_id = ?", userID, reason, sourceID).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
