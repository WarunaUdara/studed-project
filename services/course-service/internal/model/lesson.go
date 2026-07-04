package model

import (
	"time"

	coursepb "github.com/studed/shared/proto/gen/go/course"
)

type Lesson struct {
	ID            string `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	CourseID      string `gorm:"not null;index"`
	Title         string `gorm:"not null"`
	SequenceOrder int32  `gorm:"not null"`
	IsPublished   bool   `gorm:"not null;default:false"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

func (Lesson) TableName() string {
	return "lessons"
}

func (l *Lesson) ToProto() *coursepb.Lesson {
	return &coursepb.Lesson{
		Id:            l.ID,
		CourseId:      l.CourseID,
		Title:         l.Title,
		SequenceOrder: l.SequenceOrder,
		IsPublished:   l.IsPublished,
		CreatedAtUnix: l.CreatedAt.Unix(),
		UpdatedAtUnix: l.UpdatedAt.Unix(),
	}
}
