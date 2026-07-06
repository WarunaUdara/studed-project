package client

import (
	"context"
	"fmt"

	"github.com/studed/api-gateway/graph/model"
	contentpb "github.com/studed/shared/proto/gen/go/content"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type ContentClient struct {
	client contentpb.ContentServiceClient
	conn   *grpc.ClientConn
}

func NewContentClient(addr string) (*ContentClient, error) {
	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to content service: %w", err)
	}

	return &ContentClient{
		client: contentpb.NewContentServiceClient(conn),
		conn:   conn,
	}, nil
}

func (c *ContentClient) Close() error {
	return c.conn.Close()
}

func (c *ContentClient) CreateContentBlock(ctx context.Context, userID string, input model.CreateContentBlockInput) (*model.ContentBlock, error) {
	resp, err := c.client.CreateContentBlock(ctx, &contentpb.CreateContentBlockRequest{
		WaveId:      input.WaveID,
		Title:       input.Title,
		Type:        modelContentBlockTypeToProto(input.Type),
		PayloadJson: input.PayloadJSON,
		CreatedBy:   userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create content block failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("create content block failed: %s", resp.Error)
	}

	return protoContentBlockToModel(resp.ContentBlock), nil
}

func (c *ContentClient) UpdateContentBlock(ctx context.Context, id string, input model.UpdateContentBlockInput) (*model.ContentBlock, error) {
	req := &contentpb.UpdateContentBlockRequest{Id: id}
	if input.Title != nil {
		req.Title = *input.Title
	}
	if input.PayloadJSON != nil {
		req.PayloadJson = *input.PayloadJSON
	}

	resp, err := c.client.UpdateContentBlock(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("update content block failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("update content block failed: %s", resp.Error)
	}

	return protoContentBlockToModel(resp.ContentBlock), nil
}

func (c *ContentClient) DeleteContentBlock(ctx context.Context, id string) error {
	resp, err := c.client.DeleteContentBlock(ctx, &contentpb.DeleteContentBlockRequest{Id: id})
	if err != nil {
		return fmt.Errorf("delete content block failed: %w", err)
	}
	if resp.Error != "" {
		return fmt.Errorf("delete content block failed: %s", resp.Error)
	}
	return nil
}

func (c *ContentClient) PublishContentBlock(ctx context.Context, id string) (*model.ContentBlock, error) {
	resp, err := c.client.PublishContentVersion(ctx, &contentpb.PublishContentVersionRequest{
		ContentBlockId: id,
	})
	if err != nil {
		return nil, fmt.Errorf("publish content block failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("publish content block failed: %s", resp.Error)
	}

	return protoContentBlockToModel(resp.ContentBlock), nil
}

func (c *ContentClient) GetContentBlock(ctx context.Context, id string) (*model.ContentBlock, error) {
	resp, err := c.client.GetContentBlock(ctx, &contentpb.GetContentBlockRequest{Id: id})
	if err != nil {
		return nil, fmt.Errorf("get content block failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("get content block failed: %s", resp.Error)
	}

	return protoContentBlockToModel(resp.ContentBlock), nil
}

func (c *ContentClient) ListContentBlocks(ctx context.Context, waveID *string, blockType *model.ContentBlockType) ([]*model.ContentBlock, error) {
	req := &contentpb.ListContentBlocksRequest{}
	if waveID != nil {
		req.WaveId = *waveID
	}
	if blockType != nil {
		req.Type = modelContentBlockTypeToProto(*blockType)
	}

	resp, err := c.client.ListContentBlocks(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("list content blocks failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("list content blocks failed: %s", resp.Error)
	}

	blocks := make([]*model.ContentBlock, len(resp.ContentBlocks))
	for i, b := range resp.ContentBlocks {
		blocks[i] = protoContentBlockToModel(b)
	}
	return blocks, nil
}

func (c *ContentClient) GetContentVersionHistory(ctx context.Context, contentBlockID string) ([]*model.ContentVersion, error) {
	resp, err := c.client.GetContentVersionHistory(ctx, &contentpb.GetContentVersionHistoryRequest{
		ContentBlockId: contentBlockID,
	})
	if err != nil {
		return nil, fmt.Errorf("get content version history failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("get content version history failed: %s", resp.Error)
	}

	versions := make([]*model.ContentVersion, len(resp.Versions))
	for i, v := range resp.Versions {
		versions[i] = protoContentVersionToModel(v)
	}
	return versions, nil
}

func protoContentBlockToModel(b *contentpb.ContentBlock) *model.ContentBlock {
	if b == nil {
		return nil
	}
	return &model.ContentBlock{
		ID:        b.Id,
		WaveID:    b.WaveId,
		Title:     b.Title,
		Type:      protoContentBlockTypeToModel(b.Type),
		PayloadJSON: b.PayloadJson,
		Version:   int(b.Version),
		Status:    protoContentBlockStatusToModel(b.Status),
		CreatedBy: b.CreatedBy,
		CreatedAt: timeFromUnix(b.CreatedAtUnix),
		UpdatedAt: timeFromUnix(b.UpdatedAtUnix),
	}
}

func protoContentVersionToModel(v *contentpb.ContentVersion) *model.ContentVersion {
	if v == nil {
		return nil
	}
	return &model.ContentVersion{
		ID:             v.Id,
		ContentBlockID: v.ContentBlockId,
		VersionNumber:  int(v.VersionNumber),
		PayloadJSON:    v.PayloadJson,
		CreatedAt:      timeFromUnix(v.CreatedAtUnix),
	}
}

func modelContentBlockTypeToProto(t model.ContentBlockType) contentpb.ContentBlockType {
	switch t {
	case model.ContentBlockTypeEvaluate:
		return contentpb.ContentBlockType_CONTENT_BLOCK_TYPE_EVALUATE
	default:
		return contentpb.ContentBlockType_CONTENT_BLOCK_TYPE_LEARN
	}
}

func protoContentBlockTypeToModel(t contentpb.ContentBlockType) model.ContentBlockType {
	switch t {
	case contentpb.ContentBlockType_CONTENT_BLOCK_TYPE_EVALUATE:
		return model.ContentBlockTypeEvaluate
	default:
		return model.ContentBlockTypeLearn
	}
}

func protoContentBlockStatusToModel(s contentpb.ContentBlockStatus) model.ContentBlockStatus {
	switch s {
	case contentpb.ContentBlockStatus_CONTENT_BLOCK_STATUS_PUBLISHED:
		return model.ContentBlockStatusPublished
	default:
		return model.ContentBlockStatusDraft
	}
}
