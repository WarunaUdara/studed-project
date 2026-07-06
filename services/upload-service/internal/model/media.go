package model

import (
	"time"

	uploadpb "github.com/studed/shared/proto/gen/go/upload"
)

type MediaAssetStatus string

const (
	MediaAssetStatusPending MediaAssetStatus = "PENDING"
	MediaAssetStatusReady   MediaAssetStatus = "READY"
	MediaAssetStatusFailed  MediaAssetStatus = "FAILED"
)

type MediaAsset struct {
	ID         string           `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UploaderID string           `gorm:"not null;index"`
	Filename   string           `gorm:"not null"`
	MimeType   string           `gorm:"not null"`
	SizeBytes  int64            `gorm:"not null;default:0"`
	StorageKey string           `gorm:"uniqueIndex;not null"`
	CdnURL     string
	Status     MediaAssetStatus `gorm:"not null;default:'PENDING'"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

func (MediaAsset) TableName() string {
	return "media_assets"
}

func (a *MediaAsset) ToProto() *uploadpb.MediaAsset {
	return &uploadpb.MediaAsset{
		Id:          a.ID,
		UploaderId:  a.UploaderID,
		Filename:    a.Filename,
		MimeType:    a.MimeType,
		SizeBytes:   a.SizeBytes,
		StorageKey:  a.StorageKey,
		CdnUrl:      a.CdnURL,
		Status:      toProtoStatus(a.Status),
		CreatedAtUnix: a.CreatedAt.Unix(),
	}
}

func toProtoStatus(s MediaAssetStatus) uploadpb.MediaAssetStatus {
	switch s {
	case MediaAssetStatusReady:
		return uploadpb.MediaAssetStatus_MEDIA_ASSET_STATUS_READY
	case MediaAssetStatusFailed:
		return uploadpb.MediaAssetStatus_MEDIA_ASSET_STATUS_FAILED
	default:
		return uploadpb.MediaAssetStatus_MEDIA_ASSET_STATUS_PENDING
	}
}

func FromProtoStatus(s uploadpb.MediaAssetStatus) MediaAssetStatus {
	switch s {
	case uploadpb.MediaAssetStatus_MEDIA_ASSET_STATUS_READY:
		return MediaAssetStatusReady
	case uploadpb.MediaAssetStatus_MEDIA_ASSET_STATUS_FAILED:
		return MediaAssetStatusFailed
	default:
		return MediaAssetStatusPending
	}
}

func AutoMigrate(db interface{ AutoMigrate(...interface{}) error }) error {
	return db.AutoMigrate(&MediaAsset{})
}
