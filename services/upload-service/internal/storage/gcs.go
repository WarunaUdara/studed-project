package storage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"strings"

	"cloud.google.com/go/storage"
	"google.golang.org/api/option"
)

// GCS is the Google Cloud Storage backend. In production it authenticates via
// Workload Identity (no key file on disk); against the floci-gcp emulator it
// points at a custom endpoint and skips auth entirely.
type GCS struct {
	client   *storage.Client
	bucket   string
	emulated bool
}

// NewGCS builds a GCS-backed store. emulatorHost is optional; when set the
// client is redirected there and authentication is disabled.
func NewGCS(ctx context.Context, bucket, emulatorHost string) (*GCS, error) {
	if bucket == "" {
		return nil, errors.New("bucket name is required")
	}

	var opts []option.ClientOption
	if emulatorHost != "" {
		// The emulator has no credentials; requesting them would fail on a
		// machine with no ADC configured.
		opts = append(opts, option.WithEndpoint(emulatorEndpoint(emulatorHost)), option.WithoutAuthentication())
	}

	client, err := storage.NewClient(ctx, opts...)
	if err != nil {
		return nil, fmt.Errorf("create storage client: %w", err)
	}

	g := &GCS{client: client, bucket: bucket, emulated: emulatorHost != ""}

	// A freshly started emulator has no buckets, and the client will not create
	// one implicitly, so `docker compose up` would otherwise leave the service
	// permanently unready until someone hand-rolled a curl. Creating it here
	// keeps local setup zero-config. Never reached in production, where no
	// emulator host is configured and bucket creation is Terraform's job.
	if g.emulated {
		if err := g.ensureBucket(ctx); err != nil {
			_ = client.Close()
			return nil, err
		}
	}

	return g, nil
}

// ensureBucket creates the bucket in the emulator when it is missing. An
// already-existing bucket is success, not an error.
func (g *GCS) ensureBucket(ctx context.Context) error {
	if _, err := g.client.Bucket(g.bucket).Attrs(ctx); err == nil {
		return nil
	} else if !errors.Is(err, storage.ErrBucketNotExist) {
		return fmt.Errorf("inspect emulator bucket %q: %w", g.bucket, err)
	}

	// The emulator ignores the project ID, but the API requires one.
	err := g.client.Bucket(g.bucket).Create(ctx, emulatorProjectID, nil)
	if err == nil {
		return nil
	}
	// Lost a race with another replica starting at the same time.
	if strings.Contains(err.Error(), "409") || strings.Contains(strings.ToLower(err.Error()), "already exists") {
		return nil
	}
	return fmt.Errorf("create emulator bucket %q: %w", g.bucket, err)
}

// emulatorProjectID is a placeholder: emulators do not validate it.
const emulatorProjectID = "studed-local"

// emulatorEndpoint normalizes an emulator base URL into the form the storage
// client expects. Passing a bare "http://host:port" makes every request resolve
// to /b/<bucket> instead of /storage/v1/b/<bucket>, which the emulator answers
// with 404 - so the JSON API path is appended when it is missing.
func emulatorEndpoint(host string) string {
	endpoint := strings.TrimRight(host, "/")
	if !strings.Contains(endpoint, "://") {
		endpoint = "http://" + endpoint
	}
	if !strings.HasSuffix(endpoint, "/storage/v1") {
		endpoint += "/storage/v1"
	}
	return endpoint + "/"
}

func (g *GCS) Kind() string {
	if g.emulated {
		return "gcs-emulator"
	}
	return "gcs"
}

func (g *GCS) Put(ctx context.Context, key, contentType string, r io.Reader) error {
	w := g.client.Bucket(g.bucket).Object(key).NewWriter(ctx)
	w.ContentType = contentType
	// Uploaded objects are immutable: the key embeds random bytes, so a given
	// key never changes content and can be cached hard by browsers and CDNs.
	w.CacheControl = "public, max-age=31536000, immutable"

	if _, err := io.Copy(w, r); err != nil {
		// Abort so a partial object is never committed, then surface the
		// original error rather than the close error.
		_ = w.Close()
		return fmt.Errorf("write object: %w", err)
	}
	if err := w.Close(); err != nil {
		return fmt.Errorf("finalize object: %w", err)
	}
	return nil
}

func (g *GCS) Get(ctx context.Context, key string) (*Object, error) {
	obj := g.client.Bucket(g.bucket).Object(key)
	reader, err := obj.NewReader(ctx)
	if err != nil {
		if errors.Is(err, storage.ErrObjectNotExist) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("open object: %w", err)
	}

	return &Object{
		Body:        reader,
		ContentType: reader.Attrs.ContentType,
		Size:        reader.Attrs.Size,
	}, nil
}

func (g *GCS) Delete(ctx context.Context, key string) error {
	err := g.client.Bucket(g.bucket).Object(key).Delete(ctx)
	if errors.Is(err, storage.ErrObjectNotExist) {
		return ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("delete object: %w", err)
	}
	return nil
}

func (g *GCS) Ping(ctx context.Context) error {
	// Bucket attribute reads are the cheapest call that proves both network
	// reachability and that our identity can actually see the bucket.
	if _, err := g.client.Bucket(g.bucket).Attrs(ctx); err != nil {
		return fmt.Errorf("bucket %q unreachable: %w", g.bucket, err)
	}
	return nil
}

// Close releases the underlying client.
func (g *GCS) Close() error { return g.client.Close() }
