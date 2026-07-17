package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
)

// mockGenerator returns canned responses, simulating Gemini output so the
// eval suite runs without an API key.
type mockGenerator struct {
	jsonResponses []string
	textResponse  string
	calls         int
}

func (m *mockGenerator) GenerateJSON(ctx context.Context, systemPrompt, userPrompt string) ([]byte, error) {
	if m.calls >= len(m.jsonResponses) {
		return nil, fmt.Errorf("no more mock responses")
	}
	resp := m.jsonResponses[m.calls]
	m.calls++
	return []byte(resp), nil
}

func (m *mockGenerator) GenerateText(ctx context.Context, systemPrompt, userPrompt string) (string, error) {
	return m.textResponse, nil
}

func newTestHandler(gen *mockGenerator) *Handler {
	return New(gen, slog.Default())
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
	gen := &mockGenerator{jsonResponses: []string{
		`[{"id":"learn-1","type":"text","content":"Fractions split a whole into equal parts."},
		  {"id":"learn-2","type":"math","content":"\\frac{1}{2} + \\frac{1}{4} = \\frac{3}{4}"}]`,
	}}
	rec := post(t, newTestHandler(gen), "/v1/generate-learn-blocks", map[string]any{"prompt": "fractions", "grade": "G5"})
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
	var resp struct {
		Blocks []map[string]any `json:"blocks"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid response JSON: %v", err)
	}
	if len(resp.Blocks) != 2 {
		t.Fatalf("expected 2 blocks, got %d", len(resp.Blocks))
	}
}

func TestGenerateLearnBlocks_RetriesOnInvalidThenSucceeds(t *testing.T) {
	gen := &mockGenerator{jsonResponses: []string{
		`{"not":"an array"}`,
		`[{"id":"learn-1","type":"text","content":"Valid on retry."}]`,
	}}
	rec := post(t, newTestHandler(gen), "/v1/generate-learn-blocks", map[string]any{"prompt": "algebra"})
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 after retry, got %d: %s", rec.Code, rec.Body.String())
	}
	if gen.calls != 2 {
		t.Fatalf("expected 2 generation attempts, got %d", gen.calls)
	}
}

func TestGenerateEvaluateBlocks_RejectsMcqWithBadCorrectAnswer(t *testing.T) {
	invalid := `[{"id":"eval-1","type":"mcq","question":"2+2?","options":["3","5"],"correctAnswer":"4"}]`
	gen := &mockGenerator{jsonResponses: []string{invalid, invalid}}
	rec := post(t, newTestHandler(gen), "/v1/generate-evaluate-blocks", map[string]any{"content": "arithmetic"})
	if rec.Code != http.StatusBadGateway {
		t.Fatalf("expected 502 for persistent invalid output, got %d", rec.Code)
	}
}

func TestGenerateEvaluateBlocks_ValidMcq(t *testing.T) {
	gen := &mockGenerator{jsonResponses: []string{
		`[{"id":"eval-1","type":"mcq","question":"2+2?","options":["3","4","5","6"],"correctAnswer":"4","explanation":"Adding 2 and 2 gives 4."}]`,
	}}
	rec := post(t, newTestHandler(gen), "/v1/generate-evaluate-blocks", map[string]any{"content": "arithmetic", "count": 1})
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestTranslate(t *testing.T) {
	gen := &mockGenerator{textResponse: "භාග යනු සමාන කොටස් වලට බෙදීමකි."}
	rec := post(t, newTestHandler(gen), "/v1/translate", map[string]any{"content": "Fractions divide a whole.", "target_language": "Sinhala"})
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
	var resp struct {
		Translation string `json:"translation"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil || resp.Translation == "" {
		t.Fatalf("expected non-empty translation, got %s", rec.Body.String())
	}
}

func TestBadRequests(t *testing.T) {
	h := newTestHandler(&mockGenerator{})
	if rec := post(t, h, "/v1/generate-learn-blocks", map[string]any{}); rec.Code != http.StatusBadRequest {
		t.Errorf("learn: expected 400, got %d", rec.Code)
	}
	if rec := post(t, h, "/v1/generate-evaluate-blocks", map[string]any{}); rec.Code != http.StatusBadRequest {
		t.Errorf("evaluate: expected 400, got %d", rec.Code)
	}
	if rec := post(t, h, "/v1/translate", map[string]any{"content": "x"}); rec.Code != http.StatusBadRequest {
		t.Errorf("translate: expected 400, got %d", rec.Code)
	}
}
