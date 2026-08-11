// Package retry provides a simple exponential-backoff retry helper for
// idempotent operations (reads). Never use on mutating operations.
package retry

import (
	"context"
	"errors"
	"math"
	"math/rand/v2"
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
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(backoff(attempt, cfg)):
			}
		}
	}
	return lastErr
}

// backoff returns the wait before the given retry attempt using exponential
// backoff with FULL jitter: a uniform random draw from [0, capped delay).
//
// The jitter is the part that matters in this cluster. When a shared dependency
// (Neon, Redis, a restarting pod) blips, every caller fails at the same instant;
// with a deterministic delay they would all retry at the same instant too and
// re-stampede the service just as it recovers. Spreading retries across the
// window is what breaks that synchronization.
func backoff(attempt int, cfg Config) time.Duration {
	delay := time.Duration(math.Pow(2, float64(attempt))) * cfg.BaseDelay
	if delay > cfg.MaxDelay {
		delay = cfg.MaxDelay
	}
	if delay <= 0 {
		return 0
	}
	return time.Duration(rand.Int64N(int64(delay)))
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
