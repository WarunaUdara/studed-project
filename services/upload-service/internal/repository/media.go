package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/studed/upload-service/internal/model"
	"gorm.io/gorm"
)

type MediaRepository interface {
	Create(ctx context.Context, asset *model.MediaAsset) error
	GetByID(ctx context.Context, id string) (*model.MediaAsset, error)
	GetByStorageKey(ctx context.Context, key string) (*model.MediaAsset, error)
	ListByUploader(ctx context.Context, uploaderID, mimeTypePrefix string) ([]*model.MediaAsset, error)
	Update(ctx context.Context, asset *model.MediaAsset) error
	Delete(ctx context.Context, id string) error
}

type gormMediaRepository struct {
	db *gorm.DB
}

func NewMediaRepository(db *gorm.DB) MediaRepository {
	return &gormMediaRepository{db: db}
}

func (r *gormMediaRepository) Create(ctx context.Context, asset *model.MediaAsset) error {
	if err := r.db.WithContext(ctx).Create(asset).Error; err != nil {
		return fmt.Errorf("failed to create media asset: %w", err)
	}
	return nil
}

func (r *gormMediaRepository) GetByID(ctx context.Context, id string) (*model.MediaAsset, error) {
	var asset model.MediaAsset
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&asset).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("media asset not found")
		}
		return nil, fmt.Errorf("failed to get media asset: %w", err)
	}
	return &asset, nil
}

func (r *gormMediaRepository) GetByStorageKey(ctx context.Context, key string) (*model.MediaAsset, error) {
	var asset model.MediaAsset
	if err := r.db.WithContext(ctx).Where("storage_key = ?", key).First(&asset).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("media asset not found")
		}
		return nil, fmt.Errorf("failed to get media asset by key: %w", err)
	}
	return &asset, nil
}

func (r *gormMediaRepository) ListByUploader(ctx context.Context, uploaderID, mimeTypePrefix string) ([]*model.MediaAsset, error) {
	query := r.db.WithContext(ctx)
	if uploaderID != "" {
		query = query.Where("uploader_id = ?", uploaderID)
	}
	if mimeTypePrefix != "" {
		query = query.Where("mime_type LIKE ?", mimeTypePrefix+"%")
	}

	var assets []*model.MediaAsset
	if err := query.Order("created_at desc").Find(&assets).Error; err != nil {
		return nil, fmt.Errorf("failed to list media assets: %w", err)
	}
	return assets, nil
}

func (r *gormMediaRepository) Update(ctx context.Context, asset *model.MediaAsset) error {
	if err := r.db.WithContext(ctx).Save(asset).Error; err != nil {
		return fmt.Errorf("failed to update media asset: %w", err)
	}
	return nil
}

func (r *gormMediaRepository) Delete(ctx context.Context, id string) error {
	if err := r.db.WithContext(ctx).Where("id = ?", id).Delete(&model.MediaAsset{}).Error; err != nil {
		return fmt.Errorf("failed to delete media asset: %w", err)
	}
	return nil
}
