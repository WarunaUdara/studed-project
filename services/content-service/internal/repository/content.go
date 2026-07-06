package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/studed/content-service/internal/model"
	"gorm.io/gorm"
)

type ContentRepository interface {
	CreateBlock(ctx context.Context, block *model.ContentBlock) error
	GetBlock(ctx context.Context, id string) (*model.ContentBlock, error)
	UpdateBlock(ctx context.Context, block *model.ContentBlock) error
	DeleteBlock(ctx context.Context, id string) error
	ListBlocks(ctx context.Context, waveID string, blockType model.ContentBlockType) ([]*model.ContentBlock, error)

	CreateVersion(ctx context.Context, version *model.ContentVersion) error
	ListVersions(ctx context.Context, contentBlockID string) ([]*model.ContentVersion, error)
}

type gormContentRepository struct {
	db *gorm.DB
}

func NewContentRepository(db *gorm.DB) ContentRepository {
	return &gormContentRepository{db: db}
}

func (r *gormContentRepository) CreateBlock(ctx context.Context, block *model.ContentBlock) error {
	if err := r.db.WithContext(ctx).Create(block).Error; err != nil {
		return fmt.Errorf("failed to create content block: %w", err)
	}
	return nil
}

func (r *gormContentRepository) GetBlock(ctx context.Context, id string) (*model.ContentBlock, error) {
	var block model.ContentBlock
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&block).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("content block not found")
		}
		return nil, fmt.Errorf("failed to get content block: %w", err)
	}
	return &block, nil
}

func (r *gormContentRepository) UpdateBlock(ctx context.Context, block *model.ContentBlock) error {
	if err := r.db.WithContext(ctx).Save(block).Error; err != nil {
		return fmt.Errorf("failed to update content block: %w", err)
	}
	return nil
}

func (r *gormContentRepository) DeleteBlock(ctx context.Context, id string) error {
	if err := r.db.WithContext(ctx).Where("id = ?", id).Delete(&model.ContentBlock{}).Error; err != nil {
		return fmt.Errorf("failed to delete content block: %w", err)
	}
	if err := r.db.WithContext(ctx).Where("content_block_id = ?", id).Delete(&model.ContentVersion{}).Error; err != nil {
		return fmt.Errorf("failed to delete content versions: %w", err)
	}
	return nil
}

func (r *gormContentRepository) ListBlocks(ctx context.Context, waveID string, blockType model.ContentBlockType) ([]*model.ContentBlock, error) {
	query := r.db.WithContext(ctx)
	if waveID != "" {
		query = query.Where("wave_id = ?", waveID)
	}
	if blockType != "" {
		query = query.Where("type = ?", blockType)
	}

	var blocks []*model.ContentBlock
	if err := query.Order("created_at asc").Find(&blocks).Error; err != nil {
		return nil, fmt.Errorf("failed to list content blocks: %w", err)
	}
	return blocks, nil
}

func (r *gormContentRepository) CreateVersion(ctx context.Context, version *model.ContentVersion) error {
	if err := r.db.WithContext(ctx).Create(version).Error; err != nil {
		return fmt.Errorf("failed to create content version: %w", err)
	}
	return nil
}

func (r *gormContentRepository) ListVersions(ctx context.Context, contentBlockID string) ([]*model.ContentVersion, error) {
	var versions []*model.ContentVersion
	if err := r.db.WithContext(ctx).Where("content_block_id = ?", contentBlockID).Order("version_number desc").Find(&versions).Error; err != nil {
		return nil, fmt.Errorf("failed to list content versions: %w", err)
	}
	return versions, nil
}

func SnapshotPayload(payload json.RawMessage) json.RawMessage {
	if len(payload) == 0 {
		return json.RawMessage("{}")
	}
	copyBytes := make([]byte, len(payload))
	copy(copyBytes, payload)
	return json.RawMessage(copyBytes)
}
