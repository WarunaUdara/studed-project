package tools

import (
	"context"
	"errors"
	"strings"
	"sync"
	"testing"

	"github.com/studed/ai-service/internal/provider"
)

// scriptedProvider returns canned JSON per GenerateJSON call and an empty
// stream for Stream. It is safe for concurrent use.
type scriptedProvider struct {
	mu        sync.Mutex
	jsonCalls int
	jsonOuts  [][]byte
	jsonErrs  []error
}

func (s *scriptedProvider) GenerateJSON(ctx context.Context, system, user string, opts provider.Options) ([]byte, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	i := s.jsonCalls
	s.jsonCalls++
	if i < len(s.jsonErrs) && s.jsonErrs[i] != nil {
		return nil, s.jsonErrs[i]
	}
	if i < len(s.jsonOuts) {
		return s.jsonOuts[i], nil
	}
	return []byte("{}"), nil
}

func (s *scriptedProvider) Stream(ctx context.Context, msgs []provider.Message, tools []provider.Tool, opts provider.Options) (<-chan provider.StreamEvent, error) {
	ch := make(chan provider.StreamEvent)
	close(ch)
	return ch, nil
}

func TestLearnBlocksParsesBlocks(t *testing.T) {
	s := &scriptedProvider{jsonOuts: [][]byte{[]byte(`[
		{"id":"l1","type":"text","content":"Introduction"},
		{"id":"l2","type":"mathviz_manim","content":"Pythagorean proof",
		 "metadata":{"title":"Pythagorean Proof","scene_spec":{"beats":[{"time":0,"action":"create"}]}}}
	]`)}}
	tool := LearnBlocks(s)

	res, err := tool.Execute(context.Background(), map[string]any{"prompt": "pythagoras", "language": "en", "grade": "8"})
	if err != nil {
		t.Fatalf("Execute: %v", err)
	}
	if len(res.Blocks) != 2 {
		t.Fatalf("blocks = %d, want 2", len(res.Blocks))
	}
	if res.Blocks[0].Type != "text" || res.Blocks[0].Content != "Introduction" {
		t.Errorf("block 0 = %+v", res.Blocks[0])
	}
	if res.Blocks[1].Type != "mathviz_manim" {
		t.Errorf("block 1 type = %q, want mathviz_manim", res.Blocks[1].Type)
	}
	// metadata was re-marshaled from an object into a JSON string and validated
	if !strings.Contains(res.Blocks[1].Metadata, "Pythagorean Proof") {
		t.Errorf("block 1 metadata = %q, want stringified object", res.Blocks[1].Metadata)
	}
	if res.Content != "" {
		t.Errorf("unexpected content = %q", res.Content)
	}
}

func TestLearnBlocksRepairOnInvalid(t *testing.T) {
	s := &scriptedProvider{jsonOuts: [][]byte{[]byte(`[
		{"id":"l1","type":"chemviz_3dmol","content":"Water molecule"}
	]`)}}
	tool := LearnBlocks(s)

	res, err := tool.Execute(context.Background(), map[string]any{"prompt": "water"})
	if err != nil {
		t.Fatalf("Execute: %v", err)
	}
	if len(res.Blocks) != 0 {
		t.Fatalf("blocks = %d, want 0 on invalid output", len(res.Blocks))
	}
	if !strings.Contains(res.Content, "requires JSON metadata") {
		t.Errorf("repair content = %q, want validation error text", res.Content)
	}
}

func TestLearnBlocksRepairOnNotJSON(t *testing.T) {
	s := &scriptedProvider{jsonOuts: [][]byte{[]byte(`plain text`)}} // array-only: object rejected by JSON mode, but models err
	tool := LearnBlocks(s)

	res, err := tool.Execute(context.Background(), map[string]any{"prompt": "x"})
	if err != nil {
		t.Fatalf("Execute: %v", err)
	}
	if len(res.Blocks) != 0 {
		t.Fatalf("blocks = %d, want 0", len(res.Blocks))
	}
	if !strings.Contains(res.Content, "not valid JSON") {
		t.Errorf("repair content = %q", res.Content)
	}
}

func TestEvaluateBlocksParses(t *testing.T) {
	s := &scriptedProvider{jsonOuts: [][]byte{[]byte(`[
		{"id":"e1","type":"mcq","question":"What is 2+2?","options":["3","4","5"],"correctAnswer":"4","explanation":"2+2=4"},
		{"id":"e2","type":"true_false","question":"Water boils at 100C.","correctAnswer":"true","explanation":"At sea level."}
	]`)}}
	tool := EvaluateBlocks(s)

	res, err := tool.Execute(context.Background(), map[string]any{"content": "arithmetic basics", "count": 2})
	if err != nil {
		t.Fatalf("Execute: %v", err)
	}
	if len(res.EvalBlocks) != 2 {
		t.Fatalf("eval blocks = %d, want 2", len(res.EvalBlocks))
	}
	if res.EvalBlocks[0].Type != "mcq" || res.EvalBlocks[0].CorrectAnswer != "4" {
		t.Errorf("eval block 0 = %+v", res.EvalBlocks[0])
	}
	if res.EvalBlocks[1].Type != "true_false" {
		t.Errorf("eval block 1 type = %q", res.EvalBlocks[1].Type)
	}
}

func TestEvaluateBlocksRepairOnInvalid(t *testing.T) {
	s := &scriptedProvider{jsonOuts: [][]byte{[]byte(`[
		{"id":"e1","type":"mcq","question":"Pick one","options":["A"],"correctAnswer":"B"}
	]`)}}
	tool := EvaluateBlocks(s)

	res, err := tool.Execute(context.Background(), map[string]any{"content": "x"})
	if err != nil {
		t.Fatalf("Execute: %v", err)
	}
	if len(res.EvalBlocks) != 0 {
		t.Fatalf("eval blocks = %d, want 0", len(res.EvalBlocks))
	}
	if !strings.Contains(res.Content, "at least 2 options") {
		t.Errorf("repair content = %q", res.Content)
	}
}

func TestVisualizationAllFamilies(t *testing.T) {
	cases := []struct {
		vizType   string
		blockType string
		raw       string
		metaWant  string
	}{
		{
			vizType: "manim", blockType: "mathviz_manim",
			raw:      `{"id":"v1","type":"mathviz_manim","content":"Pythagorean proof","metadata":{"title":"Pythagorean proof","scene_spec":{"scene_title":"Pythagoras","duration_seconds":10,"style":"dark","beats":[{"time":0,"action":"create_square"}],"color_palette":["#ffffff"]}}}`,
			metaWant: "Pythagorean proof",
		},
		{
			vizType: "3dmol", blockType: "chemviz_3dmol",
			raw:      `{"id":"v1","type":"chemviz_3dmol","content":"Water","metadata":{"title":"Water","molecule":{"source_type":"smiles","source_value":"O"},"style":{"stick":{}}}}`,
			metaWant: "Water",
		},
		{
			vizType: "tscircuit", blockType: "elecsim_tscircuit",
			raw:      `{"id":"v1","type":"elecsim_tscircuit","content":"LED circuit","metadata":{"title":"LED circuit","circuit_code":"<Resistor name=\"R1\" resistance=\"220ohm\" />"}}`,
			metaWant: "LED circuit",
		},
		{
			vizType: "matterjs", blockType: "mechsim_matterjs",
			raw:      `{"id":"v1","type":"mechsim_matterjs","content":"Pendulum","metadata":{"title":"Pendulum","scenario_type":"pendulum","world_config":{"gravity":{"x":0,"y":1},"bounds":{"width":800,"height":600},"bodies":[{"id":"bob","type":"circle","position":{"x":0,"y":0}}]}}}`,
			metaWant: "Pendulum",
		},
	}
	for _, tc := range cases {
		t.Run(tc.vizType, func(t *testing.T) {
			s := &scriptedProvider{jsonOuts: [][]byte{[]byte(tc.raw)}}
			tool := Visualization(s)

			res, err := tool.Execute(context.Background(), map[string]any{"concept": "c", "vizType": tc.vizType, "grade": "8"})
			if err != nil {
				t.Fatalf("Execute: %v", err)
			}
			if res.VizBlock == nil {
				t.Fatal("VizBlock = nil")
			}
			if res.VizBlock.Type != tc.blockType {
				t.Errorf("type = %q, want %q", res.VizBlock.Type, tc.blockType)
			}
			if !strings.Contains(res.VizBlock.Metadata, tc.metaWant) {
				t.Errorf("metadata = %q, want stringified object containing %q", res.VizBlock.Metadata, tc.metaWant)
			}
		})
	}
}

func TestVisualizationRepairOnInvalidMetadata(t *testing.T) {
	// mechsim without bodies must fail schema validation
	s := &scriptedProvider{jsonOuts: [][]byte{[]byte(
		`{"id":"v1","type":"mechsim_matterjs","content":"Pendulum","metadata":{"title":"Pendulum","scenario_type":"pendulum","world_config":{"gravity":{"x":0,"y":1}}}}`)}}
	tool := Visualization(s)

	res, err := tool.Execute(context.Background(), map[string]any{"concept": "pendulum", "vizType": "matterjs"})
	if err != nil {
		t.Fatalf("Execute: %v", err)
	}
	if res.VizBlock != nil {
		t.Fatal("VizBlock should be nil on invalid metadata")
	}
	if !strings.Contains(res.Content, "bodies") {
		t.Errorf("repair content = %q, want bodies validation error", res.Content)
	}
}

func TestVisualizationUnknownVizType(t *testing.T) {
	s := &scriptedProvider{}
	tool := Visualization(s)

	res, err := tool.Execute(context.Background(), map[string]any{"concept": "c", "vizType": "hologram"})
	if err != nil {
		t.Fatalf("Execute: %v", err)
	}
	if !strings.Contains(res.Content, "unknown visualization type") {
		t.Errorf("content = %q", res.Content)
	}
}

func TestTranslateExtractsTranslation(t *testing.T) {
	s := &scriptedProvider{jsonOuts: [][]byte{[]byte(`{"translation":"\u0db4\u0dd2\u0dad\u0dcf\u0d9c\u0dbb\u0dc3\u0dca \u0db4\u0dca\u200d\u0dbb\u0db8\u0dda\u0dba"}`)}}
	tool := Translate(s)

	res, err := tool.Execute(context.Background(), map[string]any{"content": "Pythagorean theorem", "targetLanguage": "si"})
	if err != nil {
		t.Fatalf("Execute: %v", err)
	}
	if res.Content != "පිතාගරස් ප්\u200dරමේය" {
		t.Errorf("content = %q, want translated text", res.Content)
	}
}

func TestTranslateFallsBackToRaw(t *testing.T) {
	s := &scriptedProvider{jsonOuts: [][]byte{[]byte(`translated plain text`)}}
	tool := Translate(s)

	res, err := tool.Execute(context.Background(), map[string]any{"content": "x", "targetLanguage": "ta"})
	if err != nil {
		t.Fatalf("Execute: %v", err)
	}
	if res.Content != "translated plain text" {
		t.Errorf("content = %q", res.Content)
	}
}

func TestToolProviderErrorReturnsRepairContent(t *testing.T) {
	s := &scriptedProvider{jsonErrs: []error{errors.New("upstream 500")}}
	tool := LearnBlocks(s)

	res, err := tool.Execute(context.Background(), map[string]any{"prompt": "x"})
	if err != nil {
		t.Fatalf("Execute: %v", err)
	}
	if !strings.Contains(res.Content, "tool error") || !strings.Contains(res.Content, "upstream 500") {
		t.Errorf("content = %q", res.Content)
	}
}

func TestDefaultSetDeclaresAllTools(t *testing.T) {
	s := &scriptedProvider{}
	set := DefaultSet(s)
	if len(set) != 4 {
		t.Fatalf("tool count = %d, want 4", len(set))
	}
	want := []string{"generateLearnBlocks", "generateEvaluateBlocks", "generateVisualization", "translateContent"}
	for i, name := range want {
		if set[i].Name != name {
			t.Errorf("tool %d name = %q, want %q", i, set[i].Name, name)
		}
		if set[i].Description == "" || set[i].Parameters == nil {
			t.Errorf("tool %s missing description or parameters", name)
		}
	}
}

func TestParseLearnBlocksHandlesStringMetadata(t *testing.T) {
	// some backends already return metadata as a string; must pass through
	raw := []byte(`[{"id":"l1","type":"chemviz_3dmol","content":"Water","metadata":"{\"title\":\"Water\",\"molecule\":{\"source_type\":\"smiles\",\"source_value\":\"O\"}}"}]`)
	parsed, err := parseLearnBlocks(raw)
	if err != nil {
		t.Fatalf("parseLearnBlocks: %v", err)
	}
	if len(parsed) != 1 || parsed[0].Type != "chemviz_3dmol" {
		t.Fatalf("parsed = %+v", parsed)
	}
	if !strings.Contains(parsed[0].Metadata, "source_value") {
		t.Errorf("metadata = %q", parsed[0].Metadata)
	}
}
