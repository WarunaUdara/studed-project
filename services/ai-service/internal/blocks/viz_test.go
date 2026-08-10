package blocks

import (
	"encoding/json"
	"strings"
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
	raw := []byte(`[{"id":"l1","type":"chemviz_3dmol","content":"Water molecule"}]`)
	_, err := ParseLearnBlocks(raw)
	if err == nil {
		t.Fatal("expected error for chemviz block without metadata")
	}
	if !strings.Contains(err.Error(), "requires JSON metadata") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestParseLearnBlocks_RejectsVizWithInvalidMetadata(t *testing.T) {
	raw := []byte(`[
		{"id":"l1","type":"elecsim_tscircuit","content":"LED circuit",
		 "metadata":"{\"title\":\"LED\",\"simulation\":{\"enabled\":true}}"}
	]`)
	_, err := ParseLearnBlocks(raw)
	if err == nil {
		t.Fatal("expected error for elecsim without circuit_code")
	}
	if !strings.Contains(err.Error(), "circuit_code") {
		t.Fatalf("unexpected error: %v", err)
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
