package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/studed/course-service/internal/model"
	"github.com/studed/course-service/internal/repository"
	coursepb "github.com/studed/shared/proto/gen/go/course"
)

type CourseService interface {
	CreateCourse(ctx context.Context, req *coursepb.CreateCourseRequest) (*coursepb.CourseResponse, error)
	GetCourse(ctx context.Context, req *coursepb.GetCourseRequest) (*coursepb.CourseResponse, error)
	ListCourses(ctx context.Context, req *coursepb.ListCoursesRequest) (*coursepb.CourseListResponse, error)
	PublishCourse(ctx context.Context, req *coursepb.PublishCourseRequest) (*coursepb.CourseResponse, error)

	CreateLesson(ctx context.Context, req *coursepb.CreateLessonRequest) (*coursepb.LessonResponse, error)
	GetLesson(ctx context.Context, req *coursepb.GetLessonRequest) (*coursepb.LessonResponse, error)
	ListLessons(ctx context.Context, req *coursepb.ListLessonsRequest) (*coursepb.LessonListResponse, error)
	PublishLesson(ctx context.Context, req *coursepb.PublishLessonRequest) (*coursepb.LessonResponse, error)

	CreateWave(ctx context.Context, req *coursepb.CreateWaveRequest) (*coursepb.WaveResponse, error)
	GetWave(ctx context.Context, req *coursepb.GetWaveRequest) (*coursepb.WaveResponse, error)
	ListWaves(ctx context.Context, req *coursepb.ListWavesRequest) (*coursepb.WaveListResponse, error)
	UpdateWave(ctx context.Context, req *coursepb.UpdateWaveRequest) (*coursepb.WaveResponse, error)
	PublishWave(ctx context.Context, req *coursepb.PublishWaveRequest) (*coursepb.WaveResponse, error)
}

type courseService struct {
	courseRepo  repository.CourseRepository
	lessonRepo  repository.LessonRepository
	waveRepo    repository.WaveRepository
}

func NewCourseService(courseRepo repository.CourseRepository, lessonRepo repository.LessonRepository, waveRepo repository.WaveRepository) CourseService {
	return &courseService{
		courseRepo:  courseRepo,
		lessonRepo:  lessonRepo,
		waveRepo:    waveRepo,
	}
}

// --- Course methods ---

func (s *courseService) CreateCourse(ctx context.Context, req *coursepb.CreateCourseRequest) (*coursepb.CourseResponse, error) {
	title := strings.TrimSpace(req.Title)
	description := strings.TrimSpace(req.Description)
	slug := strings.TrimSpace(req.Slug)

	if title == "" || slug == "" {
		return nil, fmt.Errorf("title and slug are required")
	}

	price := req.Price
	var pricePtr *float64
	if price != 0 {
		p := price
		pricePtr = &p
	}

	course := &model.Course{
		Title:       title,
		Description: description,
		Slug:        slug,
		GradeLevel:  model.FromAuthProtoGrade(req.GradeLevel),
		EducatorID:  req.EducatorId,
		Price:       pricePtr,
		Status:      model.CourseStatusDraft,
	}

	if err := s.courseRepo.Create(ctx, course); err != nil {
		return nil, fmt.Errorf("failed to create course: %w", err)
	}

	return &coursepb.CourseResponse{Course: course.ToProto()}, nil
}

func (s *courseService) GetCourse(ctx context.Context, req *coursepb.GetCourseRequest) (*coursepb.CourseResponse, error) {
	if req.Id == "" {
		return nil, fmt.Errorf("course id is required")
	}

	course, err := s.courseRepo.GetByID(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	return &coursepb.CourseResponse{Course: course.ToProto()}, nil
}

func (s *courseService) ListCourses(ctx context.Context, req *coursepb.ListCoursesRequest) (*coursepb.CourseListResponse, error) {
	filters := repository.ListFilters{
		PublishedOnly: req.PublishedOnly,
	}

	if req.GradeLevel != 0 {
		filters.FilterByGrade = true
		filters.Grade = model.FromAuthProtoGrade(req.GradeLevel)
	}

	if req.EducatorId != "" {
		filters.FilterByEducator = true
		filters.EducatorID = req.EducatorId
	}

	courses, err := s.courseRepo.List(ctx, filters)
	if err != nil {
		return nil, err
	}

	protoCourses := make([]*coursepb.Course, len(courses))
	for i, c := range courses {
		protoCourses[i] = c.ToProto()
	}

	return &coursepb.CourseListResponse{Courses: protoCourses}, nil
}

func (s *courseService) PublishCourse(ctx context.Context, req *coursepb.PublishCourseRequest) (*coursepb.CourseResponse, error) {
	if req.Id == "" {
		return nil, fmt.Errorf("course id is required")
	}
	if req.EducatorId == "" {
		return nil, fmt.Errorf("educator id is required")
	}

	course, err := s.courseRepo.GetByID(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	if course.EducatorID != req.EducatorId {
		return nil, fmt.Errorf("unauthorized to publish this course")
	}

	if course.Status == model.CourseStatusPublished {
		return &coursepb.CourseResponse{Course: course.ToProto()}, nil
	}

	now := time.Now()
	course.Status = model.CourseStatusPublished
	course.PublishedAt = &now

	if err := s.courseRepo.Update(ctx, course); err != nil {
		return nil, fmt.Errorf("failed to publish course: %w", err)
	}

	return &coursepb.CourseResponse{Course: course.ToProto()}, nil
}

// --- Lesson methods ---

func (s *courseService) CreateLesson(ctx context.Context, req *coursepb.CreateLessonRequest) (*coursepb.LessonResponse, error) {
	title := strings.TrimSpace(req.Title)
	if title == "" {
		return nil, fmt.Errorf("title is required")
	}
	if req.CourseId == "" {
		return nil, fmt.Errorf("course id is required")
	}
	if req.EducatorId == "" {
		return nil, fmt.Errorf("educator id is required")
	}

	course, err := s.courseRepo.GetByID(ctx, req.CourseId)
	if err != nil {
		return nil, err
	}
	if course.EducatorID != req.EducatorId {
		return nil, fmt.Errorf("unauthorized to create lesson in this course")
	}

	lesson := &model.Lesson{
		CourseID:      req.CourseId,
		Title:         title,
		SequenceOrder: req.SequenceOrder,
		IsPublished:   false,
	}

	if err := s.lessonRepo.Create(ctx, lesson); err != nil {
		return nil, fmt.Errorf("failed to create lesson: %w", err)
	}

	return &coursepb.LessonResponse{Lesson: lesson.ToProto()}, nil
}

func (s *courseService) GetLesson(ctx context.Context, req *coursepb.GetLessonRequest) (*coursepb.LessonResponse, error) {
	if req.Id == "" {
		return nil, fmt.Errorf("lesson id is required")
	}

	lesson, err := s.lessonRepo.GetByID(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	return &coursepb.LessonResponse{Lesson: lesson.ToProto()}, nil
}

func (s *courseService) ListLessons(ctx context.Context, req *coursepb.ListLessonsRequest) (*coursepb.LessonListResponse, error) {
	if req.CourseId == "" {
		return nil, fmt.Errorf("course id is required")
	}

	lessons, err := s.lessonRepo.ListByCourse(ctx, req.CourseId, req.PublishedOnly)
	if err != nil {
		return nil, err
	}

	protoLessons := make([]*coursepb.Lesson, len(lessons))
	for i, l := range lessons {
		protoLessons[i] = l.ToProto()
	}

	return &coursepb.LessonListResponse{Lessons: protoLessons}, nil
}

func (s *courseService) PublishLesson(ctx context.Context, req *coursepb.PublishLessonRequest) (*coursepb.LessonResponse, error) {
	if req.Id == "" {
		return nil, fmt.Errorf("lesson id is required")
	}
	if req.EducatorId == "" {
		return nil, fmt.Errorf("educator id is required")
	}

	lesson, err := s.lessonRepo.GetByID(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	course, err := s.courseRepo.GetByID(ctx, lesson.CourseID)
	if err != nil {
		return nil, err
	}
	if course.EducatorID != req.EducatorId {
		return nil, fmt.Errorf("unauthorized to publish this lesson")
	}

	if lesson.IsPublished {
		return &coursepb.LessonResponse{Lesson: lesson.ToProto()}, nil
	}

	lesson.IsPublished = true
	if err := s.lessonRepo.Update(ctx, lesson); err != nil {
		return nil, fmt.Errorf("failed to publish lesson: %w", err)
	}

	return &coursepb.LessonResponse{Lesson: lesson.ToProto()}, nil
}

// --- Wave methods ---

func parseJSONBlocks(jsonStr string) json.RawMessage {
	if jsonStr == "" {
		return json.RawMessage("[]")
	}
	var raw []json.RawMessage
	if err := json.Unmarshal([]byte(jsonStr), &raw); err != nil {
		return json.RawMessage("[]")
	}
	return json.RawMessage(jsonStr)
}

func (s *courseService) CreateWave(ctx context.Context, req *coursepb.CreateWaveRequest) (*coursepb.WaveResponse, error) {
	title := strings.TrimSpace(req.Title)
	if title == "" {
		return nil, fmt.Errorf("title is required")
	}
	if req.LessonId == "" {
		return nil, fmt.Errorf("lesson id is required")
	}
	if req.EducatorId == "" {
		return nil, fmt.Errorf("educator id is required")
	}

	lesson, err := s.lessonRepo.GetByID(ctx, req.LessonId)
	if err != nil {
		return nil, err
	}

	course, err := s.courseRepo.GetByID(ctx, lesson.CourseID)
	if err != nil {
		return nil, err
	}
	if course.EducatorID != req.EducatorId {
		return nil, fmt.Errorf("unauthorized to create wave in this lesson")
	}

	wave := &model.Wave{
		LessonID:          req.LessonId,
		Title:             title,
		SequenceOrder:     req.SequenceOrder,
		XPReward:          req.XpReward,
		MaxReattempts:     req.MaxReattempts,
		PassingThreshold:  req.PassingThreshold,
		EstimatedDuration: req.EstimatedDuration,
		Difficulty:        model.FromProtoDifficulty(req.Difficulty),
		LearnBlocks:       parseJSONBlocks(req.LearnBlocksJson),
		EvaluateBlocks:    parseJSONBlocks(req.EvaluateBlocksJson),
		IsPublished:       false,
	}

	if err := s.waveRepo.Create(ctx, wave); err != nil {
		return nil, fmt.Errorf("failed to create wave: %w", err)
	}

	return &coursepb.WaveResponse{Wave: wave.ToProto()}, nil
}

func (s *courseService) GetWave(ctx context.Context, req *coursepb.GetWaveRequest) (*coursepb.WaveResponse, error) {
	if req.Id == "" {
		return nil, fmt.Errorf("wave id is required")
	}

	wave, err := s.waveRepo.GetByID(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	return &coursepb.WaveResponse{Wave: wave.ToProto()}, nil
}

func (s *courseService) ListWaves(ctx context.Context, req *coursepb.ListWavesRequest) (*coursepb.WaveListResponse, error) {
	if req.LessonId == "" {
		return nil, fmt.Errorf("lesson id is required")
	}

	waves, err := s.waveRepo.ListByLesson(ctx, req.LessonId, req.PublishedOnly)
	if err != nil {
		return nil, err
	}

	protoWaves := make([]*coursepb.Wave, len(waves))
	for i, w := range waves {
		protoWaves[i] = w.ToProto()
	}

	return &coursepb.WaveListResponse{Waves: protoWaves}, nil
}

func (s *courseService) UpdateWave(ctx context.Context, req *coursepb.UpdateWaveRequest) (*coursepb.WaveResponse, error) {
	if req.Id == "" {
		return nil, fmt.Errorf("wave id is required")
	}
	if req.EducatorId == "" {
		return nil, fmt.Errorf("educator id is required")
	}

	wave, err := s.waveRepo.GetByID(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	lesson, err := s.lessonRepo.GetByID(ctx, wave.LessonID)
	if err != nil {
		return nil, err
	}

	course, err := s.courseRepo.GetByID(ctx, lesson.CourseID)
	if err != nil {
		return nil, err
	}
	if course.EducatorID != req.EducatorId {
		return nil, fmt.Errorf("unauthorized to update this wave")
	}

	if title := strings.TrimSpace(req.Title); title != "" {
		wave.Title = title
	}
	if req.SequenceOrder != 0 {
		wave.SequenceOrder = req.SequenceOrder
	}
	if req.XpReward != 0 {
		wave.XPReward = req.XpReward
	}
	if req.MaxReattempts != 0 {
		wave.MaxReattempts = req.MaxReattempts
	}
	if req.PassingThreshold != 0 {
		wave.PassingThreshold = req.PassingThreshold
	}
	if req.EstimatedDuration != 0 {
		wave.EstimatedDuration = req.EstimatedDuration
	}
	if req.Difficulty != coursepb.Difficulty_DIFFICULTY_UNSPECIFIED {
		wave.Difficulty = model.FromProtoDifficulty(req.Difficulty)
	}
	if req.LearnBlocksJson != "" {
		wave.LearnBlocks = parseJSONBlocks(req.LearnBlocksJson)
	}
	if req.EvaluateBlocksJson != "" {
		wave.EvaluateBlocks = parseJSONBlocks(req.EvaluateBlocksJson)
	}

	if err := s.waveRepo.Update(ctx, wave); err != nil {
		return nil, fmt.Errorf("failed to update wave: %w", err)
	}

	return &coursepb.WaveResponse{Wave: wave.ToProto()}, nil
}

func (s *courseService) PublishWave(ctx context.Context, req *coursepb.PublishWaveRequest) (*coursepb.WaveResponse, error) {
	if req.Id == "" {
		return nil, fmt.Errorf("wave id is required")
	}
	if req.EducatorId == "" {
		return nil, fmt.Errorf("educator id is required")
	}

	wave, err := s.waveRepo.GetByID(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	lesson, err := s.lessonRepo.GetByID(ctx, wave.LessonID)
	if err != nil {
		return nil, err
	}

	course, err := s.courseRepo.GetByID(ctx, lesson.CourseID)
	if err != nil {
		return nil, err
	}
	if course.EducatorID != req.EducatorId {
		return nil, fmt.Errorf("unauthorized to publish this wave")
	}

	if wave.IsPublished {
		return &coursepb.WaveResponse{Wave: wave.ToProto()}, nil
	}

	wave.IsPublished = true
	if err := s.waveRepo.Update(ctx, wave); err != nil {
		return nil, fmt.Errorf("failed to publish wave: %w", err)
	}

	return &coursepb.WaveResponse{Wave: wave.ToProto()}, nil
}
