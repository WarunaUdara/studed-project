package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/studed/course-service/internal/model"
	"gorm.io/gorm"
)

type WaveRepository interface {
	Create(ctx context.Context, wave *model.Wave) error
	GetByID(ctx context.Context, id string) (*model.Wave, error)
	ListByLesson(ctx context.Context, lessonID string, publishedOnly bool) ([]*model.Wave, error)
	ListByLessonIDs(ctx context.Context, lessonIDs []string, publishedOnly bool) ([]*model.Wave, error)
	Update(ctx context.Context, wave *model.Wave) error
	GetLessonID(ctx context.Context, id string) (string, error)
}

type gormWaveRepository struct {
	db *gorm.DB
}

func NewWaveRepository(db *gorm.DB) WaveRepository {
	return &gormWaveRepository{db: db}
}

func (r *gormWaveRepository) Create(ctx context.Context, wave *model.Wave) error {
	if err := r.db.WithContext(ctx).Create(wave).Error; err != nil {
		return fmt.Errorf("failed to create wave: %w", err)
	}
	return nil
}

func (r *gormWaveRepository) GetByID(ctx context.Context, id string) (*model.Wave, error) {
	var wave model.Wave
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&wave).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("wave not found")
		}
		return nil, fmt.Errorf("failed to get wave: %w", err)
	}
	return &wave, nil
}

func (r *gormWaveRepository) ListByLesson(ctx context.Context, lessonID string, publishedOnly bool) ([]*model.Wave, error) {
	query := r.db.WithContext(ctx).Where("lesson_id = ?", lessonID)
	if publishedOnly {
		query = query.Where("is_published = ?", true)
	}

	var waves []*model.Wave
	if err := query.Order("sequence_order ASC, created_at ASC").Find(&waves).Error; err != nil {
		return nil, fmt.Errorf("failed to list waves: %w", err)
	}
	return waves, nil
}

func (r *gormWaveRepository) ListByLessonIDs(ctx context.Context, lessonIDs []string, publishedOnly bool) ([]*model.Wave, error) {
	if len(lessonIDs) == 0 {
		return nil, nil
	}

	query := r.db.WithContext(ctx).Where("lesson_id IN ?", lessonIDs)
	if publishedOnly {
		query = query.Where("is_published = ?", true)
	}

	var waves []*model.Wave
	if err := query.Order("sequence_order ASC, created_at ASC").Find(&waves).Error; err != nil {
		return nil, fmt.Errorf("failed to list waves: %w", err)
	}
	return waves, nil
}

func (r *gormWaveRepository) Update(ctx context.Context, wave *model.Wave) error {
	if err := r.db.WithContext(ctx).Save(wave).Error; err != nil {
		return fmt.Errorf("failed to update wave: %w", err)
	}
	return nil
}

func (r *gormWaveRepository) GetLessonID(ctx context.Context, id string) (string, error) {
	var wave model.Wave
	if err := r.db.WithContext(ctx).Select("lesson_id").Where("id = ?", id).First(&wave).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", fmt.Errorf("wave not found")
		}
		return "", fmt.Errorf("failed to get wave: %w", err)
	}
	return wave.LessonID, nil
}
