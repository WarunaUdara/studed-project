package model

import "time"

type NotificationType string

const (
	NotificationTypeSystem      NotificationType = "SYSTEM"
	NotificationTypeAchievement NotificationType = "ACHIEVEMENT"
	NotificationTypeCourse      NotificationType = "COURSE"
	NotificationTypeStreak      NotificationType = "STREAK"
)

type Notification struct {
	ID        string           `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID    string           `gorm:"not null;index" json:"user_id"`
	Type      NotificationType `gorm:"not null;default:'SYSTEM'" json:"type"`
	Title     string           `gorm:"not null" json:"title"`
	Body      string           `json:"body"`
	IsRead    bool             `gorm:"not null;default:false" json:"is_read"`
	CreatedAt time.Time        `gorm:"autoCreateTime" json:"created_at"`
}

func (Notification) TableName() string {
	return "notifications"
}
