package service

import (
	"context"
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
}

type courseService struct {
	repo repository.CourseRepository
}

func NewCourseService(repo repository.CourseRepository) CourseService {
	return &courseService{repo: repo}
}

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

	if err := s.repo.Create(ctx, course); err != nil {
		return nil, fmt.Errorf("failed to create course: %w", err)
	}

	return &coursepb.CourseResponse{Course: course.ToProto()}, nil
}

func (s *courseService) GetCourse(ctx context.Context, req *coursepb.GetCourseRequest) (*coursepb.CourseResponse, error) {
	if req.Id == "" {
		return nil, fmt.Errorf("course id is required")
	}

	course, err := s.repo.GetByID(ctx, req.Id)
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

	courses, err := s.repo.List(ctx, filters)
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

	course, err := s.repo.GetByID(ctx, req.Id)
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

	if err := s.repo.Update(ctx, course); err != nil {
		return nil, fmt.Errorf("failed to publish course: %w", err)
	}

	return &coursepb.CourseResponse{Course: course.ToProto()}, nil
}
