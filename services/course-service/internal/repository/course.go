package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/studed/course-service/internal/model"
	"gorm.io/gorm"
)

type CourseRepository interface {
	Create(ctx context.Context, course *model.Course) error
	GetByID(ctx context.Context, id string) (*model.Course, error)
	List(ctx context.Context, filters ListFilters) ([]*model.Course, error)
	Update(ctx context.Context, course *model.Course) error
}

type ListFilters struct {
	Grade            model.Grade
	PublishedOnly    bool
	EducatorID       string
	FilterByGrade    bool
	FilterByEducator bool
}

type gormCourseRepository struct {
	db *gorm.DB
}

func NewCourseRepository(db *gorm.DB) CourseRepository {
	return &gormCourseRepository{db: db}
}

func (r *gormCourseRepository) Create(ctx context.Context, course *model.Course) error {
	if err := r.db.WithContext(ctx).Create(course).Error; err != nil {
		return fmt.Errorf("failed to create course: %w", err)
	}
	return nil
}

func (r *gormCourseRepository) GetByID(ctx context.Context, id string) (*model.Course, error) {
	var course model.Course
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&course).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("course not found")
		}
		return nil, fmt.Errorf("failed to get course: %w", err)
	}
	return &course, nil
}

func (r *gormCourseRepository) List(ctx context.Context, filters ListFilters) ([]*model.Course, error) {
	query := r.db.WithContext(ctx).Model(&model.Course{})

	if filters.PublishedOnly {
		query = query.Where("status = ?", model.CourseStatusPublished)
	}

	if filters.FilterByGrade && filters.Grade != "" {
		query = query.Where("grade_level = ?", filters.Grade)
	}

	if filters.FilterByEducator {
		query = query.Where("educator_id = ?", filters.EducatorID)
	}

	query = query.Order("created_at DESC")

	var courses []*model.Course
	if err := query.Find(&courses).Error; err != nil {
		return nil, fmt.Errorf("failed to list courses: %w", err)
	}

	return courses, nil
}

func (r *gormCourseRepository) Update(ctx context.Context, course *model.Course) error {
	if err := r.db.WithContext(ctx).Save(course).Error; err != nil {
		return fmt.Errorf("failed to update course: %w", err)
	}
	return nil
}
