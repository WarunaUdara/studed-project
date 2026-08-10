package agent

import (
	"strings"
	"testing"

	"github.com/studed/ai-service/internal/blocks"
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
	ev := (&Agent{}).doneEvent("```json\n[{\"id\":\"b1\",\"type\":\"text\",\"content\":\"hello\"}]\n```", nil, nil, nil)
	if len(ev.LearnBlocks) != 1 {
		t.Fatalf("learn blocks = %d, want 1", len(ev.LearnBlocks))
	}
}

func TestDoneEvent_LoneVizObject(t *testing.T) {
	// The model frequently wraps a single visualization as a bare object
	// (generateVisualization output) instead of a learnBlocks array; it
	// must be captured as a one-item learn-block payload.
	final := "Here is the visualization:\n```json\n{\"type\":\"mathviz_manim\",\"id\":\"balance-1\",\"title\":\"Balance Scale\",\"content\":\"Solving x + 5 = 9\",\"metadata\":{\"scene_spec\":{\"scene_title\":\"BalanceScaleEquation\",\"beats\":[{\"time\":0,\"action\":\"Display balanced scale\"}]}}}\n```\nEnjoy!"
	ev := (&Agent{}).doneEvent(final, nil, nil, nil)
	if len(ev.LearnBlocks) != 1 {
		t.Fatalf("learn blocks = %d, want 1 (lone viz object)", len(ev.LearnBlocks))
	}
	if ev.LearnBlocks[0].Type != "mathviz_manim" {
		t.Fatalf("type = %q, want mathviz_manim", ev.LearnBlocks[0].Type)
	}
	if !strings.Contains(ev.LearnBlocks[0].Metadata, "BalanceScaleEquation") {
		t.Fatalf("metadata = %q, want scene_spec preserved", ev.LearnBlocks[0].Metadata)
	}
}

func TestDoneEvent_LoneTextObjectFallsBackToProse(t *testing.T) {
	// A lone object that is NOT a valid block (e.g. arbitrary JSON) must not
	// be forced into blocks — the prose is delivered as the message.
	ev := (&Agent{}).doneEvent("The answer is 42.\n```json\n{\"explanation\":\"just a note\"}\n```", nil, nil, nil)
	if len(ev.LearnBlocks) != 0 || len(ev.EvaluateBlocks) != 0 {
		t.Fatalf("expected no blocks, got learn=%d evaluate=%d", len(ev.LearnBlocks), len(ev.EvaluateBlocks))
	}
}

func TestDoneEvent_MergesToolAccumulatedBlocks(t *testing.T) {
	// The model's final text has no JSON payload, but the loop accumulated
	// blocks from generation tools — they MUST land in the done event.
	accLearn := []blocks.LearnBlock{
		{ID: "viz-1", Type: "mechsim_matterjs", Content: "Pendulum", Metadata: `{"title":"Pendulum","scenario_type":"pendulum","world_config":{"bodies":[{"id":"b","type":"circle"}]}}`},
		{ID: "chem-1", Type: "chemviz_3dmol", Content: "Water", Metadata: `{"title":"Water","molecule":{"source_type":"smiles","source_value":"O"}}`},
	}
	ev := (&Agent{}).doneEvent("Added both visualizations to the wave.", accLearn, nil, nil)
	if len(ev.LearnBlocks) != 2 {
		t.Fatalf("learn blocks = %d, want 2 (from tool results)", len(ev.LearnBlocks))
	}
	if ev.LearnBlocks[0].Type != "mechsim_matterjs" || ev.LearnBlocks[1].Type != "chemviz_3dmol" {
		t.Fatalf("types = %s, %s", ev.LearnBlocks[0].Type, ev.LearnBlocks[1].Type)
	}
}

func TestDoneEvent_DedupesMergedBlocks(t *testing.T) {
	// Text echoed one block and the tool result carries the same id — the
	// merged payload must not contain duplicates.
	accLearn := []blocks.LearnBlock{
		{ID: "viz-1", Type: "mechsim_matterjs", Content: "Pendulum", Metadata: `{"title":"Pendulum","scenario_type":"pendulum","world_config":{"bodies":[{"id":"b","type":"circle"}]}}`},
	}
	final := "```json\n[{\"id\":\"viz-1\",\"type\":\"mechsim_matterjs\",\"content\":\"Pendulum\",\"metadata\":{\"title\":\"Pendulum\",\"scenario_type\":\"pendulum\",\"world_config\":{\"bodies\":[{\"id\":\"b\",\"type\":\"circle\"}]}}}]\n```"
	ev := (&Agent{}).doneEvent(final, accLearn, nil, nil)
	if len(ev.LearnBlocks) != 1 {
		t.Fatalf("learn blocks = %d, want 1 (deduped)", len(ev.LearnBlocks))
	}
}
