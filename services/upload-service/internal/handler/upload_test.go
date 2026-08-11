package handler

import (
	"bytes"
	"encoding/json"
	"io"
	"log/slog"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/studed/upload-service/internal/config"
	"github.com/studed/upload-service/internal/storage"
)

const testToken = "test-service-token"

// pngBytes is a minimal valid PNG: the 8-byte signature is what
// http.DetectContentType keys on, so this is enough to exercise sniffing.
var pngBytes = append([]byte{0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A}, bytes.Repeat([]byte{0x00}, 64)...)

func newTestHandler(t *testing.T) (*Handler, *http.ServeMux) {
	t.Helper()

	store, err := storage.NewDisk(t.TempDir())
	if err != nil {
		t.Fatalf("create disk store: %v", err)
	}

	cfg := &config.Config{
		ServiceToken:  testToken,
		MaxUploadByte: 1 << 20,
		AllowedTypes:  []string{"image/png", "image/jpeg"},
	}

	h := New(store, cfg, slog.New(slog.DiscardHandler))
	mux := http.NewServeMux()
	h.Register(mux)
	return h, mux
}

func multipartBody(t *testing.T, field, filename string, content []byte) (io.Reader, string) {
	t.Helper()
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	fw, err := w.CreateFormFile(field, filename)
	if err != nil {
		t.Fatalf("create form file: %v", err)
	}
	if _, err := fw.Write(content); err != nil {
		t.Fatalf("write form file: %v", err)
	}
	if err := w.Close(); err != nil {
		t.Fatalf("close writer: %v", err)
	}
	return &buf, w.FormDataContentType()
}

func uploadRequest(t *testing.T, mux *http.ServeMux, filename string, content []byte, token string) *httptest.ResponseRecorder {
	t.Helper()
	body, contentType := multipartBody(t, "file", filename, content)
	req := httptest.NewRequest(http.MethodPost, "/v1/uploads", body)
	req.Header.Set("Content-Type", contentType)
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)
	return rec
}

func TestUploadStoresFileAndReturnsKey(t *testing.T) {
	_, mux := newTestHandler(t)

	rec := uploadRequest(t, mux, "photo.png", pngBytes, testToken)
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rec.Code, rec.Body.String())
	}

	var resp UploadResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.ContentType != "image/png" {
		t.Errorf("expected content type image/png, got %q", resp.ContentType)
	}
	if !strings.HasSuffix(resp.Key, ".png") {
		t.Errorf("expected key to end in .png, got %q", resp.Key)
	}

	// The stored object must be readable back through the download route with
	// the exact bytes that were uploaded.
	req := httptest.NewRequest(http.MethodGet, "/v1/uploads/files/"+resp.Key, nil)
	getRec := httptest.NewRecorder()
	mux.ServeHTTP(getRec, req)

	if getRec.Code != http.StatusOK {
		t.Fatalf("expected 200 on download, got %d", getRec.Code)
	}
	if !bytes.Equal(getRec.Body.Bytes(), pngBytes) {
		t.Error("downloaded bytes differ from uploaded bytes")
	}
}

func TestUploadRejectsMissingToken(t *testing.T) {
	_, mux := newTestHandler(t)

	rec := uploadRequest(t, mux, "photo.png", pngBytes, "")
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 without a token, got %d", rec.Code)
	}
}

func TestUploadRejectsWrongToken(t *testing.T) {
	_, mux := newTestHandler(t)

	rec := uploadRequest(t, mux, "photo.png", pngBytes, "not-the-token")
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 with a bad token, got %d", rec.Code)
	}
}

// Writes must fail closed when the service token was never configured, rather
// than silently accepting anonymous uploads.
func TestUploadRefusesWritesWhenTokenUnset(t *testing.T) {
	store, err := storage.NewDisk(t.TempDir())
	if err != nil {
		t.Fatalf("create disk store: %v", err)
	}
	cfg := &config.Config{MaxUploadByte: 1 << 20, AllowedTypes: []string{"image/png"}}
	mux := http.NewServeMux()
	New(store, cfg, slog.New(slog.DiscardHandler)).Register(mux)

	rec := uploadRequest(t, mux, "photo.png", pngBytes, "anything")
	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503 when SERVICE_TOKEN is unset, got %d", rec.Code)
	}
}

// A .png extension on non-image content must not get through: the decision is
// made on sniffed bytes, not the filename.
func TestUploadRejectsDisguisedContent(t *testing.T) {
	_, mux := newTestHandler(t)

	script := []byte("#!/bin/sh\necho compromised\n")
	rec := uploadRequest(t, mux, "totally-an-image.png", script, testToken)
	if rec.Code != http.StatusUnsupportedMediaType {
		t.Fatalf("expected 415 for disguised content, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestUploadRejectsTypeOutsideAllowlist(t *testing.T) {
	_, mux := newTestHandler(t)

	gif := append([]byte("GIF87a"), bytes.Repeat([]byte{0x00}, 32)...)
	rec := uploadRequest(t, mux, "anim.gif", gif, testToken)
	if rec.Code != http.StatusUnsupportedMediaType {
		t.Fatalf("expected 415 for a type outside the allowlist, got %d", rec.Code)
	}
}

func TestUploadRejectsOversizeFile(t *testing.T) {
	store, err := storage.NewDisk(t.TempDir())
	if err != nil {
		t.Fatalf("create disk store: %v", err)
	}
	cfg := &config.Config{
		ServiceToken:  testToken,
		MaxUploadByte: 128, // smaller than the payload below
		AllowedTypes:  []string{"image/png"},
	}
	mux := http.NewServeMux()
	New(store, cfg, slog.New(slog.DiscardHandler)).Register(mux)

	big := append([]byte{0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A}, bytes.Repeat([]byte{0x00}, 4096)...)
	rec := uploadRequest(t, mux, "big.png", big, testToken)
	if rec.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("expected 413 for an oversize upload, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestUploadRejectsEmptyFile(t *testing.T) {
	_, mux := newTestHandler(t)

	rec := uploadRequest(t, mux, "empty.png", nil, testToken)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for an empty file, got %d", rec.Code)
	}
}

// Keys are service-generated, but a traversal attempt on the read route must
// still resolve to nothing rather than escaping the upload directory.
func TestDownloadRejectsPathTraversal(t *testing.T) {
	_, mux := newTestHandler(t)

	for _, key := range []string{
		"../../../etc/passwd",
		"uploads/../../../etc/passwd",
	} {
		req := httptest.NewRequest(http.MethodGet, "/v1/uploads/files/"+key, nil)
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)

		if rec.Code == http.StatusOK {
			t.Errorf("traversal key %q unexpectedly returned 200", key)
		}
	}
}

func TestDownloadMissingKeyReturns404(t *testing.T) {
	_, mux := newTestHandler(t)

	req := httptest.NewRequest(http.MethodGet, "/v1/uploads/files/uploads/2026/01/deadbeef.png", nil)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for a missing object, got %d", rec.Code)
	}
}

func TestDeleteRemovesObject(t *testing.T) {
	_, mux := newTestHandler(t)

	rec := uploadRequest(t, mux, "photo.png", pngBytes, testToken)
	if rec.Code != http.StatusCreated {
		t.Fatalf("setup upload failed: %d", rec.Code)
	}
	var resp UploadResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	req := httptest.NewRequest(http.MethodDelete, "/v1/uploads/files/"+resp.Key, nil)
	req.Header.Set("Authorization", "Bearer "+testToken)
	delRec := httptest.NewRecorder()
	mux.ServeHTTP(delRec, req)

	if delRec.Code != http.StatusNoContent {
		t.Fatalf("expected 204 on delete, got %d", delRec.Code)
	}

	getReq := httptest.NewRequest(http.MethodGet, "/v1/uploads/files/"+resp.Key, nil)
	getRec := httptest.NewRecorder()
	mux.ServeHTTP(getRec, getReq)
	if getRec.Code != http.StatusNotFound {
		t.Fatalf("expected 404 after delete, got %d", getRec.Code)
	}
}

func TestDeleteRequiresToken(t *testing.T) {
	_, mux := newTestHandler(t)

	req := httptest.NewRequest(http.MethodDelete, "/v1/uploads/files/uploads/2026/01/abc.png", nil)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for unauthenticated delete, got %d", rec.Code)
	}
}

// Two uploads of identical bytes must land on distinct keys so one educator's
// upload can never overwrite another's.
func TestObjectKeysAreUnique(t *testing.T) {
	_, mux := newTestHandler(t)

	seen := make(map[string]bool)
	for i := 0; i < 25; i++ {
		rec := uploadRequest(t, mux, "photo.png", pngBytes, testToken)
		if rec.Code != http.StatusCreated {
			t.Fatalf("upload %d failed: %d", i, rec.Code)
		}
		var resp UploadResponse
		if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		if seen[resp.Key] {
			t.Fatalf("duplicate key generated: %s", resp.Key)
		}
		seen[resp.Key] = true
	}
}
