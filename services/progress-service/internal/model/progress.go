package model

import (
	"time"

	"gorm.io/gorm"
)

type Enrollment struct {
	ID         string `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID     string `gorm:"index:idx_enrollment_user_course,unique"`
	CourseID   string `gorm:"index:idx_enrollment_user_course,unique"`
	EnrolledAt time.Time
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

func (Enrollment) TableName() string {
	return "enrollments"
}

type WaveAttempt struct {
	ID             string `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID         string `gorm:"index:idx_attempt_user_wave"`
	WaveID         string `gorm:"index:idx_attempt_user_wave"`
	LessonID       string
	CourseID       string
	AnswersJSON    string
	Score          int32
	Passed         bool
	XPAwarded      int32
	AttemptNumber  int32
	CreatedAt      time.Time
}

func (WaveAttempt) TableName() string {
	return "wave_attempts"
}

type ProgressStatus string

const (
	ProgressStatusLocked    ProgressStatus = "LOCKED"
	ProgressStatusAvailable ProgressStatus = "AVAILABLE"
	ProgressStatusStarted   ProgressStatus = "STARTED"
	ProgressStatusCompleted ProgressStatus = "COMPLETED"
)

type WaveProgress struct {
	Status           ProgressStatus
	AttemptsCount    int32
	HighestScore     int32
	CompletedAt      *time.Time
	LastAttemptedAt  *time.Time
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(&Enrollment{}, &WaveAttempt{})
}
