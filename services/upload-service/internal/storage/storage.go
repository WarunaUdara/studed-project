package storage

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

type Provider interface {
	Store(key string, r io.Reader, size int64) error
	Open(key string) (io.ReadCloser, error)
	Delete(key string) error
	URL(key string) string
}

type LocalProvider struct {
	BasePath string
	BaseURL  string
}

func NewLocalProvider(basePath, baseURL string) *LocalProvider {
	return &LocalProvider{BasePath: basePath, BaseURL: baseURL}
}

func (p *LocalProvider) fullPath(key string) string {
	cleanKey := path.Clean("/" + key)
	return filepath.Join(p.BasePath, cleanKey)
}

func (p *LocalProvider) Store(key string, r io.Reader, size int64) error {
	fullPath := p.fullPath(key)
	if err := ensureDir(filepath.Dir(fullPath)); err != nil {
		return fmt.Errorf("failed to create upload directory: %w", err)
	}

	f, err := createFile(fullPath)
	if err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}
	defer f.Close()

	if _, err := io.Copy(f, r); err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}
	return nil
}

func (p *LocalProvider) Open(key string) (io.ReadCloser, error) {
	fullPath := p.fullPath(key)
	return openFile(fullPath)
}

func (p *LocalProvider) Delete(key string) error {
	fullPath := p.fullPath(key)
	return removeFile(fullPath)
}

func (p *LocalProvider) URL(key string) string {
	base := strings.TrimSuffix(p.BaseURL, "/")
	return base + "/" + strings.TrimPrefix(key, "/")
}

func SafeFilename(name string) string {
	base := path.Base(name)
	if base == "." || base == "/" {
		base = "file"
	}
	ext := strings.ToLower(filepath.Ext(base))
	if ext == "" {
		ext = ".bin"
	}
	return uuid.NewString() + ext
}

func ensureDir(dir string) error {
	return os.MkdirAll(dir, 0o755)
}

func createFile(path string) (*os.File, error) {
	return os.Create(path)
}

func openFile(path string) (*os.File, error) {
	return os.Open(path)
}

func removeFile(path string) error {
	return os.Remove(path)
}

func ContentType(name string, fallback string) string {
	ct := http.DetectContentType([]byte(name))
	if ct != "application/octet-stream" {
		return ct
	}
	ext := strings.ToLower(filepath.Ext(name))
	switch ext {
	case ".png":
		return "image/png"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".gif":
		return "image/gif"
	case ".webp":
		return "image/webp"
	case ".mp4":
		return "video/mp4"
	case ".webm":
		return "video/webm"
	case ".pdf":
		return "application/pdf"
	default:
		if fallback != "" {
			return fallback
		}
		return "application/octet-stream"
	}
}
