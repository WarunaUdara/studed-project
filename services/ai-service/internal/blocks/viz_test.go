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

func TestParseLearnBlocks_AcceptsObjectMetadata(t *testing.T) {
	// The model often emits `"metadata": { ... }` (a JSON object) rather
	// than a JSON string; it must be preserved as its JSON string.
	raw := []byte(`[{"id":"l1","type":"mathviz_manim","content":"Pendulum",
		"metadata":{"title":"Pendulum","scene_spec":{"beats":[{"time":0,"action":"create"}]}}}]`)
	parsed, err := ParseLearnBlocks(raw)
	if err != nil {
		t.Fatalf("expected object metadata to parse: %v", err)
	}
	if len(parsed) != 1 {
		t.Fatalf("expected 1 block, got %d", len(parsed))
	}
	if parsed[0].Type != "mathviz_manim" {
		t.Fatalf("type = %q, want mathviz_manim", parsed[0].Type)
	}
	if !json.Valid([]byte(parsed[0].Metadata)) {
		t.Fatalf("metadata should be valid JSON string, got %q", parsed[0].Metadata)
	}
	var meta struct {
		Title string `json:"title"`
	}
	if err := json.Unmarshal([]byte(parsed[0].Metadata), &meta); err != nil || meta.Title != "Pendulum" {
		t.Fatalf("metadata round-trip failed: %v, %+v", err, meta)
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

func TestValidateVizMetadata_HTMLSimulation(t *testing.T) {
	meta := `{"title":"Projectile Motion","description":"Interactive","height":560,"html":"<!doctype html><html><body><canvas></canvas><script>requestAnimationFrame(()=>{});</script></body></html>"}`
	got, err := ValidateVizMetadata("html_simulation", json.RawMessage(meta))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := got.(*HTMLSimulationMetadata); !ok {
		t.Fatalf("expected *HTMLSimulationMetadata, got %T", got)
	}
}

func TestValidateVizMetadata_HTMLSimulationRequiresHTML(t *testing.T) {
	_, err := ValidateVizMetadata("html_simulation", json.RawMessage(`{"title":"X"}`))
	if err == nil {
		t.Fatal("expected error for html simulation without html")
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

func TestValidateVizMetadata_FullHTMLSimulationSchema(t *testing.T) {
	meta := `{"title":"Newton's First Law","description":"Interactive inertia simulation","height":560,"html":"<!doctype html><html><body><canvas id=\"sim\"></canvas><script>const canvas=document.getElementById('sim');const ctx=canvas.getContext('2d');let x=10;function loop(){x+=1;ctx.fillRect(x,10,10,10);requestAnimationFrame(loop)}loop();</script></body></html>"}`
	got, err := ValidateVizMetadata("html_simulation", json.RawMessage(meta))
	if err != nil {
		t.Fatalf("full html simulation schema should validate: %v", err)
	}
	m, ok := got.(*HTMLSimulationMetadata)
	if !ok {
		t.Fatalf("expected *HTMLSimulationMetadata, got %T", got)
	}
	if m.Title != "Newton's First Law" || len(m.HTML) == 0 {
		t.Fatalf("metadata = %+v", m)
	}
}

func TestValidateVizMetadata_FullHTMLSimulationLegacySchema(t *testing.T) {
	meta := `{"title":"Newton's Cradle","description":"Interactive","height":560,"html":"<!doctype html><html><body><canvas></canvas><script>requestAnimationFrame(()=>{});</script></body></html>"}`
	if _, err := ValidateVizMetadata("html_simulation", json.RawMessage(meta)); err != nil {
		t.Fatalf("html simulation should validate: %v", err)
	}
}

func TestValidateVizMetadata_FullChemVizSchema(t *testing.T) {
	// Matches the full documented 3Dmol schema: molecule source, style,
	// surface, camera, interactivity, annotations, dimensions.
	meta := `{
		"title": "Water Molecule (H2O)",
		"description": "Interactive 3D view of water molecule",
		"molecule": {"source_type": "smiles", "source_value": "O"},
		"style": {"stick": {"radius": 0.15, "colorscheme": "Jmol"}, "sphere": {"scale": 0.25}},
		"surface": {"type": "VDW", "opacity": 0.7, "color": "white"},
		"camera": {"position": {"x": 0, "y": 0, "z": 50}, "zoom": 1.0},
		"interactivity": {"rotate": true, "zoom": true, "pan": true, "click_to_identify": true, "hover_labels": true},
		"annotations": [{"type": "label", "text": "Hydrogen Bond", "position": {"x": 1.0, "y": 0.5, "z": 0.0}, "color": "red"}],
		"dimensions": {"width": 100, "height": 400}
	}`
	got, err := ValidateVizMetadata("chemviz_3dmol", json.RawMessage(meta))
	if err != nil {
		t.Fatalf("full chemviz schema should validate: %v", err)
	}
	m, ok := got.(*ChemVizMetadata)
	if !ok {
		t.Fatalf("expected *ChemVizMetadata, got %T", got)
	}
	if m.Molecule.SourceType != "smiles" || m.Molecule.SourceValue != "O" {
		t.Errorf("molecule = %+v", m.Molecule)
	}
	if len(m.Style) == 0 || m.Style["stick"] == nil {
		t.Errorf("style = %+v", m.Style)
	}
	if m.Surface["type"] != "VDW" {
		t.Errorf("surface = %+v", m.Surface)
	}
	if m.Camera["zoom"] != 1.0 {
		t.Errorf("camera = %+v", m.Camera)
	}
	if m.Interactivity["click_to_identify"] != true {
		t.Errorf("interactivity = %+v", m.Interactivity)
	}
	if len(m.Annotations) != 1 {
		t.Errorf("annotations = %+v", m.Annotations)
	}
}
