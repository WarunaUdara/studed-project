package handler

import (
	"context"

	"github.com/studed/course-service/internal/service"
	coursepb "github.com/studed/shared/proto/gen/go/course"
)

type CourseGRPCHandler struct {
	coursepb.UnimplementedCourseServiceServer
	svc service.CourseService
}

func NewCourseGRPCHandler(svc service.CourseService) *CourseGRPCHandler {
	return &CourseGRPCHandler{svc: svc}
}

func (h *CourseGRPCHandler) CreateCourse(ctx context.Context, req *coursepb.CreateCourseRequest) (*coursepb.CourseResponse, error) {
	resp, err := h.svc.CreateCourse(ctx, req)
	if err != nil {
		return &coursepb.CourseResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *CourseGRPCHandler) GetCourse(ctx context.Context, req *coursepb.GetCourseRequest) (*coursepb.CourseResponse, error) {
	resp, err := h.svc.GetCourse(ctx, req)
	if err != nil {
		return &coursepb.CourseResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *CourseGRPCHandler) ListCourses(ctx context.Context, req *coursepb.ListCoursesRequest) (*coursepb.CourseListResponse, error) {
	return h.svc.ListCourses(ctx, req)
}

func (h *CourseGRPCHandler) UpdateCourse(ctx context.Context, req *coursepb.UpdateCourseRequest) (*coursepb.CourseResponse, error) {
	resp, err := h.svc.UpdateCourse(ctx, req)
	if err != nil {
		return &coursepb.CourseResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *CourseGRPCHandler) PublishCourse(ctx context.Context, req *coursepb.PublishCourseRequest) (*coursepb.CourseResponse, error) {
	resp, err := h.svc.PublishCourse(ctx, req)
	if err != nil {
		return &coursepb.CourseResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *CourseGRPCHandler) CreateLesson(ctx context.Context, req *coursepb.CreateLessonRequest) (*coursepb.LessonResponse, error) {
	resp, err := h.svc.CreateLesson(ctx, req)
	if err != nil {
		return &coursepb.LessonResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *CourseGRPCHandler) GetLesson(ctx context.Context, req *coursepb.GetLessonRequest) (*coursepb.LessonResponse, error) {
	resp, err := h.svc.GetLesson(ctx, req)
	if err != nil {
		return &coursepb.LessonResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *CourseGRPCHandler) ListLessons(ctx context.Context, req *coursepb.ListLessonsRequest) (*coursepb.LessonListResponse, error) {
	return h.svc.ListLessons(ctx, req)
}

func (h *CourseGRPCHandler) PublishLesson(ctx context.Context, req *coursepb.PublishLessonRequest) (*coursepb.LessonResponse, error) {
	resp, err := h.svc.PublishLesson(ctx, req)
	if err != nil {
		return &coursepb.LessonResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *CourseGRPCHandler) CreateWave(ctx context.Context, req *coursepb.CreateWaveRequest) (*coursepb.WaveResponse, error) {
	resp, err := h.svc.CreateWave(ctx, req)
	if err != nil {
		return &coursepb.WaveResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *CourseGRPCHandler) GetWave(ctx context.Context, req *coursepb.GetWaveRequest) (*coursepb.WaveResponse, error) {
	resp, err := h.svc.GetWave(ctx, req)
	if err != nil {
		return &coursepb.WaveResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *CourseGRPCHandler) ListWaves(ctx context.Context, req *coursepb.ListWavesRequest) (*coursepb.WaveListResponse, error) {
	return h.svc.ListWaves(ctx, req)
}

func (h *CourseGRPCHandler) UpdateWave(ctx context.Context, req *coursepb.UpdateWaveRequest) (*coursepb.WaveResponse, error) {
	resp, err := h.svc.UpdateWave(ctx, req)
	if err != nil {
		return &coursepb.WaveResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *CourseGRPCHandler) PublishWave(ctx context.Context, req *coursepb.PublishWaveRequest) (*coursepb.WaveResponse, error) {
	resp, err := h.svc.PublishWave(ctx, req)
	if err != nil {
		return &coursepb.WaveResponse{Error: err.Error()}, nil
	}
	return resp, nil
}
