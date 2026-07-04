package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/studed/course-service/internal/model"
	"gorm.io/gorm"
)

type LessonRepository interface {
	Create(ctx context.Context, lesson *model.Lesson) error
	GetByID(ctx context.Context, id string) (*model.Lesson, error)
	ListByCourse(ctx context.Context, courseID string, publishedOnly bool) ([]*model.Lesson, error)
	Update(ctx context.Context, lesson *model.Lesson) error
	GetCourseID(ctx context.Context, id string) (string, error)
}

type gormLessonRepository struct {
	db *gorm.DB
}

func NewLessonRepository(db *gorm.DB) LessonRepository {
	return &gormLessonRepository{db: db}
}

func (r *gormLessonRepository) Create(ctx context.Context, lesson *model.Lesson) error {
	if err := r.db.WithContext(ctx).Create(lesson).Error; err != nil {
		return fmt.Errorf("failed to create lesson: %w", err)
	}
	return nil
}

func (r *gormLessonRepository) GetByID(ctx context.Context, id string) (*model.Lesson, error) {
	var lesson model.Lesson
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&lesson).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("lesson not found")
		}
		return nil, fmt.Errorf("failed to get lesson: %w", err)
	}
	return &lesson, nil
}

func (r *gormLessonRepository) ListByCourse(ctx context.Context, courseID string, publishedOnly bool) ([]*model.Lesson, error) {
	query := r.db.WithContext(ctx).Where("course_id = ?", courseID)
	if publishedOnly {
		query = query.Where("is_published = ?", true)
	}

	var lessons []*model.Lesson
	if err := query.Order("sequence_order ASC, created_at ASC").Find(&lessons).Error; err != nil {
		return nil, fmt.Errorf("failed to list lessons: %w", err)
	}
	return lessons, nil
}

func (r *gormLessonRepository) Update(ctx context.Context, lesson *model.Lesson) error {
	if err := r.db.WithContext(ctx).Save(lesson).Error; err != nil {
		return fmt.Errorf("failed to update lesson: %w", err)
	}
	return nil
}

func (r *gormLessonRepository) GetCourseID(ctx context.Context, id string) (string, error) {
	var lesson model.Lesson
	if err := r.db.WithContext(ctx).Select("course_id").Where("id = ?", id).First(&lesson).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", fmt.Errorf("lesson not found")
		}
		return "", fmt.Errorf("failed to get lesson: %w", err)
	}
	return lesson.CourseID, nil
}
