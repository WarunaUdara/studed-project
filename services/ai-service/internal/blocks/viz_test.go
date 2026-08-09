package blocks

import (
	"encoding/json"
	"testing"
)

func TestParseLearnBlocks_ValidatesVizMetadata(t *testing.T) {
	raw := []byte(`[
		{"id":"l1","type":"text","content":"Introduction"},
		{"id":"l2","type":"mathviz_manim","content":"Pythagorean proof",
		 "metadata":"{\"title\":\"Pythagorean Proof\",\"scene_spec\":{\"beats\":[{\"time\":0,\"action\":\"create\"}]}}"}
	]`)
	parsed, err := ParseLearnBlocks(raw)
	if err != nil {
		t.Fatalf("expected valid viz block to parse: %v", err)
	}
	if len(parsed) != 2 {
		t.Fatalf("expected 2 blocks, got %d", len(parsed))
	}
	if parsed[1].Type != "mathviz_manim" {
		t.Fatalf("expected mathviz_manim type, got %q", parsed[1].Type)
	}
}

func TestParseLearnBlocks_RejectsVizWithoutMetadata(t *testing.T) {
	// A viz block without metadata degrades to a text block rather than
	// failing the whole payload (one bad block must not discard valid
	// content generated alongside it).
	raw := []byte(`[{"id":"l1","type":"chemviz_3dmol","content":"Water molecule"}]`)
	parsed, err := ParseLearnBlocks(raw)
	if err != nil {
		t.Fatalf("expected degrade-to-text, got error: %v", err)
	}
	if len(parsed) != 1 || parsed[0].Type != "text" {
		t.Fatalf("expected one text block, got %+v", parsed)
	}
	if parsed[0].Content != "Water molecule" {
		t.Fatalf("content must be preserved: %q", parsed[0].Content)
	}
}

func TestParseLearnBlocks_RejectsVizWithInvalidMetadata(t *testing.T) {
	raw := []byte(`[
		{"id":"l1","type":"text","content":"valid text block"},
		{"id":"l2","type":"elecsim_tscircuit","content":"LED circuit",
		 "metadata":"{\"title\":\"LED\",\"simulation\":{\"enabled\":true}}"}
	]`)
	parsed, err := ParseLearnBlocks(raw)
	if err != nil {
		t.Fatalf("expected degrade-to-text, got error: %v", err)
	}
	if len(parsed) != 2 {
		t.Fatalf("expected both blocks to survive, got %d", len(parsed))
	}
	if parsed[0].Type != "text" {
		t.Fatalf("first block type = %q, want text", parsed[0].Type)
	}
	if parsed[1].Type != "text" || parsed[1].Metadata != "" {
		t.Fatalf("bad viz block should degrade to text with cleared metadata, got %+v", parsed[1])
	}
}

func TestParseEvaluateBlocks_ResolvesCorrectIndex(t *testing.T) {
	raw := []byte(`[{"id":"q1","type":"mcq","question":"Pick one",
		"options":["A","B","C"],"correctIndex":1,"explanation":"B is right"}]`)
	parsed, err := ParseEvaluateBlocks(raw)
	if err != nil {
		t.Fatalf("expected correctIndex to resolve: %v", err)
	}
	if len(parsed) != 1 {
		t.Fatalf("expected 1 block, got %d", len(parsed))
	}
	if parsed[0].CorrectAnswer != "B" {
		t.Fatalf("correctAnswer = %q, want B (resolved from index 1)", parsed[0].CorrectAnswer)
	}
}

func TestParseEvaluateBlocks_KeepsExplicitCorrectAnswer(t *testing.T) {
	raw := []byte(`[{"id":"q1","type":"mcq","question":"Pick one",
		"options":["A","B"],"correctAnswer":"A","correctIndex":1}]`)
	parsed, err := ParseEvaluateBlocks(raw)
	if err != nil {
		t.Fatalf("expected parse: %v", err)
	}
	if parsed[0].CorrectAnswer != "A" {
		t.Fatalf("explicit correctAnswer must win, got %q", parsed[0].CorrectAnswer)
	}
}

func TestParseEvaluateBlocks_OutOfRangeCorrectIndexFails(t *testing.T) {
	raw := []byte(`[{"id":"q1","type":"mcq","question":"Pick one",
		"options":["A","B"],"correctIndex":5}]`)
	_, err := ParseEvaluateBlocks(raw)
	if err == nil {
		t.Fatal("expected error when correctIndex is out of range and no correctAnswer")
	}
}

func TestParseEvaluateBlocks_AcceptsChoicesAlias(t *testing.T) {
	// The model sometimes emits "choices" instead of "options".
	raw := []byte(`[{"id":"q1","type":"mcq","question":"Solve for x: 3x + 5 = 20",
		"choices":["x = 5","x = 8","x = 15","x = 3"],"correctIndex":0,
		"explanation":"Subtract 5, divide by 3."}]`)
	parsed, err := ParseEvaluateBlocks(raw)
	if err != nil {
		t.Fatalf("expected choices alias to parse: %v", err)
	}
	if len(parsed) != 1 {
		t.Fatalf("expected 1 block, got %d", len(parsed))
	}
	if len(parsed[0].Options) != 4 {
		t.Fatalf("options = %v, want 4 from choices alias", parsed[0].Options)
	}
	if parsed[0].CorrectAnswer != "x = 5" {
		t.Fatalf("correctAnswer = %q, want x = 5", parsed[0].CorrectAnswer)
	}
}

func TestValidateVizMetadata_MathViz(t *testing.T) {
	meta := `{"title":"Pendulum","scene_spec":{"style":"dark"}}`
	got, err := ValidateVizMetadata("mathviz_manim", json.RawMessage(meta))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	m, ok := got.(*MathVizMetadata)
	if !ok {
		t.Fatalf("expected *MathVizMetadata, got %T", got)
	}
	if m.Title != "Pendulum" {
		t.Fatalf("expected title Pendulum, got %q", m.Title)
	}
}

func TestValidateVizMetadata_MathVizRequiresSceneOrScript(t *testing.T) {
	_, err := ValidateVizMetadata("mathviz_manim", json.RawMessage(`{"title":"X"}`))
	if err == nil {
		t.Fatal("expected error for mathviz without scene_spec/script_id")
	}
}

func TestValidateVizMetadata_ChemViz(t *testing.T) {
	meta := `{"title":"Water","molecule":{"source_type":"smiles","source_value":"O"}}`
	got, err := ValidateVizMetadata("chemviz_3dmol", json.RawMessage(meta))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	m, ok := got.(*ChemVizMetadata)
	if !ok {
		t.Fatalf("expected *ChemVizMetadata, got %T", got)
	}
	if m.Molecule.SourceValue != "O" {
		t.Fatalf("expected source_value O, got %q", m.Molecule.SourceValue)
	}
}

func TestValidateVizMetadata_ChemVizRejectsBadSourceType(t *testing.T) {
	_, err := ValidateVizMetadata("chemviz_3dmol", json.RawMessage(
		`{"title":"X","molecule":{"source_type":"nope","source_value":"O"}}`))
	if err == nil {
		t.Fatal("expected error for invalid source_type")
	}
}

func TestValidateVizMetadata_ElecSim(t *testing.T) {
	meta := `{"title":"LED","circuit_code":"<Resistor name=\"R1\" resistance=\"220ohm\" />"}`
	got, err := ValidateVizMetadata("elecsim_tscircuit", json.RawMessage(meta))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := got.(*ElecSimMetadata); !ok {
		t.Fatalf("expected *ElecSimMetadata, got %T", got)
	}
}

func TestValidateVizMetadata_MechSim(t *testing.T) {
	meta := `{"title":"Pendulum","scenario_type":"pendulum",
		"world_config":{"gravity":{"x":0,"y":1},"bodies":[{"id":"bob","type":"circle","position":{"x":0,"y":0}}]}}`
	got, err := ValidateVizMetadata("mechsim_matterjs", json.RawMessage(meta))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := got.(*MechSimMetadata); !ok {
		t.Fatalf("expected *MechSimMetadata, got %T", got)
	}
}

func TestValidateVizMetadata_MechSimRequiresBodies(t *testing.T) {
	_, err := ValidateVizMetadata("mechsim_matterjs", json.RawMessage(
		`{"title":"X","scenario_type":"pendulum","world_config":{"gravity":{"x":0,"y":1}}}`))
	if err == nil {
		t.Fatal("expected error for mechsim without bodies")
	}
}

func TestValidateVizMetadata_RejectsUnknownType(t *testing.T) {
	if _, err := ValidateVizMetadata("hologram", json.RawMessage(`{}`)); err == nil {
		t.Fatal("expected error for unknown viz type")
	}
}

func TestValidateVizMetadata_RejectsEmptyPayload(t *testing.T) {
	if _, err := ValidateVizMetadata("mathviz_manim", nil); err == nil {
		t.Fatal("expected error for empty payload")
	}
}
