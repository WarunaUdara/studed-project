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

func (h *CourseGRPCHandler) PublishCourse(ctx context.Context, req *coursepb.PublishCourseRequest) (*coursepb.CourseResponse, error) {
	resp, err := h.svc.PublishCourse(ctx, req)
	if err != nil {
		return &coursepb.CourseResponse{Error: err.Error()}, nil
	}
	return resp, nil
}
