package storage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"mime"
	"os"
	"path/filepath"
	"strings"
)

// Disk stores objects on the local filesystem. It exists so `go run .` works
// with no cloud dependency and no emulator; production always uses GCS.
type Disk struct {
	root string
}

// NewDisk creates the backing directory if it does not exist.
func NewDisk(root string) (*Disk, error) {
	if root == "" {
		return nil, errors.New("upload directory is required")
	}
	abs, err := filepath.Abs(root)
	if err != nil {
		return nil, fmt.Errorf("resolve upload directory: %w", err)
	}
	if err := os.MkdirAll(abs, 0o750); err != nil {
		return nil, fmt.Errorf("create upload directory: %w", err)
	}
	return &Disk{root: abs}, nil
}

func (d *Disk) Kind() string { return "disk" }

// resolve maps a key to an absolute path inside root, rejecting any key that
// would escape it. Keys are service-generated, but this is the last line of
// defence if that ever stops being true.
func (d *Disk) resolve(key string) (string, error) {
	if key == "" || strings.Contains(key, "\x00") {
		return "", ErrNotFound
	}
	path := filepath.Join(d.root, filepath.FromSlash(key))
	// filepath.Join already lexically cleans "..", so a contained result means
	// the key never escaped.
	if path != d.root && !strings.HasPrefix(path, d.root+string(os.PathSeparator)) {
		return "", ErrNotFound
	}
	return path, nil
}

func (d *Disk) Put(ctx context.Context, key, contentType string, r io.Reader) error {
	path, err := d.resolve(key)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o750); err != nil {
		return fmt.Errorf("create object directory: %w", err)
	}

	// Write to a temp file and rename so a failed upload never leaves a
	// half-written object readable at the final key.
	tmp, err := os.CreateTemp(filepath.Dir(path), ".upload-*")
	if err != nil {
		return fmt.Errorf("create temp file: %w", err)
	}
	tmpName := tmp.Name()
	defer func() {
		tmp.Close()
		os.Remove(tmpName)
	}()

	if _, err := io.Copy(tmp, r); err != nil {
		return fmt.Errorf("write object: %w", err)
	}
	if err := tmp.Close(); err != nil {
		return fmt.Errorf("flush object: %w", err)
	}
	if err := os.Rename(tmpName, path); err != nil {
		return fmt.Errorf("commit object: %w", err)
	}
	return nil
}

func (d *Disk) Get(ctx context.Context, key string) (*Object, error) {
	path, err := d.resolve(key)
	if err != nil {
		return nil, err
	}
	f, err := os.Open(path)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("open object: %w", err)
	}
	info, err := f.Stat()
	if err != nil {
		f.Close()
		return nil, fmt.Errorf("stat object: %w", err)
	}

	// Disk mode has no attribute store, so recover the type from the extension
	// the service assigned at upload time.
	contentType := mime.TypeByExtension(filepath.Ext(path))
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	return &Object{Body: f, ContentType: contentType, Size: info.Size()}, nil
}

func (d *Disk) Delete(ctx context.Context, key string) error {
	path, err := d.resolve(key)
	if err != nil {
		return err
	}
	if err := os.Remove(path); err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return ErrNotFound
		}
		return fmt.Errorf("delete object: %w", err)
	}
	return nil
}

func (d *Disk) Ping(ctx context.Context) error {
	info, err := os.Stat(d.root)
	if err != nil {
		return fmt.Errorf("upload directory unavailable: %w", err)
	}
	if !info.IsDir() {
		return fmt.Errorf("upload path %q is not a directory", d.root)
	}
	return nil
}
