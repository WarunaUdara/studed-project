package handler

import (
	"context"

	"github.com/studed/upload-service/internal/service"
	uploadpb "github.com/studed/shared/proto/gen/go/upload"
)

type UploadGRPCHandler struct {
	uploadpb.UnimplementedUploadServiceServer
	svc service.UploadService
}

func NewUploadGRPCHandler(svc service.UploadService) *UploadGRPCHandler {
	return &UploadGRPCHandler{svc: svc}
}

func (h *UploadGRPCHandler) CreateUploadSession(ctx context.Context, req *uploadpb.CreateUploadSessionRequest) (*uploadpb.CreateUploadSessionResponse, error) {
	resp, err := h.svc.CreateUploadSession(ctx, req)
	if err != nil {
		return &uploadpb.CreateUploadSessionResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *UploadGRPCHandler) ConfirmUpload(ctx context.Context, req *uploadpb.ConfirmUploadRequest) (*uploadpb.ConfirmUploadResponse, error) {
	resp, err := h.svc.ConfirmUpload(ctx, req)
	if err != nil {
		return &uploadpb.ConfirmUploadResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *UploadGRPCHandler) GetMediaAsset(ctx context.Context, req *uploadpb.GetMediaAssetRequest) (*uploadpb.GetMediaAssetResponse, error) {
	resp, err := h.svc.GetMediaAsset(ctx, req)
	if err != nil {
		return &uploadpb.GetMediaAssetResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *UploadGRPCHandler) ListMediaAssets(ctx context.Context, req *uploadpb.ListMediaAssetsRequest) (*uploadpb.ListMediaAssetsResponse, error) {
	return h.svc.ListMediaAssets(ctx, req)
}

func (h *UploadGRPCHandler) DeleteMediaAsset(ctx context.Context, req *uploadpb.DeleteMediaAssetRequest) (*uploadpb.DeleteMediaAssetResponse, error) {
	return h.svc.DeleteMediaAsset(ctx, req)
}
