package agent

import (
	"strings"
	"testing"
)

func TestExtractJSON_CodeFencedPayload(t *testing.T) {
	s := "Here is the final lesson.\n\n```json\n{\"learnBlocks\":[{\"id\":\"b1\",\"type\":\"text\",\"content\":\"x\"}]}\n```\n\nEnjoy!"
	got := extractJSON(s)
	if !strings.HasPrefix(got, "{") || !strings.Contains(got, "learnBlocks") {
		t.Fatalf("extractJSON = %q, want embedded object", got)
	}
}

func TestExtractJSON_ArrayPayload(t *testing.T) {
	s := "```json\n[{\"id\":\"b1\",\"type\":\"text\",\"content\":\"x\"}]\n```"
	got := extractJSON(s)
	if !strings.HasPrefix(got, "[") {
		t.Fatalf("extractJSON = %q, want array", got)
	}
}

func TestExtractJSON_NestedBracesInStrings(t *testing.T) {
	// Braces inside string values must not affect depth tracking.
	s := `{"content":"a {b} c","blocks":[{"id":"x"}]}`
	got := extractJSON(s)
	if got != s {
		t.Fatalf("extractJSON = %q, want original %q", got, s)
	}
}

func TestExtractJSON_NoFence(t *testing.T) {
	s := `{"a":1}`
	if got := extractJSON(s); got != s {
		t.Fatalf("extractJSON = %q, want unchanged", got)
	}
}

func TestExtractJSON_NoJSON(t *testing.T) {
	s := "just prose, no json here"
	if got := extractJSON(s); got != s {
		t.Fatalf("extractJSON = %q, want unchanged", got)
	}
}

func TestDoneEvent_CodeFencedLearnBlocks(t *testing.T) {
	ev := (&Agent{}).doneEvent("```json\n[{\"id\":\"b1\",\"type\":\"text\",\"content\":\"hello\"}]\n```")
	if len(ev.LearnBlocks) != 1 {
		t.Fatalf("learn blocks = %d, want 1", len(ev.LearnBlocks))
	}
}
