package model

import (
	"time"
)

type UserAchievement struct {
	UserID        string    `gorm:"primaryKey;column:user_id"`
	AchievementID string    `gorm:"primaryKey;column:achievement_id"`
	UnlockedAt    time.Time `gorm:"column:unlocked_at"`
}

func (UserAchievement) TableName() string {
	return "user_achievements"
}

type UserStreak struct {
	UserID        string    `gorm:"primaryKey;column:user_id"`
	CurrentStreak int32     `gorm:"column:current_streak"`
	LongestStreak int32     `gorm:"column:longest_streak"`
	LastLoginDate time.Time `gorm:"column:last_login_date"`
	CreatedAt     time.Time `gorm:"column:created_at"`
	UpdatedAt     time.Time `gorm:"column:updated_at"`
}

func (UserStreak) TableName() string {
	return "user_streaks"
}
