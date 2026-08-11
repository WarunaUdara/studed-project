// Package handler implements the upload-service HTTP API.
package handler

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/studed/shared/go/httpauth"
	"github.com/studed/upload-service/internal/config"
	"github.com/studed/upload-service/internal/storage"
)

// Handler serves the upload API against any storage.Store backend.
type Handler struct {
	store storage.Store
	cfg   *config.Config
	log   *slog.Logger
}

func New(store storage.Store, cfg *config.Config, log *slog.Logger) *Handler {
	return &Handler{store: store, cfg: cfg, log: log}
}

// UploadResponse is the JSON body returned by a successful upload. Key is the
// stable identifier callers should persist; URL is a convenience for rendering.
type UploadResponse struct {
	Key         string `json:"key"`
	URL         string `json:"url"`
	ContentType string `json:"contentType"`
	Size        int64  `json:"size"`
}

// extByType maps each accepted MIME type to the single extension the service
// will assign. Deriving the extension from sniffed content rather than the
// uploaded filename is what makes path traversal and content-type spoofing
// structurally impossible instead of merely filtered.
var extByType = map[string]string{
	"image/jpeg":      ".jpg",
	"image/png":       ".png",
	"image/webp":      ".webp",
	"image/gif":       ".gif",
	"image/avif":      ".avif",
	"image/bmp":       ".bmp",
	"application/pdf": ".pdf",
}

// Register wires the API onto mux. Reads are public because uploaded images are
// embedded in course pages; writes require the shared service token, which the
// api-gateway attaches after authenticating the educator.
func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("POST /v1/uploads", h.requireToken(h.upload))
	mux.HandleFunc("GET /v1/uploads/files/{key...}", h.download)
	mux.HandleFunc("DELETE /v1/uploads/files/{key...}", h.requireToken(h.delete))
}

func (h *Handler) upload(w http.ResponseWriter, r *http.Request) {
	// Cap the whole request body before touching it, so an oversized upload is
	// rejected while streaming instead of after it has been buffered.
	//
	// The cap usually trips partway through a MIME header, which the multipart
	// reader reports as a generic protocol error rather than as a
	// *http.MaxBytesError. Tracking the trip on the reader itself is what lets
	// us answer 413 instead of a misleading 400.
	limited := &limitReader{inner: r.Body, remaining: h.cfg.MaxUploadByte}
	r.Body = limited

	file, header, err := r.FormFile("file")
	if err != nil {
		if limited.tripped {
			h.tooLarge(w)
			return
		}
		writeError(w, http.StatusBadRequest, "missing 'file' form field")
		return
	}
	defer file.Close()

	// Sniff the real type from the leading bytes; the client-supplied
	// Content-Type and filename extension are both attacker-controlled.
	head := make([]byte, 512)
	n, err := io.ReadFull(file, head)
	if err != nil && !errors.Is(err, io.EOF) && !errors.Is(err, io.ErrUnexpectedEOF) {
		writeError(w, http.StatusBadRequest, "could not read file")
		return
	}
	head = head[:n]
	if n == 0 {
		writeError(w, http.StatusBadRequest, "file is empty")
		return
	}

	contentType := normalizeType(http.DetectContentType(head))
	if !h.typeAllowed(contentType) {
		writeError(w, http.StatusUnsupportedMediaType,
			fmt.Sprintf("content type %q is not allowed", contentType))
		return
	}

	key, err := objectKey(contentType)
	if err != nil {
		h.log.Error("failed to generate object key", slog.Any("error", err))
		writeError(w, http.StatusInternalServerError, "could not generate object key")
		return
	}

	// Rewind conceptually by replaying the sniffed prefix ahead of the rest.
	body := io.MultiReader(strings.NewReader(string(head)), file)

	if err := h.store.Put(r.Context(), key, contentType, body); err != nil {
		if limited.tripped {
			// Best effort: drop the partial object so an aborted oversize
			// upload does not leave a truncated image behind.
			if delErr := h.store.Delete(r.Context(), key); delErr != nil && !errors.Is(delErr, storage.ErrNotFound) {
				h.log.Warn("failed to clean up partial object",
					slog.String("key", key), slog.Any("error", delErr))
			}
			h.tooLarge(w)
			return
		}
		h.log.Error("failed to store object",
			slog.String("key", key), slog.String("backend", h.store.Kind()), slog.Any("error", err))
		writeError(w, http.StatusBadGateway, "failed to store file")
		return
	}

	h.log.Info("object stored",
		slog.String("key", key),
		slog.String("contentType", contentType),
		slog.Int64("size", header.Size),
		slog.String("backend", h.store.Kind()))

	writeJSON(w, http.StatusCreated, UploadResponse{
		Key:         key,
		URL:         h.publicURL(key),
		ContentType: contentType,
		Size:        header.Size,
	})
}

func (h *Handler) download(w http.ResponseWriter, r *http.Request) {
	key := r.PathValue("key")

	obj, err := h.store.Get(r.Context(), key)
	if err != nil {
		if errors.Is(err, storage.ErrNotFound) {
			writeError(w, http.StatusNotFound, "file not found")
			return
		}
		h.log.Error("failed to read object", slog.String("key", key), slog.Any("error", err))
		writeError(w, http.StatusBadGateway, "failed to read file")
		return
	}
	defer obj.Body.Close()

	w.Header().Set("Content-Type", obj.ContentType)
	if obj.Size > 0 {
		w.Header().Set("Content-Length", strconv.FormatInt(obj.Size, 10))
	}
	// Keys are content-addressed by random suffix, so an object at a given key
	// never changes and can be cached indefinitely.
	w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	// Stop browsers from re-interpreting a stored image as something else.
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("Content-Security-Policy", "default-src 'none'; sandbox")

	if _, err := io.Copy(w, obj.Body); err != nil {
		h.log.Warn("download interrupted", slog.String("key", key), slog.Any("error", err))
	}
}

func (h *Handler) delete(w http.ResponseWriter, r *http.Request) {
	key := r.PathValue("key")

	if err := h.store.Delete(r.Context(), key); err != nil {
		if errors.Is(err, storage.ErrNotFound) {
			writeError(w, http.StatusNotFound, "file not found")
			return
		}
		h.log.Error("failed to delete object", slog.String("key", key), slog.Any("error", err))
		writeError(w, http.StatusBadGateway, "failed to delete file")
		return
	}

	h.log.Info("object deleted", slog.String("key", key), slog.String("backend", h.store.Kind()))
	w.WriteHeader(http.StatusNoContent)
}

// requireToken guards mutating routes with the shared service token. An unset
// token fails closed: the service refuses writes rather than accepting them
// unauthenticated.
func (h *Handler) requireToken(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if h.cfg.ServiceToken == "" {
			h.log.Error("SERVICE_TOKEN is not set; refusing write request")
			writeError(w, http.StatusServiceUnavailable, "service is not configured for writes")
			return
		}
		if !httpauth.ValidToken(r, h.cfg.ServiceToken) {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		next(w, r)
	}
}

func (h *Handler) typeAllowed(contentType string) bool {
	if _, known := extByType[contentType]; !known {
		return false
	}
	for _, allowed := range h.cfg.AllowedTypes {
		if allowed == contentType {
			return true
		}
	}
	return false
}

// publicURL renders the caller-facing URL for a key. It stays relative unless
// UPLOAD_PUBLIC_BASE_URL is set, so the same response works behind the gateway,
// in the emulator, and in local disk mode.
func (h *Handler) publicURL(key string) string {
	path := "/v1/uploads/files/" + key
	if h.cfg.PublicBaseURL == "" {
		return path
	}
	return h.cfg.PublicBaseURL + path
}

// objectKey builds a date-partitioned, unguessable key. Date partitioning keeps
// bucket listings navigable; the 128 random bits prevent enumeration of other
// users' uploads through the public read route.
func objectKey(contentType string) (string, error) {
	buf := make([]byte, 16)
	if _, err := rand.Read(buf); err != nil {
		return "", fmt.Errorf("read random bytes: %w", err)
	}
	now := time.Now().UTC()
	return fmt.Sprintf("uploads/%04d/%02d/%s%s",
		now.Year(), int(now.Month()), hex.EncodeToString(buf), extByType[contentType]), nil
}

// normalizeType strips parameters such as "; charset=utf-8" that
// http.DetectContentType appends for some types.
func normalizeType(detected string) string {
	if i := strings.IndexByte(detected, ';'); i >= 0 {
		detected = detected[:i]
	}
	return strings.ToLower(strings.TrimSpace(detected))
}

// errBodyTooLarge aborts multipart parsing once the configured cap is hit.
var errBodyTooLarge = errors.New("request body too large")

// limitReader caps how many bytes may be read from the request body and records
// whether the cap was reached, so callers can distinguish "oversize upload"
// from "malformed request" no matter where the truncation surfaces.
type limitReader struct {
	inner     io.ReadCloser
	remaining int64
	tripped   bool
}

func (l *limitReader) Read(p []byte) (int, error) {
	if l.remaining <= 0 {
		l.tripped = true
		return 0, errBodyTooLarge
	}
	if int64(len(p)) > l.remaining {
		p = p[:l.remaining]
	}
	n, err := l.inner.Read(p)
	l.remaining -= int64(n)
	return n, err
}

func (l *limitReader) Close() error { return l.inner.Close() }

func (h *Handler) tooLarge(w http.ResponseWriter) {
	writeError(w, http.StatusRequestEntityTooLarge,
		fmt.Sprintf("file exceeds the %d byte limit", h.cfg.MaxUploadByte))
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
