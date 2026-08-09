package vision

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
)

// decodeRequest is the decoded chat request body captured by the mock server.
type decodeRequest struct {
	Model           string          `json:"model"`
	Messages        []decodeMessage `json:"messages"`
	ResponseFormat  *responseFormat `json:"response_format"`
	ReasoningEffort string          `json:"reasoning_effort"`
}

type decodeMessage struct {
	Role    string `json:"role"`
	Content any    `json:"content"`
}

func TestAnalyzeImageSendsMultimodalRequest(t *testing.T) {
	var mu sync.Mutex
	var got decodeRequest
	var gotAuth string

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/chat/completions" {
			t.Errorf("unexpected path %q", r.URL.Path)
		}
		gotAuth = r.Header.Get("Authorization")
		body, err := io.ReadAll(r.Body)
		if err != nil {
			t.Errorf("read body: %v", err)
		}
		mu.Lock()
		defer mu.Unlock()
		if err := json.Unmarshal(body, &got); err != nil {
			t.Errorf("decode body: %v", err)
		}
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"choices":[{"message":{"content":"{\"contentType\":\"equations\",\"detectedLanguage\":\"en\",\"subjects\":[\"mathematics\"],\"keyConcepts\":[\"quadratic formula\"],\"hasEquations\":true,\"suggestedVisualization\":\"manim\",\"extractedText\":\"x = (-b ...)\"}"}}]}`)
	}))
	defer srv.Close()

	t.Setenv("OPENCODE_API_KEY", "test-key")
	c := NewClient().WithBaseURL(srv.URL)

	analysis, err := c.AnalyzeImage(context.Background(), "QUJD", "Extract the equations")
	if err != nil {
		t.Fatalf("AnalyzeImage: %v", err)
	}

	if gotAuth != "Bearer test-key" {
		t.Errorf("auth header = %q, want %q", gotAuth, "Bearer test-key")
	}
	if got.Model != "qwen3.7-plus" {
		t.Errorf("model = %q, want qwen3.7-plus", got.Model)
	}
	if got.ResponseFormat == nil || got.ResponseFormat.Type != "json_object" {
		t.Errorf("response_format = %+v, want json_object", got.ResponseFormat)
	}
	if len(got.Messages) != 2 {
		t.Fatalf("messages = %+v, want 2", got.Messages)
	}
	if got.Messages[0].Role != "system" {
		t.Errorf("first message role = %q", got.Messages[0].Role)
	}
	sys, ok := got.Messages[0].Content.(string)
	if !ok {
		t.Fatalf("system content type = %T, want string", got.Messages[0].Content)
	}
	if !strings.Contains(sys, "curriculum analyst for StudEd") {
		t.Errorf("system prompt missing curriculum analyst persona: %q", sys)
	}
	if !strings.Contains(sys, "suggestedVisualization") {
		t.Errorf("system prompt missing schema: %q", sys)
	}

	if got.Messages[1].Role != "user" {
		t.Errorf("second message role = %q", got.Messages[1].Role)
	}
	parts, ok := got.Messages[1].Content.([]any)
	if !ok {
		t.Fatalf("user content type = %T, want []any", got.Messages[1].Content)
	}
	if len(parts) != 2 {
		t.Fatalf("user content parts = %d, want 2", len(parts))
	}
	textPart, ok := parts[0].(map[string]any)
	if !ok {
		t.Fatalf("first part type = %T, want map", parts[0])
	}
	if textPart["type"] != "text" || textPart["text"] != "Extract the equations" {
		t.Errorf("text part = %+v", textPart)
	}
	imgPart, ok := parts[1].(map[string]any)
	if !ok {
		t.Fatalf("second part type = %T, want map", parts[1])
	}
	if imgPart["type"] != "image_url" {
		t.Errorf("image part type = %v", imgPart["type"])
	}
	imgURL, ok := imgPart["image_url"].(map[string]any)
	if !ok {
		t.Fatalf("image_url = %+v", imgPart["image_url"])
	}
	if imgURL["url"] != "data:image/jpeg;base64,QUJD" {
		t.Errorf("image url = %v, want data:image/jpeg;base64,QUJD", imgURL["url"])
	}

	if analysis.ContentType != "equations" {
		t.Errorf("contentType = %q", analysis.ContentType)
	}
	if analysis.DetectedLanguage != "en" {
		t.Errorf("detectedLanguage = %q", analysis.DetectedLanguage)
	}
	if len(analysis.Subjects) != 1 || analysis.Subjects[0] != "mathematics" {
		t.Errorf("subjects = %+v", analysis.Subjects)
	}
	if !analysis.HasEquations {
		t.Error("hasEquations = false, want true")
	}
	if analysis.SuggestedVisualization != "manim" {
		t.Errorf("suggestedVisualization = %q", analysis.SuggestedVisualization)
	}
}

func TestAnalyzeImageKeepsExistingDataURLPrefix(t *testing.T) {
	var got decodeRequest
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		_ = json.Unmarshal(body, &got)
		fmt.Fprint(w, `{"choices":[{"message":{"content":"{\"contentType\":\"other\"}"}}]}`)
	}))
	defer srv.Close()

	t.Setenv("OPENCODE_API_KEY", "k")
	c := NewClient().WithBaseURL(srv.URL)

	if _, err := c.AnalyzeImage(context.Background(), "data:image/png;base64,WFla", ""); err != nil {
		t.Fatalf("AnalyzeImage: %v", err)
	}
	parts := got.Messages[1].Content.([]any)
	imgURL := parts[1].(map[string]any)["image_url"].(map[string]any)
	if imgURL["url"] != "data:image/png;base64,WFla" {
		t.Errorf("image url = %v, prefix must not be doubled", imgURL["url"])
	}
}

func TestAnalyzeImageUsesDefaultPromptWhenEmpty(t *testing.T) {
	var got decodeRequest
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		_ = json.Unmarshal(body, &got)
		fmt.Fprint(w, `{"choices":[{"message":{"content":"{\"contentType\":\"diagram\"}"}}]}`)
	}))
	defer srv.Close()

	t.Setenv("OPENCODE_API_KEY", "k")
	c := NewClient().WithBaseURL(srv.URL)

	if _, err := c.AnalyzeImage(context.Background(), "QUJD", "  "); err != nil {
		t.Fatalf("AnalyzeImage: %v", err)
	}
	parts := got.Messages[1].Content.([]any)
	text := parts[0].(map[string]any)["text"].(string)
	if text != defaultPrompt {
		t.Errorf("prompt = %q, want default %q", text, defaultPrompt)
	}
}

func TestAnalyzeImageHTTPError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, `{"error":{"message":"boom"}}`, http.StatusInternalServerError)
	}))
	defer srv.Close()

	t.Setenv("OPENCODE_API_KEY", "k")
	c := NewClient().WithBaseURL(srv.URL)

	_, err := c.AnalyzeImage(context.Background(), "QUJD", "analyze")
	if err == nil {
		t.Fatal("expected error for 500 response")
	}
	if !strings.Contains(err.Error(), "500") || !strings.Contains(err.Error(), "boom") {
		t.Errorf("error should carry status and body snippet: %v", err)
	}
}

func TestAnalyzeImageRejectsNonJSONModelOutput(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, `{"choices":[{"message":{"content":"not json at all"}}]}`)
	}))
	defer srv.Close()

	t.Setenv("OPENCODE_API_KEY", "k")
	c := NewClient().WithBaseURL(srv.URL)

	_, err := c.AnalyzeImage(context.Background(), "QUJD", "analyze")
	if err == nil {
		t.Fatal("expected error for non-JSON model output")
	}
	if !strings.Contains(err.Error(), "not valid JSON") {
		t.Errorf("error = %v", err)
	}
}

func TestAnalyzeImageEmptyContent(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, `{"choices":[{"message":{"content":"  "}}]}`)
	}))
	defer srv.Close()

	t.Setenv("OPENCODE_API_KEY", "k")
	c := NewClient().WithBaseURL(srv.URL)

	if _, err := c.AnalyzeImage(context.Background(), "QUJD", "analyze"); err == nil {
		t.Fatal("expected error for empty model content")
	}
}

func TestAnalyzeImageNoChoices(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, `{"choices":[]}`)
	}))
	defer srv.Close()

	t.Setenv("OPENCODE_API_KEY", "k")
	c := NewClient().WithBaseURL(srv.URL)

	_, err := c.AnalyzeImage(context.Background(), "QUJD", "analyze")
	if err == nil {
		t.Fatal("expected error for empty choices")
	}
	if !strings.Contains(err.Error(), "no choices") {
		t.Errorf("error = %v", err)
	}
}

func TestAnalyzeImageEmptyImage(t *testing.T) {
	t.Setenv("OPENCODE_API_KEY", "k")
	c := NewClient()
	if _, err := c.AnalyzeImage(context.Background(), "   ", "analyze"); err == nil {
		t.Fatal("expected error for empty image data")
	}
}

func TestAnalyzeImageModelEnvOverride(t *testing.T) {
	var got decodeRequest
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		_ = json.Unmarshal(body, &got)
		fmt.Fprint(w, `{"choices":[{"message":{"content":"{\"contentType\":\"other\"}"}}]}`)
	}))
	defer srv.Close()

	t.Setenv("OPENCODE_API_KEY", "k")
	t.Setenv("OPENCODE_VISION_MODEL", "custom-vision-model")
	c := NewClient().WithBaseURL(srv.URL)

	if _, err := c.AnalyzeImage(context.Background(), "QUJD", ""); err != nil {
		t.Fatalf("AnalyzeImage: %v", err)
	}
	if got.Model != "custom-vision-model" {
		t.Errorf("model = %q, want custom-vision-model", got.Model)
	}
}

func TestAnalyzeImagesSendsAllImagesWithHighEffort(t *testing.T) {
	var got decodeRequest
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		if err := json.Unmarshal(body, &got); err != nil {
			t.Errorf("decode body: %v", err)
		}
		fmt.Fprint(w, `{"choices":[{"message":{"content":"{\"contentType\":\"handwritten_notes\",\"detectedLanguage\":\"en\",\"subjects\":[\"physics\"],\"keyConcepts\":[\"pendulum\"],\"hasEquations\":false,\"suggestedVisualization\":\"matterjs\",\"extractedText\":\"T = 2pi sqrt(L/g)\"}"}}]}`)
	}))
	defer srv.Close()

	t.Setenv("OPENCODE_API_KEY", "k")
	c := NewClient().WithBaseURL(srv.URL)

	analysis, err := c.AnalyzeImages(context.Background(), []string{"QUJD", "data:image/png;base64,REVG"}, "extract")
	if err != nil {
		t.Fatalf("AnalyzeImages: %v", err)
	}
	if analysis.ExtractedText != "T = 2pi sqrt(L/g)" {
		t.Errorf("extracted text = %q", analysis.ExtractedText)
	}

	if got.ReasoningEffort != "high" {
		t.Errorf("reasoning_effort = %q, want high (OCR high-effort default)", got.ReasoningEffort)
	}
	userMsg := got.Messages[1]
	parts, ok := userMsg.Content.([]any)
	if !ok {
		t.Fatalf("user content type = %T, want []any", userMsg.Content)
	}
	// text + 2 images
	if len(parts) != 3 {
		t.Fatalf("parts = %d, want 3", len(parts))
	}
	imgParts := 0
	for _, p := range parts {
		m := p.(map[string]any)
		if m["type"] == "image_url" {
			imgParts++
			url, _ := m["image_url"].(map[string]any)["url"].(string)
			if !strings.HasPrefix(url, "data:image") {
				t.Errorf("image url missing data prefix: %q", url)
			}
		}
	}
	if imgParts != 2 {
		t.Errorf("image parts = %d, want 2", imgParts)
	}
}

func TestAnalyzeImagesRejectsEmptyInput(t *testing.T) {
	t.Setenv("OPENCODE_API_KEY", "k")
	c := NewClient()
	if _, err := c.AnalyzeImages(context.Background(), nil, "extract"); err == nil {
		t.Fatal("expected error for no images")
	}
	if _, err := c.AnalyzeImages(context.Background(), []string{"", "QUJD"}, "extract"); err == nil {
		t.Fatal("expected error for empty image element")
	}
}
