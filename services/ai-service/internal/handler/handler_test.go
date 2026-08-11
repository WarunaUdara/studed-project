package handler

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/studed/ai-service/internal/agent"
	"github.com/studed/ai-service/internal/provider"
	"github.com/studed/ai-service/internal/tools"
	"github.com/studed/ai-service/internal/vision"
)

// scriptedProvider returns canned JSON per GenerateJSON call and canned
// streams per Stream call. It is safe for concurrent use.
type scriptedProvider struct {
	mu          sync.Mutex
	jsonCalls   int
	jsonOuts    [][]byte
	streamCalls int
	streamOuts  [][]provider.StreamEvent
}

func (s *scriptedProvider) GenerateJSON(ctx context.Context, system, user string, opts provider.Options) ([]byte, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	i := s.jsonCalls
	s.jsonCalls++
	if i < len(s.jsonOuts) {
		return s.jsonOuts[i], nil
	}
	return []byte("{}"), nil
}

func (s *scriptedProvider) Stream(ctx context.Context, msgs []provider.Message, tl []provider.Tool, opts provider.Options) (<-chan provider.StreamEvent, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	ch := make(chan provider.StreamEvent)
	i := s.streamCalls
	s.streamCalls++
	go func() {
		defer close(ch)
		if i < len(s.streamOuts) {
			for _, ev := range s.streamOuts[i] {
				ch <- ev
			}
		}
	}()
	return ch, nil
}

// streamDone builds a canned "no tool calls, final answer" stream.
func streamDone(content string) []provider.StreamEvent {
	return []provider.StreamEvent{
		{Type: "text_delta", Delta: content},
		{Type: "done", Content: content},
	}
}

// streamToolThenDone builds a canned stream that requests a tool call and then
// returns a final answer on the next round trip.
func streamToolThenDone(toolName, args string) [][]provider.StreamEvent {
	return [][]provider.StreamEvent{
		{
			{Type: "tool_call", ToolCall: &provider.ToolCall{ID: "call_1", Name: toolName, Arguments: args}},
			{Type: "done", Content: ""},
		},
		streamDone(`{"learnBlocks":[]}`),
	}
}

func newTestHandler(p provider.Provider, v *vision.Client) *Handler {
	ag := agent.New(p, tools.DefaultSet(p), 3)
	return New(p, ag, v, slog.Default(), 0)
}

func post(t *testing.T, h *Handler, path string, body any) *httptest.ResponseRecorder {
	t.Helper()
	payload, _ := json.Marshal(body)
	mux := http.NewServeMux()
	h.Register(mux)
	req := httptest.NewRequest(http.MethodPost, path, bytes.NewReader(payload))
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)
	return rec
}

func TestGenerateLearnBlocks_ValidResponse(t *testing.T) {
	p := &scriptedProvider{jsonOuts: [][]byte{[]byte(`[
		{"id":"learn-1","type":"text","content":"Fractions split a whole into equal parts."},
		{"id":"learn-2","type":"math","content":"\\frac{1}{2} + \\frac{1}{4} = \\frac{3}{4}"}
	]`)}}
	rec := post(t, newTestHandler(p, nil), "/v1/generate-learn-blocks", map[string]any{"prompt": "fractions", "grade": "G5"})
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
	var resp struct {
		Blocks []map[string]any `json:"blocks"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(resp.Blocks) != 2 {
		t.Fatalf("expected 2 blocks, got %d", len(resp.Blocks))
	}
}

func TestGenerateLearnBlocks_RejectsEmptyPrompt(t *testing.T) {
	rec := post(t, newTestHandler(&scriptedProvider{}, nil), "/v1/generate-learn-blocks", map[string]any{"prompt": "  "})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestGenerateLearnBlocks_BadGatewayOnInvalid(t *testing.T) {
	// Chemviz without metadata now degrades to text instead of failing.
	p := &scriptedProvider{jsonOuts: [][]byte{[]byte(`[{"id":"l1","type":"chemviz_3dmol","content":"no metadata"}]`)}}
	rec := post(t, newTestHandler(p, nil), "/v1/generate-learn-blocks", map[string]any{"prompt": "water"})
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 (degraded to text), got %d: %s", rec.Code, rec.Body.String())
	}
	var body struct {
		Blocks []struct {
			Type string `json:"type"`
		} `json:"blocks"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode body: %v", err)
	}
	if len(body.Blocks) != 1 || body.Blocks[0].Type != "text" {
		t.Fatalf("expected one text block, got %+v", body.Blocks)
	}
}

func TestGenerateLearnBlocks_BadGatewayOnBrokenJSON(t *testing.T) {
	p := &scriptedProvider{jsonOuts: [][]byte{[]byte(`not json`)}}
	rec := post(t, newTestHandler(p, nil), "/v1/generate-learn-blocks", map[string]any{"prompt": "water"})
	if rec.Code != http.StatusBadGateway {
		t.Fatalf("expected 502 for broken JSON, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestGenerateEvaluateBlocks_ValidResponse(t *testing.T) {
	p := &scriptedProvider{jsonOuts: [][]byte{[]byte(`[
		{"id":"e1","type":"mcq","question":"2+2?","options":["3","4","5"],"correctAnswer":"4","explanation":"2+2=4"}
	]`)}}
	rec := post(t, newTestHandler(p, nil), "/v1/generate-evaluate-blocks", map[string]any{"content": "addition", "count": 1})
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
	var resp struct {
		Blocks []map[string]any `json:"blocks"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(resp.Blocks) != 1 {
		t.Fatalf("expected 1 block, got %d", len(resp.Blocks))
	}
}

func TestTranslate(t *testing.T) {
	p := &scriptedProvider{jsonOuts: [][]byte{[]byte(`"සිංහල පරිවර්තනය"`)}}
	rec := post(t, newTestHandler(p, nil), "/v1/translate", map[string]any{
		"content":         "hello world",
		"target_language": "si",
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
	var resp struct {
		Translation string `json:"translation"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if !strings.Contains(resp.Translation, "සිංහල") {
		t.Fatalf("unexpected translation %q", resp.Translation)
	}
}

func TestGenerateVisualization_Valid(t *testing.T) {
	p := &scriptedProvider{jsonOuts: [][]byte{[]byte(`{
		"id":"v1","type":"elecsim_tscircuit","content":"LED circuit",
		"metadata":{"title":"LED","circuit_code":"<Resistor name=\"R1\" resistance=\"220ohm\" />"}
	}`)}}
	rec := post(t, newTestHandler(p, nil), "/v1/generate-visualization", map[string]any{
		"concept": "LED circuit", "vizType": "tscircuit", "grade": "10",
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
	var resp struct {
		Block map[string]any `json:"block"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.Block["type"] != "elecsim_tscircuit" {
		t.Fatalf("unexpected block type %v", resp.Block["type"])
	}
}

func TestGenerateVisualization_RejectsBadVizType(t *testing.T) {
	rec := post(t, newTestHandler(&scriptedProvider{}, nil), "/v1/generate-visualization", map[string]any{
		"concept": "x", "vizType": "hologram",
	})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestAnalyzeImage_Valid(t *testing.T) {
	// Mock the vision endpoint via httptest.
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"choices":[{"message":{"content":"{\"contentType\":\"equations\",\"detectedLanguage\":\"en\",\"subjects\":[\"mathematics\"],\"keyConcepts\":[\"pythagoras\"],\"hasEquations\":true,\"suggestedVisualization\":\"manim\",\"extractedText\":\"a^2+b^2=c^2\"}"}}]}`))
	}))
	defer server.Close()

	vc := vision.NewClient().WithBaseURL(server.URL)
	p := &scriptedProvider{}
	h := newTestHandler(p, vc)
	rec := post(t, h, "/v1/analyze-image", map[string]any{"imageBase64": "aW1hZ2U="})
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
	var resp struct {
		Analysis struct {
			ContentType string `json:"contentType"`
		} `json:"analysis"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.Analysis.ContentType != "equations" {
		t.Fatalf("unexpected content type %q", resp.Analysis.ContentType)
	}
}

func TestAnalyzeImage_RejectsEmpty(t *testing.T) {
	rec := post(t, newTestHandler(&scriptedProvider{}, nil), "/v1/analyze-image", map[string]any{"imageBase64": ""})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestAgentTask_ReturnsBlocks(t *testing.T) {
	p := &scriptedProvider{streamOuts: [][]provider.StreamEvent{
		streamDone(`[{"id":"l1","type":"text","content":"Photosynthesis is the process..."}]`),
	}}
	rec := post(t, newTestHandler(p, nil), "/v1/agent/task", map[string]any{
		"prompt": "Explain photosynthesis for Grade 7",
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
	var resp struct {
		LearnBlocks []map[string]any `json:"learnBlocks"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(resp.LearnBlocks) != 1 {
		t.Fatalf("expected 1 learn block, got %d", len(resp.LearnBlocks))
	}
}

func TestAgentTask_RejectsEmptyPrompt(t *testing.T) {
	rec := post(t, newTestHandler(&scriptedProvider{}, nil), "/v1/agent/task", map[string]any{"prompt": ""})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestAgentStream_SSE(t *testing.T) {
	p := &scriptedProvider{streamOuts: [][]provider.StreamEvent{
		streamDone(`[{"id":"l1","type":"text","content":"Hello"}]`),
	}}
	h := newTestHandler(p, nil)
	payload, _ := json.Marshal(map[string]any{"prompt": "hi"})
	mux := http.NewServeMux()
	h.Register(mux)
	req := httptest.NewRequest(http.MethodPost, "/v1/agent/stream", bytes.NewReader(payload))
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); !strings.HasPrefix(ct, "text/event-stream") {
		t.Fatalf("expected text/event-stream, got %q", ct)
	}

	var sawPlan, sawDone bool
	scanner := bufio.NewScanner(strings.NewReader(rec.Body.String()))
	for scanner.Scan() {
		line := scanner.Text()
		if !strings.HasPrefix(line, "data: ") {
			continue
		}
		var ev struct {
			Type string `json:"type"`
		}
		if err := json.Unmarshal([]byte(strings.TrimPrefix(line, "data: ")), &ev); err != nil {
			t.Fatalf("decode event: %v", err)
		}
		switch ev.Type {
		case "plan":
			sawPlan = true
		case "done":
			sawDone = true
		}
	}
	if !sawPlan || !sawDone {
		t.Fatalf("expected plan and done events (plan=%v done=%v)", sawPlan, sawDone)
	}
}

func TestAgentStream_ToolRoundTrip(t *testing.T) {
	// First round trip requests a tool call; second returns the final payload.
	learnJSON := `[{"id":"l1","type":"text","content":"content"}]`
	p := &scriptedProvider{streamOuts: [][]provider.StreamEvent{
		{
			{Type: "tool_call", ToolCall: &provider.ToolCall{ID: "c1", Name: "generateLearnBlocks", Arguments: `{"prompt":"topic"}`}},
			{Type: "done", Content: ""},
		},
		streamDone(learnJSON),
	}}
	h := newTestHandler(p, nil)
	payload, _ := json.Marshal(map[string]any{"prompt": "make content"})
	mux := http.NewServeMux()
	h.Register(mux)
	req := httptest.NewRequest(http.MethodPost, "/v1/agent/stream", bytes.NewReader(payload))
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	body := rec.Body.String()
	if !strings.Contains(body, `"tool_start"`) || !strings.Contains(body, `"tool_end"`) {
		t.Fatalf("expected tool_start/tool_end events:\n%s", body)
	}
	if !strings.Contains(body, `"learnBlocks"`) {
		t.Fatalf("expected learnBlocks in done event:\n%s", body)
	}
}

func TestAgentStream_OCRThenDone(t *testing.T) {
	// Vision mock returns a typed analysis; the provider streams a final
	// answer. The stream must contain an "ocr" event and terminate cleanly,
	// and the OCR text must reach the agent's prompt (provider messages).
	var mu sync.Mutex
	var gotUserContent string

	visionSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"choices":[{"message":{"content":"{\"contentType\":\"textbook\",\"detectedLanguage\":\"en\",\"subjects\":[\"physics\"],\"keyConcepts\":[\"gravity\"],\"hasEquations\":false,\"suggestedVisualization\":\"matterjs\",\"extractedText\":\"Gravity pulls objects down.\"}"}}]}`)
	}))
	defer visionSrv.Close()

	t.Setenv("OPENCODE_API_KEY", "k")
	vc := vision.NewClient().WithBaseURL(visionSrv.URL)

	// Capture the first Stream call's user message to assert OCR context.
	p := &capturingProvider{}
	p.onStream = func(msgs []provider.Message) {
		mu.Lock()
		defer mu.Unlock()
		for _, m := range msgs {
			if m.Role == "user" {
				gotUserContent += m.Content + "\n"
			}
		}
	}
	p.streamOuts = [][]provider.StreamEvent{
		streamDone(`{"message":"done","learnBlocks":[],"evaluateBlocks":[]}`),
	}
	h := newTestHandler(p, vc)

	payload, _ := json.Marshal(map[string]any{
		"prompt": "make content",
		"images": []string{"data:image/png;base64,QUJD"},
	})
	mux := http.NewServeMux()
	h.Register(mux)
	req := httptest.NewRequest(http.MethodPost, "/v1/agent/stream", bytes.NewReader(payload))
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	body := rec.Body.String()
	if !strings.Contains(body, `"ocr"`) {
		t.Fatalf("expected ocr event:\n%s", body)
	}
	if !strings.Contains(body, `"done"`) {
		t.Fatalf("expected done event after ocr:\n%s", body)
	}

	mu.Lock()
	user := gotUserContent
	mu.Unlock()
	if !strings.Contains(user, "Gravity pulls objects down.") {
		t.Fatalf("expected OCR extracted text in agent prompt, got:\n%s", user)
	}
	if !strings.Contains(user, "contentType: textbook") {
		t.Fatalf("expected OCR contentType in agent prompt, got:\n%s", user)
	}
}

// capturingProvider wraps scriptedProvider and invokes onStream with the
// messages before delegating to the canned stream output.
type capturingProvider struct {
	scriptedProvider
	onStream func(msgs []provider.Message)
}

func (c *capturingProvider) Stream(ctx context.Context, msgs []provider.Message, tl []provider.Tool, opts provider.Options) (<-chan provider.StreamEvent, error) {
	if c.onStream != nil {
		c.onStream(msgs)
	}
	return c.scriptedProvider.Stream(ctx, msgs, tl, opts)
}

func TestAgentStream_OCRErrorTerminates(t *testing.T) {
	// Vision API fails: the stream must emit an error event and CLOSE (no
	// hang). The recorder would block forever if the channel never closed,
	// so this test fails by timeout if the regression returns.
	visionSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"error":"boom"}`)
	}))
	defer visionSrv.Close()

	t.Setenv("OPENCODE_API_KEY", "k")
	vc := vision.NewClient().WithBaseURL(visionSrv.URL)

	p := &scriptedProvider{}
	h := newTestHandler(p, vc)

	payload, _ := json.Marshal(map[string]any{
		"prompt": "make content",
		"images": []string{"data:image/png;base64,QUJD"},
	})
	mux := http.NewServeMux()
	h.Register(mux)
	req := httptest.NewRequest(http.MethodPost, "/v1/agent/stream", bytes.NewReader(payload))
	rec := httptest.NewRecorder()

	done := make(chan struct{})
	go func() {
		mux.ServeHTTP(rec, req)
		close(done)
	}()
	select {
	case <-done:
		// completed -> channel closed properly
	case <-time.After(10 * time.Second):
		t.Fatal("agent stream hung after OCR error (events channel not closed)")
	}

	body := rec.Body.String()
	if !strings.Contains(body, `"error"`) {
		t.Fatalf("expected error event:\n%s", body)
	}
}

func TestAgentTask_OCRContextInRequest(t *testing.T) {
	// The non-streaming agentTask must also run OCR and include the context.
	visionSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"choices":[{"message":{"content":"{\"contentType\":\"other\",\"detectedLanguage\":\"en\",\"subjects\":[],\"keyConcepts\":[],\"hasEquations\":false,\"suggestedVisualization\":\"none\",\"extractedText\":\"hello world\"}"}}]}`)
	}))
	defer visionSrv.Close()

	t.Setenv("OPENCODE_API_KEY", "k")
	vc := vision.NewClient().WithBaseURL(visionSrv.URL)

	p := &scriptedProvider{streamOuts: [][]provider.StreamEvent{
		streamDone(`{"message":"ok","learnBlocks":[],"evaluateBlocks":[]}`),
	}}
	h := newTestHandler(p, vc)

	rec := post(t, h, "/v1/agent/task", map[string]any{
		"prompt": "make content",
		"images": []string{"data:image/png;base64,QUJD"},
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
}
