package handler

import (
	"context"

	"github.com/studed/progress-service/internal/service"
	progresspb "github.com/studed/shared/proto/gen/go/progress"
)

type ProgressGRPCHandler struct {
	progresspb.UnimplementedProgressServiceServer
	svc service.ProgressService
}

func NewProgressGRPCHandler(svc service.ProgressService) *ProgressGRPCHandler {
	return &ProgressGRPCHandler{svc: svc}
}

func (h *ProgressGRPCHandler) EnrollInCourse(ctx context.Context, req *progresspb.EnrollRequest) (*progresspb.EnrollResponse, error) {
	resp, err := h.svc.EnrollInCourse(ctx, req.UserId, req.CourseId)
	if err != nil {
		return &progresspb.EnrollResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *ProgressGRPCHandler) RecordAttempt(ctx context.Context, req *progresspb.RecordAttemptRequest) (*progresspb.RecordAttemptResponse, error) {
	resp, err := h.svc.RecordAttempt(ctx, req.UserId, req.WaveId, req.Answers)
	if err != nil {
		return &progresspb.RecordAttemptResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *ProgressGRPCHandler) GetWaveProgress(ctx context.Context, req *progresspb.GetWaveProgressRequest) (*progresspb.WaveProgressResponse, error) {
	resp, err := h.svc.GetWaveProgress(ctx, req.UserId, req.WaveId)
	if err != nil {
		return &progresspb.WaveProgressResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *ProgressGRPCHandler) GetCourseProgress(ctx context.Context, req *progresspb.GetCourseProgressRequest) (*progresspb.CourseProgressResponse, error) {
	resp, err := h.svc.GetCourseProgress(ctx, req.UserId, req.CourseId)
	if err != nil {
		return &progresspb.CourseProgressResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *ProgressGRPCHandler) IsEnrolled(ctx context.Context, req *progresspb.IsEnrolledRequest) (*progresspb.IsEnrolledResponse, error) {
	return h.svc.IsEnrolled(ctx, req.UserId, req.CourseId)
}

func (h *ProgressGRPCHandler) ListEnrollments(ctx context.Context, req *progresspb.ListEnrollmentsRequest) (*progresspb.ListEnrollmentsResponse, error) {
	resp, err := h.svc.ListEnrollments(ctx, req.UserId)
	if err != nil {
		return &progresspb.ListEnrollmentsResponse{Error: err.Error()}, nil
	}
	return resp, nil
}
