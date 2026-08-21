package repository

import (
	"context"
	"errors"
	"time"

	"github.com/studed/gamification-service/internal/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// CourseXp is one student's XP earned inside one course.
type CourseXp struct {
	UserID   string
	CourseID string
	TotalXp  int32
}

// UserSum is one student's XP over some window, used by the weekly board.
type UserSum struct {
	UserID  string
	TotalXp int32
}

type XpRepository interface {
	GetOrCreateUserXp(ctx context.Context, userID string) (*model.UserXp, error)
	AddXp(ctx context.Context, userID string, amount int32, reason, sourceID, courseID string) (int32, error)
	GetUserXp(ctx context.Context, userID string) (int32, error)
	GetAllUserXp(ctx context.Context) ([]model.UserXp, error)
	HasAwardedXp(ctx context.Context, userID, reason, sourceID string) (bool, error)

	// SaveIdentity records who a ranked user is, so leaderboards survive a
	// Redis flush with real names rather than placeholders.
	SaveIdentity(ctx context.Context, userID, displayName string, grade int32) error
	GetIdentities(ctx context.Context, userIDs []string) (map[string]model.UserXp, error)

	// CourseXp is XP earned inside one course; SumSince is XP earned in a
	// window. Both back leaderboard scopes that a global total cannot express.
	CourseXp(ctx context.Context, userID, courseID string) (int32, error)
	SumSince(ctx context.Context, userID string, since time.Time) (int32, error)
	AllCourseXp(ctx context.Context) ([]CourseXp, error)
	AllSumsSince(ctx context.Context, since time.Time) ([]UserSum, error)
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
func (r *xpRepository) AddXp(ctx context.Context, userID string, amount int32, reason, sourceID, courseID string) (int32, error) {
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
			CourseID:  courseID,
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

func (r *xpRepository) GetAllUserXp(ctx context.Context) ([]model.UserXp, error) {
	var users []model.UserXp
	err := r.db.WithContext(ctx).Find(&users).Error
	return users, err
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

// SaveIdentity upserts the display name and grade a leaderboard should show
// for this user. An empty name never overwrites a known one: the rebuild and
// the award path both call this, and only one of them knows the name.
func (r *xpRepository) SaveIdentity(ctx context.Context, userID, displayName string, grade int32) error {
	if userID == "" {
		return errors.New("user id is required")
	}
	if err := r.db.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(&model.UserXp{
		UserID:      userID,
		TotalXp:     0,
		DisplayName: displayName,
		Grade:       grade,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}).Error; err != nil {
		return err
	}

	updates := map[string]any{"updated_at": time.Now()}
	if displayName != "" {
		updates["display_name"] = displayName
	}
	if grade != 0 {
		updates["grade"] = grade
	}
	if len(updates) == 1 {
		return nil
	}
	return r.db.WithContext(ctx).Model(&model.UserXp{}).
		Where("user_id = ?", userID).Updates(updates).Error
}

// GetIdentities resolves display names for a page of leaderboard members in
// one query, so rendering a board is not one lookup per row.
func (r *xpRepository) GetIdentities(ctx context.Context, userIDs []string) (map[string]model.UserXp, error) {
	out := make(map[string]model.UserXp, len(userIDs))
	if len(userIDs) == 0 {
		return out, nil
	}
	var rows []model.UserXp
	if err := r.db.WithContext(ctx).Where("user_id IN ?", userIDs).Find(&rows).Error; err != nil {
		return nil, err
	}
	for _, row := range rows {
		out[row.UserID] = row
	}
	return out, nil
}

func (r *xpRepository) CourseXp(ctx context.Context, userID, courseID string) (int32, error) {
	if courseID == "" {
		return 0, nil
	}
	var total *int32
	if err := r.db.WithContext(ctx).Model(&model.XpHistory{}).
		Where("user_id = ? AND course_id = ?", userID, courseID).
		Select("COALESCE(SUM(amount), 0)").Scan(&total).Error; err != nil {
		return 0, err
	}
	if total == nil {
		return 0, nil
	}
	return *total, nil
}

func (r *xpRepository) SumSince(ctx context.Context, userID string, since time.Time) (int32, error) {
	var total *int32
	if err := r.db.WithContext(ctx).Model(&model.XpHistory{}).
		Where("user_id = ? AND created_at >= ?", userID, since).
		Select("COALESCE(SUM(amount), 0)").Scan(&total).Error; err != nil {
		return 0, err
	}
	if total == nil {
		return 0, nil
	}
	return *total, nil
}

// AllCourseXp and AllSumsSince feed the boot rebuild: every course board and
// the current week's board, reconstructed from the ledger.
func (r *xpRepository) AllCourseXp(ctx context.Context) ([]CourseXp, error) {
	var rows []CourseXp
	err := r.db.WithContext(ctx).Model(&model.XpHistory{}).
		Select("user_id, course_id, COALESCE(SUM(amount), 0) AS total_xp").
		Where("course_id <> ''").
		Group("user_id, course_id").
		Scan(&rows).Error
	return rows, err
}

func (r *xpRepository) AllSumsSince(ctx context.Context, since time.Time) ([]UserSum, error) {
	var rows []UserSum
	err := r.db.WithContext(ctx).Model(&model.XpHistory{}).
		Select("user_id, COALESCE(SUM(amount), 0) AS total_xp").
		Where("created_at >= ?", since).
		Group("user_id").
		Scan(&rows).Error
	return rows, err
}
