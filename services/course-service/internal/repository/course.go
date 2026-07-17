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
	ListByIDs(ctx context.Context, ids []string) ([]*model.Course, error)
	Update(ctx context.Context, course *model.Course) error
}

type ListFilters struct {
	Grade            model.Grade
	PublishedOnly    bool
	EducatorID       string
	SearchQuery      string
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

	if filters.SearchQuery != "" {
		pattern := "%" + filters.SearchQuery + "%"
		query = query.Where("title ILIKE ? OR description ILIKE ?", pattern, pattern)
	}

	query = query.Order("created_at DESC")

	var courses []*model.Course
	if err := query.Find(&courses).Error; err != nil {
		return nil, fmt.Errorf("failed to list courses: %w", err)
	}

	return courses, nil
}

// ListByIDs fetches courses for the given IDs and returns them in the same
// order as the input, preserving search-relevance ranking.
func (r *gormCourseRepository) ListByIDs(ctx context.Context, ids []string) ([]*model.Course, error) {
	if len(ids) == 0 {
		return []*model.Course{}, nil
	}

	var courses []*model.Course
	if err := r.db.WithContext(ctx).Where("id IN ?", ids).Find(&courses).Error; err != nil {
		return nil, fmt.Errorf("failed to list courses by ids: %w", err)
	}

	byID := make(map[string]*model.Course, len(courses))
	for _, c := range courses {
		byID[c.ID] = c
	}

	ordered := make([]*model.Course, 0, len(courses))
	for _, id := range ids {
		if c, ok := byID[id]; ok {
			ordered = append(ordered, c)
		}
	}
	return ordered, nil
}

func (r *gormCourseRepository) Update(ctx context.Context, course *model.Course) error {
	if err := r.db.WithContext(ctx).Save(course).Error; err != nil {
		return fmt.Errorf("failed to update course: %w", err)
	}
	return nil
}
