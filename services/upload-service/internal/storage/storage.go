// Package storage abstracts the object store behind upload-service.
//
// Two backends implement the same contract: GCS (production and the local
// floci-gcp emulator, which is wire-compatible) and plain disk (zero-dependency
// local development). Handlers never branch on which one is active, so the
// production code path is the one exercised locally.
package storage

import (
	"context"
	"errors"
	"io"
)

// ErrNotFound is returned by Get and Delete when the object does not exist, so
// handlers can map it to 404 without importing a backend-specific error type.
var ErrNotFound = errors.New("object not found")

// Object is the metadata returned alongside an object's bytes.
type Object struct {
	Body        io.ReadCloser
	ContentType string
	Size        int64
}

// Store is the minimal object-store surface upload-service needs.
type Store interface {
	// Put streams r into the store under key. size is the exact byte count.
	Put(ctx context.Context, key, contentType string, r io.Reader) error
	// Get opens the object at key. The caller must close Object.Body.
	Get(ctx context.Context, key string) (*Object, error)
	// Delete removes the object at key.
	Delete(ctx context.Context, key string) error
	// Ping verifies the backend is reachable, backing the /ready probe.
	Ping(ctx context.Context) error
	// Kind names the backend for logs and health output.
	Kind() string
}
