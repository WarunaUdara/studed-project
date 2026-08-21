package coderun

import (
	"context"
	"strings"
	"testing"
	"time"
)

func newTestRunner(t *testing.T) *Runner {
	t.Helper()
	r := New(Config{Timeout: 3 * time.Second})
	if !r.Available() {
		t.Skip("no python interpreter on this machine")
	}
	return r
}

func TestRunReturnsWhatTheProgramPrinted(t *testing.T) {
	r := newTestRunner(t)
	res, err := r.Run(context.Background(), Request{Code: "print('hello ' + 'world')"})
	if err != nil {
		t.Fatalf("runner failed: %v", err)
	}
	if strings.TrimSpace(res.Stdout) != "hello world" {
		t.Errorf("expected the printed line, got %q", res.Stdout)
	}
	if res.ExitCode != 0 {
		t.Errorf("expected a clean exit, got %d", res.ExitCode)
	}
}

// A student's mistake is a successful run with a traceback, not a runner error.
func TestRunSurfacesTheRealTraceback(t *testing.T) {
	r := newTestRunner(t)
	res, err := r.Run(context.Background(), Request{Code: "print(1/0)"})
	if err != nil {
		t.Fatalf("a failing program must not fail the runner: %v", err)
	}
	if res.ExitCode == 0 {
		t.Error("expected a non-zero exit code for a crashing program")
	}
	if !strings.Contains(res.Stderr, "ZeroDivisionError") {
		t.Errorf("the student must see the real error, got %q", res.Stderr)
	}
}

func TestRunSurfacesSyntaxErrors(t *testing.T) {
	r := newTestRunner(t)
	res, err := r.Run(context.Background(), Request{Code: "print('unclosed"})
	if err != nil {
		t.Fatalf("runner failed: %v", err)
	}
	if !strings.Contains(res.Stderr, "SyntaxError") {
		t.Errorf("expected a SyntaxError, got %q", res.Stderr)
	}
}

func TestRunFeedsStdinToInput(t *testing.T) {
	r := newTestRunner(t)
	res, err := r.Run(context.Background(), Request{
		Code:  "name = input()\nprint('hi ' + name)",
		Stdin: "Kavindi\n",
	})
	if err != nil {
		t.Fatalf("runner failed: %v", err)
	}
	if !strings.Contains(res.Stdout, "hi Kavindi") {
		t.Errorf("expected stdin to reach input(), got %q", res.Stdout)
	}
}

func TestRunStopsARunawayLoop(t *testing.T) {
	r := New(Config{Timeout: 1 * time.Second})
	if !r.Available() {
		t.Skip("no python interpreter on this machine")
	}
	started := time.Now()
	res, err := r.Run(context.Background(), Request{Code: "while True:\n    pass"})
	if err != nil {
		t.Fatalf("runner failed: %v", err)
	}
	if !res.TimedOut {
		t.Error("expected the runaway loop to be reported as timed out")
	}
	if elapsed := time.Since(started); elapsed > 10*time.Second {
		t.Errorf("the deadline did not stop the program promptly: %s", elapsed)
	}
	if !strings.Contains(res.Stderr, "looping forever") {
		t.Errorf("the student needs a readable reason, got %q", res.Stderr)
	}
}

func TestRunCapsRunawayOutput(t *testing.T) {
	r := New(Config{Timeout: 5 * time.Second, MaxOutputBytes: 1024})
	if !r.Available() {
		t.Skip("no python interpreter on this machine")
	}
	res, err := r.Run(context.Background(), Request{Code: "for i in range(100000):\n    print('x' * 50)"})
	if err != nil {
		t.Fatalf("runner failed: %v", err)
	}
	if len(res.Stdout) > 1024 {
		t.Errorf("output cap was not applied: %d bytes", len(res.Stdout))
	}
	if !res.Truncated {
		t.Error("the student must be told the output was cut short")
	}
}

func TestRunRejectsAnOversizedProgramBeforeExecuting(t *testing.T) {
	r := New(Config{MaxCodeBytes: 32})
	_, err := r.Run(context.Background(), Request{Code: strings.Repeat("print(1)\n", 100)})
	if err != ErrCodeTooLarge {
		t.Errorf("expected ErrCodeTooLarge, got %v", err)
	}
}

func TestRunWithoutAnInterpreterSaysSoClearly(t *testing.T) {
	r := New(Config{PythonPath: ""})
	r.python = ""
	if r.Available() {
		t.Fatal("a runner with no interpreter must not report itself available")
	}
	if _, err := r.Run(context.Background(), Request{Code: "print(1)"}); err != ErrUnavailable {
		t.Errorf("expected ErrUnavailable, got %v", err)
	}
}

// The service's own configuration must not be readable from a student program.
func TestRunStripsTheServiceEnvironment(t *testing.T) {
	r := newTestRunner(t)
	t.Setenv("GEMINI_API_KEY", "super-secret-value")
	res, err := r.Run(context.Background(), Request{
		Code: "import os\nprint(os.environ.get('GEMINI_API_KEY', 'absent'))",
	})
	if err != nil {
		t.Fatalf("runner failed: %v", err)
	}
	if strings.Contains(res.Stdout, "super-secret-value") {
		t.Error("service secrets leaked into the student sandbox")
	}
}
