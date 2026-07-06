package model

import (
	"time"

	"gorm.io/gorm"
)

type UserXp struct {
	UserID    string `gorm:"primaryKey"`
	TotalXp   int32
	UpdatedAt time.Time
	CreatedAt time.Time
}

func (UserXp) TableName() string {
	return "user_xp"
}

type XpHistory struct {
	ID        string `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID    string `gorm:"index"`
	Amount    int32
	Reason    string
	SourceID  string
	CreatedAt time.Time
}

func (XpHistory) TableName() string {
	return "xp_history"
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(&UserXp{}, &XpHistory{})
}
