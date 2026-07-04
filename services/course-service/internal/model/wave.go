package model

import (
	"encoding/json"
	"time"

	coursepb "github.com/studed/shared/proto/gen/go/course"
)

type Wave struct {
	ID                string          `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	LessonID          string          `gorm:"not null;index"`
	Title             string          `gorm:"not null"`
	SequenceOrder     int32           `gorm:"not null"`
	XPReward          int32           `gorm:"not null;default:0"`
	MaxReattempts     int32           `gorm:"not null;default:3"`
	PassingThreshold  int32           `gorm:"not null;default:50"`
	EstimatedDuration int32           `gorm:"not null;default:0"`
	Difficulty        string          `gorm:"not null;default:'MEDIUM'"`
	LearnBlocks       json.RawMessage `gorm:"type:jsonb;default:'[]'"`
	EvaluateBlocks    json.RawMessage `gorm:"type:jsonb;default:'[]'"`
	IsPublished       bool            `gorm:"not null;default:false"`
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

func (Wave) TableName() string {
	return "waves"
}

func (w *Wave) ToProto() *coursepb.Wave {
	wave := &coursepb.Wave{
		Id:                w.ID,
		LessonId:          w.LessonID,
		Title:             w.Title,
		SequenceOrder:     w.SequenceOrder,
		XpReward:          w.XPReward,
		MaxReattempts:     w.MaxReattempts,
		PassingThreshold:  w.PassingThreshold,
		EstimatedDuration: w.EstimatedDuration,
		IsPublished:       w.IsPublished,
		CreatedAtUnix:     w.CreatedAt.Unix(),
		UpdatedAtUnix:     w.UpdatedAt.Unix(),
	}

	if w.LearnBlocks != nil {
		wave.LearnBlocksJson = string(w.LearnBlocks)
	} else {
		wave.LearnBlocksJson = "[]"
	}
	if w.EvaluateBlocks != nil {
		wave.EvaluateBlocksJson = string(w.EvaluateBlocks)
	} else {
		wave.EvaluateBlocksJson = "[]"
	}

	wave.Difficulty = ToProtoDifficulty(w.Difficulty)

	return wave
}

func ToProtoDifficulty(difficulty string) coursepb.Difficulty {
	switch difficulty {
	case "EASY":
		return coursepb.Difficulty_DIFFICULTY_EASY
	case "HARD":
		return coursepb.Difficulty_DIFFICULTY_HARD
	default:
		return coursepb.Difficulty_DIFFICULTY_MEDIUM
	}
}

func FromProtoDifficulty(difficulty coursepb.Difficulty) string {
	switch difficulty {
	case coursepb.Difficulty_DIFFICULTY_EASY:
		return "EASY"
	case coursepb.Difficulty_DIFFICULTY_HARD:
		return "HARD"
	default:
		return "MEDIUM"
	}
}
