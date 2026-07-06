package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/studed/content-service/internal/model"
	"github.com/studed/content-service/internal/repository"
	contentpb "github.com/studed/shared/proto/gen/go/content"
)

type ContentService interface {
	CreateContentBlock(ctx context.Context, req *contentpb.CreateContentBlockRequest) (*contentpb.ContentBlockResponse, error)
	GetContentBlock(ctx context.Context, req *contentpb.GetContentBlockRequest) (*contentpb.ContentBlockResponse, error)
	UpdateContentBlock(ctx context.Context, req *contentpb.UpdateContentBlockRequest) (*contentpb.ContentBlockResponse, error)
	DeleteContentBlock(ctx context.Context, req *contentpb.DeleteContentBlockRequest) (*contentpb.DeleteContentBlockResponse, error)
	ListContentBlocks(ctx context.Context, req *contentpb.ListContentBlocksRequest) (*contentpb.ContentBlockListResponse, error)
	PublishContentVersion(ctx context.Context, req *contentpb.PublishContentVersionRequest) (*contentpb.PublishContentVersionResponse, error)
	GetContentVersionHistory(ctx context.Context, req *contentpb.GetContentVersionHistoryRequest) (*contentpb.ContentVersionListResponse, error)
}

type contentService struct {
	repo repository.ContentRepository
}

func NewContentService(repo repository.ContentRepository) ContentService {
	return &contentService{repo: repo}
}

func (s *contentService) CreateContentBlock(ctx context.Context, req *contentpb.CreateContentBlockRequest) (*contentpb.ContentBlockResponse, error) {
	waveID := strings.TrimSpace(req.WaveId)
	title := strings.TrimSpace(req.Title)
	if waveID == "" || title == "" {
		return nil, fmt.Errorf("wave id and title are required")
	}

	blockType := model.FromProtoType(req.Type)
	payload := normalizePayload(req.PayloadJson)

	if err := validatePayload(blockType, payload); err != nil {
		return nil, fmt.Errorf("invalid payload: %w", err)
	}

	block := &model.ContentBlock{
		WaveID:    waveID,
		Title:     title,
		Type:      blockType,
		Payload:   payload,
		Version:   1,
		Status:    model.ContentBlockStatusDraft,
		CreatedBy: req.CreatedBy,
	}

	if err := s.repo.CreateBlock(ctx, block); err != nil {
		return nil, fmt.Errorf("failed to create block: %w", err)
	}

	if err := s.repo.CreateVersion(ctx, &model.ContentVersion{
		ContentBlockID: block.ID,
		VersionNumber:  block.Version,
		Payload:        repository.SnapshotPayload(block.Payload),
	}); err != nil {
		return nil, fmt.Errorf("failed to create initial version: %w", err)
	}

	return &contentpb.ContentBlockResponse{ContentBlock: block.ToProto()}, nil
}

func (s *contentService) GetContentBlock(ctx context.Context, req *contentpb.GetContentBlockRequest) (*contentpb.ContentBlockResponse, error) {
	if req.Id == "" {
		return nil, fmt.Errorf("content block id is required")
	}

	block, err := s.repo.GetBlock(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	return &contentpb.ContentBlockResponse{ContentBlock: block.ToProto()}, nil
}

func (s *contentService) UpdateContentBlock(ctx context.Context, req *contentpb.UpdateContentBlockRequest) (*contentpb.ContentBlockResponse, error) {
	if req.Id == "" {
		return nil, fmt.Errorf("content block id is required")
	}

	block, err := s.repo.GetBlock(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	if title := strings.TrimSpace(req.Title); title != "" {
		block.Title = title
	}
	if req.PayloadJson != "" {
		payload := normalizePayload(req.PayloadJson)
		if err := validatePayload(block.Type, payload); err != nil {
			return nil, fmt.Errorf("invalid payload: %w", err)
		}
		block.Payload = payload
	}

	block.Version++

	if err := s.repo.UpdateBlock(ctx, block); err != nil {
		return nil, fmt.Errorf("failed to update block: %w", err)
	}

	if err := s.repo.CreateVersion(ctx, &model.ContentVersion{
		ContentBlockID: block.ID,
		VersionNumber:  block.Version,
		Payload:        repository.SnapshotPayload(block.Payload),
	}); err != nil {
		return nil, fmt.Errorf("failed to create version: %w", err)
	}

	return &contentpb.ContentBlockResponse{ContentBlock: block.ToProto()}, nil
}

func (s *contentService) DeleteContentBlock(ctx context.Context, req *contentpb.DeleteContentBlockRequest) (*contentpb.DeleteContentBlockResponse, error) {
	if req.Id == "" {
		return nil, fmt.Errorf("content block id is required")
	}

	if _, err := s.repo.GetBlock(ctx, req.Id); err != nil {
		return &contentpb.DeleteContentBlockResponse{Success: false, Error: err.Error()}, nil
	}

	if err := s.repo.DeleteBlock(ctx, req.Id); err != nil {
		return &contentpb.DeleteContentBlockResponse{Success: false, Error: err.Error()}, nil
	}

	return &contentpb.DeleteContentBlockResponse{Success: true}, nil
}

func (s *contentService) ListContentBlocks(ctx context.Context, req *contentpb.ListContentBlocksRequest) (*contentpb.ContentBlockListResponse, error) {
	var blockType model.ContentBlockType
	if req.Type != contentpb.ContentBlockType_CONTENT_BLOCK_TYPE_UNSPECIFIED {
		blockType = model.FromProtoType(req.Type)
	}

	blocks, err := s.repo.ListBlocks(ctx, req.WaveId, blockType)
	if err != nil {
		return nil, err
	}

	protoBlocks := make([]*contentpb.ContentBlock, len(blocks))
	for i, b := range blocks {
		protoBlocks[i] = b.ToProto()
	}

	return &contentpb.ContentBlockListResponse{ContentBlocks: protoBlocks}, nil
}

func (s *contentService) PublishContentVersion(ctx context.Context, req *contentpb.PublishContentVersionRequest) (*contentpb.PublishContentVersionResponse, error) {
	if req.ContentBlockId == "" {
		return nil, fmt.Errorf("content block id is required")
	}

	block, err := s.repo.GetBlock(ctx, req.ContentBlockId)
	if err != nil {
		return nil, err
	}

	block.Status = model.ContentBlockStatusPublished
	if err := s.repo.UpdateBlock(ctx, block); err != nil {
		return nil, fmt.Errorf("failed to publish block: %w", err)
	}

	return &contentpb.PublishContentVersionResponse{ContentBlock: block.ToProto()}, nil
}

func (s *contentService) GetContentVersionHistory(ctx context.Context, req *contentpb.GetContentVersionHistoryRequest) (*contentpb.ContentVersionListResponse, error) {
	if req.ContentBlockId == "" {
		return nil, fmt.Errorf("content block id is required")
	}

	versions, err := s.repo.ListVersions(ctx, req.ContentBlockId)
	if err != nil {
		return nil, err
	}

	protoVersions := make([]*contentpb.ContentVersion, len(versions))
	for i, v := range versions {
		protoVersions[i] = v.ToProto()
	}

	return &contentpb.ContentVersionListResponse{Versions: protoVersions}, nil
}

func normalizePayload(payload string) json.RawMessage {
	payload = strings.TrimSpace(payload)
	if payload == "" {
		return json.RawMessage("{}")
	}
	return json.RawMessage(payload)
}

func validatePayload(blockType model.ContentBlockType, payload json.RawMessage) error {
	var data map[string]interface{}
	if err := json.Unmarshal(payload, &data); err != nil {
		return fmt.Errorf("payload must be valid json: %w", err)
	}

	switch blockType {
	case model.ContentBlockTypeLearn:
		if _, ok := data["type"].(string); !ok {
			return fmt.Errorf("learn payload must include a 'type' field")
		}
	case model.ContentBlockTypeEvaluate:
		if _, ok := data["question"].(string); !ok {
			return fmt.Errorf("evaluate payload must include a 'question' field")
		}
	}

	return nil
}
