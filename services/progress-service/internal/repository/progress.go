package repository

import (
	"context"

	"github.com/studed/progress-service/internal/model"
	"gorm.io/gorm"
)

type ProgressRepository interface {
	CreateEnrollment(ctx context.Context, enrollment *model.Enrollment) error
	GetEnrollment(ctx context.Context, userID, courseID string) (*model.Enrollment, error)
	ListEnrollmentsByUser(ctx context.Context, userID string) ([]model.Enrollment, error)
	CreateAttempt(ctx context.Context, attempt *model.WaveAttempt) error
	GetAttemptsByWave(ctx context.Context, userID, waveID string) ([]model.WaveAttempt, error)
	CountPassedWavesInCourse(ctx context.Context, userID, courseID string) (int64, error)
	CountPassedWavesInLesson(ctx context.Context, userID, lessonID string) (int64, error)
	CountPassedWavesGroupedByLesson(ctx context.Context, userID, courseID string) (map[string]int64, error)
}

type progressRepository struct {
	db *gorm.DB
}

func NewProgressRepository(db *gorm.DB) ProgressRepository {
	return &progressRepository{db: db}
}

func (r *progressRepository) CreateEnrollment(ctx context.Context, enrollment *model.Enrollment) error {
	return r.db.WithContext(ctx).Create(enrollment).Error
}

func (r *progressRepository) GetEnrollment(ctx context.Context, userID, courseID string) (*model.Enrollment, error) {
	var enrollment model.Enrollment
	if err := r.db.WithContext(ctx).Where("user_id = ? AND course_id = ?", userID, courseID).First(&enrollment).Error; err != nil {
		return nil, err
	}
	return &enrollment, nil
}

func (r *progressRepository) ListEnrollmentsByUser(ctx context.Context, userID string) ([]model.Enrollment, error) {
	var enrollments []model.Enrollment
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("enrolled_at desc").Find(&enrollments).Error; err != nil {
		return nil, err
	}
	return enrollments, nil
}

func (r *progressRepository) CreateAttempt(ctx context.Context, attempt *model.WaveAttempt) error {
	return r.db.WithContext(ctx).Create(attempt).Error
}

func (r *progressRepository) GetAttemptsByWave(ctx context.Context, userID, waveID string) ([]model.WaveAttempt, error) {
	var attempts []model.WaveAttempt
	if err := r.db.WithContext(ctx).Where("user_id = ? AND wave_id = ?", userID, waveID).Order("created_at asc").Find(&attempts).Error; err != nil {
		return nil, err
	}
	return attempts, nil
}

func (r *progressRepository) CountPassedWavesInCourse(ctx context.Context, userID, courseID string) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&model.WaveAttempt{}).
		Where("user_id = ? AND course_id = ? AND passed = ?", userID, courseID, true).
		Distinct("wave_id").
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *progressRepository) CountPassedWavesInLesson(ctx context.Context, userID, lessonID string) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&model.WaveAttempt{}).
		Where("user_id = ? AND lesson_id = ? AND passed = ?", userID, lessonID, true).
		Distinct("wave_id").
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

// CountPassedWavesGroupedByLesson returns, in a single query, the number of
// distinct passed waves per lesson for every lesson in courseID — replacing
// what would otherwise be one CountPassedWavesInLesson call per lesson.
func (r *progressRepository) CountPassedWavesGroupedByLesson(ctx context.Context, userID, courseID string) (map[string]int64, error) {
	var rows []struct {
		LessonID string
		Count    int64
	}
	if err := r.db.WithContext(ctx).Model(&model.WaveAttempt{}).
		Select("lesson_id, COUNT(DISTINCT wave_id) as count").
		Where("user_id = ? AND course_id = ? AND passed = ?", userID, courseID, true).
		Group("lesson_id").
		Scan(&rows).Error; err != nil {
		return nil, err
	}

	counts := make(map[string]int64, len(rows))
	for _, row := range rows {
		counts[row.LessonID] = row.Count
	}
	return counts, nil
}
