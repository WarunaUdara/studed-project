package model

import (
	"encoding/json"
	"time"

	contentpb "github.com/studed/shared/proto/gen/go/content"
)

type ContentBlockType string

const (
	ContentBlockTypeLearn     ContentBlockType = "LEARN"
	ContentBlockTypeEvaluate  ContentBlockType = "EVALUATE"
)

type ContentBlockStatus string

const (
	ContentBlockStatusDraft     ContentBlockStatus = "DRAFT"
	ContentBlockStatusPublished ContentBlockStatus = "PUBLISHED"
)

type ContentBlock struct {
	ID        string           `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	WaveID    string           `gorm:"not null;index"`
	Title     string           `gorm:"not null"`
	Type      ContentBlockType `gorm:"not null"`
	Payload   json.RawMessage  `gorm:"type:jsonb;not null;default:'{}'"`
	Version   int32            `gorm:"not null;default:1"`
	Status    ContentBlockStatus `gorm:"not null;default:'DRAFT'"`
	CreatedBy string           `gorm:"not null;index"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (ContentBlock) TableName() string {
	return "content_blocks"
}

func (b *ContentBlock) ToProto() *contentpb.ContentBlock {
	payload := string(b.Payload)
	if payload == "" {
		payload = "{}"
	}

	return &contentpb.ContentBlock{
		Id:          b.ID,
		WaveId:      b.WaveID,
		Title:       b.Title,
		Type:        toProtoType(b.Type),
		PayloadJson: payload,
		Version:     b.Version,
		Status:      toProtoStatus(b.Status),
		CreatedBy:   b.CreatedBy,
		CreatedAtUnix: b.CreatedAt.Unix(),
		UpdatedAtUnix: b.UpdatedAt.Unix(),
	}
}

func toProtoType(t ContentBlockType) contentpb.ContentBlockType {
	switch t {
	case ContentBlockTypeEvaluate:
		return contentpb.ContentBlockType_CONTENT_BLOCK_TYPE_EVALUATE
	default:
		return contentpb.ContentBlockType_CONTENT_BLOCK_TYPE_LEARN
	}
}

func FromProtoType(t contentpb.ContentBlockType) ContentBlockType {
	switch t {
	case contentpb.ContentBlockType_CONTENT_BLOCK_TYPE_EVALUATE:
		return ContentBlockTypeEvaluate
	default:
		return ContentBlockTypeLearn
	}
}

func toProtoStatus(s ContentBlockStatus) contentpb.ContentBlockStatus {
	switch s {
	case ContentBlockStatusPublished:
		return contentpb.ContentBlockStatus_CONTENT_BLOCK_STATUS_PUBLISHED
	default:
		return contentpb.ContentBlockStatus_CONTENT_BLOCK_STATUS_DRAFT
	}
}

func FromProtoStatus(s contentpb.ContentBlockStatus) ContentBlockStatus {
	switch s {
	case contentpb.ContentBlockStatus_CONTENT_BLOCK_STATUS_PUBLISHED:
		return ContentBlockStatusPublished
	default:
		return ContentBlockStatusDraft
	}
}

type ContentVersion struct {
	ID             string          `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	ContentBlockID string          `gorm:"not null;index"`
	VersionNumber  int32           `gorm:"not null"`
	Payload        json.RawMessage `gorm:"type:jsonb;not null"`
	CreatedAt      time.Time
}

func (ContentVersion) TableName() string {
	return "content_versions"
}

func (v *ContentVersion) ToProto() *contentpb.ContentVersion {
	return &contentpb.ContentVersion{
		Id:             v.ID,
		ContentBlockId: v.ContentBlockID,
		VersionNumber:  v.VersionNumber,
		PayloadJson:    string(v.Payload),
		CreatedAtUnix:  v.CreatedAt.Unix(),
	}
}

func AutoMigrate(db interface{ AutoMigrate(...interface{}) error }) error {
	return db.AutoMigrate(&ContentBlock{}, &ContentVersion{})
}
