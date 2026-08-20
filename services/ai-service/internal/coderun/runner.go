// Package coderun executes short student Python programs and returns whatever
// they print, including the traceback when they get it wrong. Seeing the real
// error is the point of the exercise, so nothing here rewrites or prettifies
// what Python said.
//
// Isolation model, in order of what actually stops a hostile program:
//
//  1. The service container. This package runs student code as a child
//     process of ai-service, so the container's own boundary (non-root user,
//     read-only root filesystem, no network) is the real sandbox. Deployments
//     that skip those settings are running student code with the service's own
//     privileges, which is why the deployment notes call them out.
//  2. A wall-clock deadline, enforced by killing the whole process group, so a
//     runaway loop cannot outlive one request.
//  3. Address-space and CPU limits applied through prlimit when it is present,
//     which stops a program allocating the container to death.
//  4. A stripped environment and a per-run temporary working directory, so a
//     program cannot read service configuration out of env vars or leave
//     files behind.
//  5. Output caps, so a program that prints forever cannot fill memory on the
//     way back to the browser.
package coderun

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"syscall"
	"time"
)

const (
	// DefaultTimeout is generous for a lesson exercise and short enough that a
	// stuck program frees its slot quickly.
	DefaultTimeout = 5 * time.Second
	// DefaultMaxOutputBytes bounds stdout and stderr separately.
	DefaultMaxOutputBytes = 64 << 10
	// DefaultMaxCodeBytes is far more than any wave asks a child to write.
	DefaultMaxCodeBytes = 20 << 10
	// DefaultMaxStdinBytes covers the input() exercises.
	DefaultMaxStdinBytes = 4 << 10
	// defaultMemoryBytes caps the child's address space where prlimit exists.
	defaultMemoryBytes = 256 << 20
)

// Request is one program submitted by a student.
type Request struct {
	Code  string `json:"code"`
	Stdin string `json:"stdin"`
}

// Result is what the student sees: exactly what their program printed.
type Result struct {
	Stdout string `json:"stdout"`
	Stderr string `json:"stderr"`
	// ExitCode is -1 when the program was killed before it could exit.
	ExitCode   int   `json:"exitCode"`
	TimedOut   bool  `json:"timedOut"`
	DurationMs int64 `json:"durationMs"`
	// Truncated reports that output hit the cap, so the student knows the
	// program printed more than the panel is showing.
	Truncated bool `json:"truncated"`
}

// Runner executes programs with one interpreter and one set of limits.
type Runner struct {
	python         string
	prlimit        string
	timeout        time.Duration
	maxOutputBytes int
	maxCodeBytes   int
	maxStdinBytes  int
	memoryBytes    int
}

// Config overrides the defaults. Zero values keep the default.
type Config struct {
	// PythonPath overrides interpreter discovery.
	PythonPath     string
	Timeout        time.Duration
	MaxOutputBytes int
	MaxCodeBytes   int
	MaxStdinBytes  int
	MemoryBytes    int
}

// ErrUnavailable is returned when no Python interpreter is installed, so the
// caller can answer with a clear "not available here" instead of a crash.
var ErrUnavailable = errors.New("no python interpreter available")

// ErrCodeTooLarge is returned before anything is executed.
var ErrCodeTooLarge = errors.New("program is too large to run")

// New resolves the interpreter and returns a ready runner. A runner with no
// interpreter is still usable: Run reports ErrUnavailable.
func New(cfg Config) *Runner {
	r := &Runner{
		python:         cfg.PythonPath,
		timeout:        cfg.Timeout,
		maxOutputBytes: cfg.MaxOutputBytes,
		maxCodeBytes:   cfg.MaxCodeBytes,
		maxStdinBytes:  cfg.MaxStdinBytes,
		memoryBytes:    cfg.MemoryBytes,
	}
	if r.python == "" {
		for _, candidate := range []string{"python3", "python"} {
			if path, err := exec.LookPath(candidate); err == nil {
				r.python = path
				break
			}
		}
	}
	if r.timeout <= 0 {
		r.timeout = DefaultTimeout
	}
	if r.maxOutputBytes <= 0 {
		r.maxOutputBytes = DefaultMaxOutputBytes
	}
	if r.maxCodeBytes <= 0 {
		r.maxCodeBytes = DefaultMaxCodeBytes
	}
	if r.maxStdinBytes <= 0 {
		r.maxStdinBytes = DefaultMaxStdinBytes
	}
	if r.memoryBytes <= 0 {
		r.memoryBytes = defaultMemoryBytes
	}
	// prlimit is optional: without it the deadline still bounds a runaway
	// program, it just cannot also bound its memory.
	if path, err := exec.LookPath("prlimit"); err == nil {
		r.prlimit = path
	}
	return r
}

// Available reports whether programs can actually be executed here.
func (r *Runner) Available() bool { return r.python != "" }

// Run executes one program and returns its output. The error return is for
// the runner failing, never for the student's program failing: a syntax error
// is a successful run with a traceback on stderr.
func (r *Runner) Run(ctx context.Context, req Request) (Result, error) {
	if !r.Available() {
		return Result{}, ErrUnavailable
	}
	if len(req.Code) > r.maxCodeBytes {
		return Result{}, ErrCodeTooLarge
	}

	workDir, err := os.MkdirTemp("", "studed-run-")
	if err != nil {
		return Result{}, fmt.Errorf("could not create a working directory: %w", err)
	}
	defer os.RemoveAll(workDir)

	scriptPath := filepath.Join(workDir, "main.py")
	if err := os.WriteFile(scriptPath, []byte(req.Code), 0o600); err != nil {
		return Result{}, fmt.Errorf("could not write the program: %w", err)
	}

	runCtx, cancel := context.WithTimeout(ctx, r.timeout)
	defer cancel()

	// -I isolates the interpreter from environment variables and the user site
	// directory, -B stops it writing bytecode next to the script.
	name, args := r.python, []string{"-I", "-B", scriptPath}
	if r.prlimit != "" {
		name = r.prlimit
		args = append([]string{
			"--as=" + strconv.Itoa(r.memoryBytes),
			"--cpu=" + strconv.Itoa(int(r.timeout.Seconds())+1),
			"--nproc=64",
			"--",
			r.python,
		}, "-I", "-B", scriptPath)
	}

	cmd := exec.CommandContext(runCtx, name, args...)
	cmd.Dir = workDir
	cmd.Env = []string{
		"PATH=/usr/local/bin:/usr/bin:/bin",
		"HOME=" + workDir,
		"LANG=C.UTF-8",
		"PYTHONIOENCODING=utf-8",
		"PYTHONDONTWRITEBYTECODE=1",
	}

	stdin := req.Stdin
	if len(stdin) > r.maxStdinBytes {
		stdin = stdin[:r.maxStdinBytes]
	}
	cmd.Stdin = bytes.NewReader([]byte(stdin))

	stdout := &cappedBuffer{limit: r.maxOutputBytes}
	stderr := &cappedBuffer{limit: r.maxOutputBytes}
	cmd.Stdout = stdout
	cmd.Stderr = stderr

	// A new process group, killed as a group, so a program that spawns
	// children cannot leave them running after the deadline.
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	cmd.Cancel = func() error {
		if cmd.Process == nil {
			return nil
		}
		return syscall.Kill(-cmd.Process.Pid, syscall.SIGKILL)
	}

	started := time.Now()
	runErr := cmd.Run()
	duration := time.Since(started)

	result := Result{
		Stdout:     stdout.String(),
		Stderr:     stderr.String(),
		DurationMs: duration.Milliseconds(),
		Truncated:  stdout.truncated || stderr.truncated,
		TimedOut:   errors.Is(runCtx.Err(), context.DeadlineExceeded),
	}

	switch {
	case result.TimedOut:
		result.ExitCode = -1
		if result.Stderr == "" {
			result.Stderr = fmt.Sprintf("Your program was stopped after %s. Is something looping forever?", r.timeout)
		}
	case runErr == nil:
		result.ExitCode = 0
	default:
		var exitErr *exec.ExitError
		if errors.As(runErr, &exitErr) {
			result.ExitCode = exitErr.ExitCode()
		} else {
			return result, fmt.Errorf("could not run the program: %w", runErr)
		}
	}

	return result, nil
}

// cappedBuffer keeps the first `limit` bytes written to it and remembers that
// it dropped the rest.
type cappedBuffer struct {
	buf       bytes.Buffer
	limit     int
	truncated bool
}

func (c *cappedBuffer) Write(p []byte) (int, error) {
	remaining := c.limit - c.buf.Len()
	if remaining <= 0 {
		c.truncated = true
		// Report the full length: the program's write succeeded as far as it
		// is concerned, and failing here would raise an error inside a
		// student's program for a limit that is ours, not theirs.
		return len(p), nil
	}
	if len(p) > remaining {
		c.buf.Write(p[:remaining])
		c.truncated = true
		return len(p), nil
	}
	return c.buf.Write(p)
}

func (c *cappedBuffer) String() string { return c.buf.String() }
