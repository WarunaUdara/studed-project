package model

import (
	"time"

	"gorm.io/gorm"
)

type UserXp struct {
	UserID  string `gorm:"primaryKey"`
	TotalXp int32
	// DisplayName and Grade are held here, not only in Redis, so a Redis flush
	// cannot erase who a ranked student is. See docs/PROGRESSION-SYSTEM.md.
	DisplayName string
	Grade       int32
	UpdatedAt   time.Time
	CreatedAt   time.Time
}

func (UserXp) TableName() string {
	return "user_xp"
}

type XpHistory struct {
	ID       string `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID   string `gorm:"index"`
	Amount   int32
	Reason   string
	SourceID string
	// CourseID attributes an award to a course so the course leaderboard can
	// rank by XP earned in that course rather than by the global total.
	CourseID  string
	CreatedAt time.Time
}

func (XpHistory) TableName() string {
	return "xp_history"
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(&UserXp{}, &XpHistory{}, &UserStreak{}, &UserAchievement{})
}
