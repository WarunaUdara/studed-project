package handler

import (
	"context"

	"github.com/studed/content-service/internal/service"
	contentpb "github.com/studed/shared/proto/gen/go/content"
)

type ContentGRPCHandler struct {
	contentpb.UnimplementedContentServiceServer
	svc service.ContentService
}

func NewContentGRPCHandler(svc service.ContentService) *ContentGRPCHandler {
	return &ContentGRPCHandler{svc: svc}
}

func (h *ContentGRPCHandler) CreateContentBlock(ctx context.Context, req *contentpb.CreateContentBlockRequest) (*contentpb.ContentBlockResponse, error) {
	resp, err := h.svc.CreateContentBlock(ctx, req)
	if err != nil {
		return &contentpb.ContentBlockResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *ContentGRPCHandler) GetContentBlock(ctx context.Context, req *contentpb.GetContentBlockRequest) (*contentpb.ContentBlockResponse, error) {
	resp, err := h.svc.GetContentBlock(ctx, req)
	if err != nil {
		return &contentpb.ContentBlockResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *ContentGRPCHandler) UpdateContentBlock(ctx context.Context, req *contentpb.UpdateContentBlockRequest) (*contentpb.ContentBlockResponse, error) {
	resp, err := h.svc.UpdateContentBlock(ctx, req)
	if err != nil {
		return &contentpb.ContentBlockResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *ContentGRPCHandler) DeleteContentBlock(ctx context.Context, req *contentpb.DeleteContentBlockRequest) (*contentpb.DeleteContentBlockResponse, error) {
	return h.svc.DeleteContentBlock(ctx, req)
}

func (h *ContentGRPCHandler) ListContentBlocks(ctx context.Context, req *contentpb.ListContentBlocksRequest) (*contentpb.ContentBlockListResponse, error) {
	return h.svc.ListContentBlocks(ctx, req)
}

func (h *ContentGRPCHandler) PublishContentVersion(ctx context.Context, req *contentpb.PublishContentVersionRequest) (*contentpb.PublishContentVersionResponse, error) {
	resp, err := h.svc.PublishContentVersion(ctx, req)
	if err != nil {
		return &contentpb.PublishContentVersionResponse{Error: err.Error()}, nil
	}
	return resp, nil
}

func (h *ContentGRPCHandler) GetContentVersionHistory(ctx context.Context, req *contentpb.GetContentVersionHistoryRequest) (*contentpb.ContentVersionListResponse, error) {
	return h.svc.GetContentVersionHistory(ctx, req)
}
