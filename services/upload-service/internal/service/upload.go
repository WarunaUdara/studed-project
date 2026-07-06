package service

import (
	"context"
	"fmt"
	"io"

	"github.com/studed/upload-service/internal/model"
	"github.com/studed/upload-service/internal/repository"
	"github.com/studed/upload-service/internal/storage"
	uploadpb "github.com/studed/shared/proto/gen/go/upload"
)

type UploadService interface {
	CreateUploadSession(ctx context.Context, req *uploadpb.CreateUploadSessionRequest) (*uploadpb.CreateUploadSessionResponse, error)
	ConfirmUpload(ctx context.Context, req *uploadpb.ConfirmUploadRequest) (*uploadpb.ConfirmUploadResponse, error)
	GetMediaAsset(ctx context.Context, req *uploadpb.GetMediaAssetRequest) (*uploadpb.GetMediaAssetResponse, error)
	ListMediaAssets(ctx context.Context, req *uploadpb.ListMediaAssetsRequest) (*uploadpb.ListMediaAssetsResponse, error)
	DeleteMediaAsset(ctx context.Context, req *uploadpb.DeleteMediaAssetRequest) (*uploadpb.DeleteMediaAssetResponse, error)

	// DirectUpload is used by the REST handler to store a file and create a ready asset in one step.
	DirectUpload(ctx context.Context, uploaderID string, filename string, mimeType string, data []byte) (*model.MediaAsset, error)
}

type uploadService struct {
	repo     repository.MediaRepository
	provider storage.Provider
}

func NewUploadService(repo repository.MediaRepository, provider storage.Provider) UploadService {
	return &uploadService{repo: repo, provider: provider}
}

func (s *uploadService) CreateUploadSession(ctx context.Context, req *uploadpb.CreateUploadSessionRequest) (*uploadpb.CreateUploadSessionResponse, error) {
	if req.UploaderId == "" || req.Filename == "" {
		return nil, fmt.Errorf("uploader id and filename are required")
	}

	storageKey := storage.SafeFilename(req.Filename)
	asset := &model.MediaAsset{
		UploaderID: req.UploaderId,
		Filename:   req.Filename,
		MimeType:   req.MimeType,
		SizeBytes:  req.SizeBytes,
		StorageKey: storageKey,
		CdnURL:     s.provider.URL(storageKey),
		Status:     model.MediaAssetStatusPending,
	}

	if err := s.repo.Create(ctx, asset); err != nil {
		return nil, fmt.Errorf("failed to create upload session: %w", err)
	}

	return &uploadpb.CreateUploadSessionResponse{
		SessionId: asset.ID,
		UploadUrl: "/api/v1/uploads?session_id=" + asset.ID,
		StorageKey: storageKey,
	}, nil
}

func (s *uploadService) ConfirmUpload(ctx context.Context, req *uploadpb.ConfirmUploadRequest) (*uploadpb.ConfirmUploadResponse, error) {
	if req.SessionId == "" {
		return nil, fmt.Errorf("session id is required")
	}

	asset, err := s.repo.GetByID(ctx, req.SessionId)
	if err != nil {
		return nil, err
	}

	asset.Status = model.MediaAssetStatusReady
	if req.SizeBytes > 0 {
		asset.SizeBytes = req.SizeBytes
	}

	if err := s.repo.Update(ctx, asset); err != nil {
		return nil, fmt.Errorf("failed to confirm upload: %w", err)
	}

	return &uploadpb.ConfirmUploadResponse{Asset: asset.ToProto()}, nil
}

func (s *uploadService) GetMediaAsset(ctx context.Context, req *uploadpb.GetMediaAssetRequest) (*uploadpb.GetMediaAssetResponse, error) {
	if req.Id == "" {
		return nil, fmt.Errorf("media asset id is required")
	}

	asset, err := s.repo.GetByID(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	return &uploadpb.GetMediaAssetResponse{Asset: asset.ToProto()}, nil
}

func (s *uploadService) ListMediaAssets(ctx context.Context, req *uploadpb.ListMediaAssetsRequest) (*uploadpb.ListMediaAssetsResponse, error) {
	assets, err := s.repo.ListByUploader(ctx, req.UploaderId, req.MimeTypePrefix)
	if err != nil {
		return nil, err
	}

	protoAssets := make([]*uploadpb.MediaAsset, len(assets))
	for i, a := range assets {
		protoAssets[i] = a.ToProto()
	}

	return &uploadpb.ListMediaAssetsResponse{Assets: protoAssets}, nil
}

func (s *uploadService) DeleteMediaAsset(ctx context.Context, req *uploadpb.DeleteMediaAssetRequest) (*uploadpb.DeleteMediaAssetResponse, error) {
	if req.Id == "" {
		return nil, fmt.Errorf("media asset id is required")
	}

	asset, err := s.repo.GetByID(ctx, req.Id)
	if err != nil {
		return &uploadpb.DeleteMediaAssetResponse{Success: false, Error: err.Error()}, nil
	}

	if err := s.provider.Delete(asset.StorageKey); err != nil {
		return &uploadpb.DeleteMediaAssetResponse{Success: false, Error: err.Error()}, nil
	}

	if err := s.repo.Delete(ctx, req.Id); err != nil {
		return &uploadpb.DeleteMediaAssetResponse{Success: false, Error: err.Error()}, nil
	}

	return &uploadpb.DeleteMediaAssetResponse{Success: true}, nil
}

func (s *uploadService) DirectUpload(ctx context.Context, uploaderID string, filename string, mimeType string, data []byte) (*model.MediaAsset, error) {
	if uploaderID == "" {
		return nil, fmt.Errorf("uploader id is required")
	}
	if filename == "" {
		return nil, fmt.Errorf("filename is required")
	}

	if mimeType == "" {
		mimeType = storage.ContentType(filename, "application/octet-stream")
	}

	storageKey := storage.SafeFilename(filename)
	if err := s.provider.Store(storageKey, bytesReader(data), int64(len(data))); err != nil {
		return nil, fmt.Errorf("failed to store file: %w", err)
	}

	asset := &model.MediaAsset{
		UploaderID: uploaderID,
		Filename:   filename,
		MimeType:   mimeType,
		SizeBytes:  int64(len(data)),
		StorageKey: storageKey,
		CdnURL:     s.provider.URL(storageKey),
		Status:     model.MediaAssetStatusReady,
	}

	if err := s.repo.Create(ctx, asset); err != nil {
		return nil, fmt.Errorf("failed to save media asset: %w", err)
	}

	return asset, nil
}

func bytesReader(data []byte) *bytesReaderWrapper {
	return &bytesReaderWrapper{data: data, offset: 0}
}

type bytesReaderWrapper struct {
	data   []byte
	offset int
}

func (r *bytesReaderWrapper) Read(p []byte) (int, error) {
	if r.offset >= len(r.data) {
		return 0, io.EOF
	}
	n := copy(p, r.data[r.offset:])
	r.offset += n
	return n, nil
}
