package client

import (
	"context"
	"fmt"

	"github.com/studed/api-gateway/graph/model"
	uploadpb "github.com/studed/shared/proto/gen/go/upload"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type UploadClient struct {
	client uploadpb.UploadServiceClient
	conn   *grpc.ClientConn
}

func NewUploadClient(addr string) (*UploadClient, error) {
	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to upload service: %w", err)
	}

	return &UploadClient{
		client: uploadpb.NewUploadServiceClient(conn),
		conn:   conn,
	}, nil
}

func (c *UploadClient) Close() error {
	return c.conn.Close()
}

func (c *UploadClient) GetMediaAsset(ctx context.Context, id string) (*model.MediaAsset, error) {
	resp, err := c.client.GetMediaAsset(ctx, &uploadpb.GetMediaAssetRequest{Id: id})
	if err != nil {
		return nil, fmt.Errorf("get media asset failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("get media asset failed: %s", resp.Error)
	}

	return protoMediaAssetToModel(resp.Asset), nil
}

func (c *UploadClient) ListMediaAssets(ctx context.Context, uploaderID, mimeTypePrefix string) ([]*model.MediaAsset, error) {
	resp, err := c.client.ListMediaAssets(ctx, &uploadpb.ListMediaAssetsRequest{
		UploaderId:     uploaderID,
		MimeTypePrefix: mimeTypePrefix,
	})
	if err != nil {
		return nil, fmt.Errorf("list media assets failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("list media assets failed: %s", resp.Error)
	}

	assets := make([]*model.MediaAsset, len(resp.Assets))
	for i, a := range resp.Assets {
		assets[i] = protoMediaAssetToModel(a)
	}
	return assets, nil
}

func (c *UploadClient) DeleteMediaAsset(ctx context.Context, id string) error {
	resp, err := c.client.DeleteMediaAsset(ctx, &uploadpb.DeleteMediaAssetRequest{Id: id})
	if err != nil {
		return fmt.Errorf("delete media asset failed: %w", err)
	}
	if resp.Error != "" {
		return fmt.Errorf("delete media asset failed: %s", resp.Error)
	}
	return nil
}

func protoMediaAssetToModel(a *uploadpb.MediaAsset) *model.MediaAsset {
	if a == nil {
		return nil
	}
	return &model.MediaAsset{
		ID:         a.Id,
		UploaderID: a.UploaderId,
		Filename:   a.Filename,
		MimeType:   a.MimeType,
		SizeBytes:  int(a.SizeBytes),
		StorageKey: a.StorageKey,
		CdnURL:     &a.CdnUrl,
		Status:     protoMediaAssetStatusToModel(a.Status),
		CreatedAt:  timeFromUnix(a.CreatedAtUnix),
	}
}

func protoMediaAssetStatusToModel(s uploadpb.MediaAssetStatus) model.MediaAssetStatus {
	switch s {
	case uploadpb.MediaAssetStatus_MEDIA_ASSET_STATUS_READY:
		return model.MediaAssetStatusReady
	case uploadpb.MediaAssetStatus_MEDIA_ASSET_STATUS_FAILED:
		return model.MediaAssetStatusFailed
	default:
		return model.MediaAssetStatusPending
	}
}
