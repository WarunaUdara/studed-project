// Package retry provides a simple exponential-backoff retry helper for
// idempotent operations (reads). Never use on mutating operations.
package retry

import (
	"context"
	"errors"
	"math"
	"time"
)

// Config holds retry parameters.
type Config struct {
	// MaxAttempts is the total number of tries (including the first).
	MaxAttempts int
	// BaseDelay is the initial wait before the first retry.
	BaseDelay time.Duration
	// MaxDelay caps the exponential growth.
	MaxDelay time.Duration
}

// DefaultConfig returns a sensible default for inter-service RPC reads.
var DefaultConfig = Config{
	MaxAttempts: 3,
	BaseDelay:   100 * time.Millisecond,
	MaxDelay:    2 * time.Second,
}

// Do runs fn up to cfg.MaxAttempts times using exponential backoff.
// It stops early when ctx is cancelled or fn returns a non-retryable error.
// Mark errors as permanent (non-retryable) by wrapping with ErrPermanent.
func Do(ctx context.Context, cfg Config, fn func(ctx context.Context) error) error {
	var lastErr error
	for attempt := 0; attempt < cfg.MaxAttempts; attempt++ {
		if err := ctx.Err(); err != nil {
			return err
		}

		lastErr = fn(ctx)
		if lastErr == nil {
			return nil
		}

		// Do not retry permanent (non-idempotent) errors.
		var perm *PermanentError
		if errors.As(lastErr, &perm) {
			return perm.Unwrap()
		}

		if attempt < cfg.MaxAttempts-1 {
			delay := time.Duration(math.Pow(2, float64(attempt))) * cfg.BaseDelay
			if delay > cfg.MaxDelay {
				delay = cfg.MaxDelay
			}
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(delay):
			}
		}
	}
	return lastErr
}

// PermanentError wraps an error to signal that it must not be retried.
type PermanentError struct {
	err error
}

func (p *PermanentError) Error() string { return p.err.Error() }
func (p *PermanentError) Unwrap() error { return p.err }

// Permanent marks err as non-retryable.
func Permanent(err error) error {
	if err == nil {
		return nil
	}
	return &PermanentError{err: err}
}
