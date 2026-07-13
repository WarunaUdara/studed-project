package model

import (
	"time"
)

type UserStreak struct {
	UserID        string    `gorm:"primaryKey"`
	CurrentStreak int32     `gorm:"not null;default:0"`
	LongestStreak int32     `gorm:"not null;default:0"`
	LastLoginDate time.Time `gorm:"not null"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

func (UserStreak) TableName() string {
	return "user_streaks"
}

type Achievement struct {
	ID          string `gorm:"primaryKey"`
	Name        string `gorm:"not null"`
	Description string `gorm:"not null"`
	IconUrl     string `gorm:"not null"`
	Criteria    string `gorm:"not null"`
}

func (Achievement) TableName() string {
	return "achievements"
}

type UserAchievement struct {
	UserID        string    `gorm:"primaryKey"`
	AchievementID string    `gorm:"primaryKey"`
	UnlockedAt    time.Time `gorm:"not null;default:now()"`
}

func (UserAchievement) TableName() string {
	return "user_achievements"
}
