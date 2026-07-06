package handler

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/studed/upload-service/internal/repository"
	"github.com/studed/upload-service/internal/service"
	"github.com/studed/upload-service/internal/storage"
)

const userIDHeader = "X-Studed-User-Id"

func NewHTTPHandler(svc service.UploadService, repo repository.MediaRepository, provider storage.Provider) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/uploads", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		handleUpload(w, r, svc)
	})
	mux.HandleFunc("/uploads/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		handleServeFile(w, r, repo, provider)
	})
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("upload-service ok"))
	})
	return mux
}

func handleUpload(w http.ResponseWriter, r *http.Request, svc service.UploadService) {
	uploaderID := r.Header.Get(userIDHeader)
	if uploaderID == "" {
		http.Error(w, `{"error": "missing user context"}`, http.StatusUnauthorized)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, `{"error": "invalid file"}`, http.StatusBadRequest)
		return
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		http.Error(w, `{"error": "failed to read file"}`, http.StatusInternalServerError)
		return
	}

	asset, err := svc.DirectUpload(r.Context(), uploaderID, header.Filename, header.Header.Get("Content-Type"), data)
	if err != nil {
		slog.Error("direct upload failed", slog.Any("error", err))
		http.Error(w, `{"error": "`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(asset.ToProto())
}

func handleServeFile(w http.ResponseWriter, r *http.Request, repo repository.MediaRepository, provider storage.Provider) {
	key := r.URL.Path[len("/uploads/"):]
	if key == "" {
		http.NotFound(w, r)
		return
	}

	asset, err := repo.GetByStorageKey(r.Context(), key)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	reader, err := provider.Open(asset.StorageKey)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer reader.Close()

	w.Header().Set("Content-Type", asset.MimeType)
	w.Header().Set("Content-Length", strconv.FormatInt(asset.SizeBytes, 10))
	_, _ = io.Copy(w, reader)
}
