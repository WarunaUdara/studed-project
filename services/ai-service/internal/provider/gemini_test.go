package provider

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

func TestGeminiGenerateJSON(t *testing.T) {
	var mu sync.Mutex
	var gotBody geminiRequest
	var gotKey string

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotKey = r.Header.Get("x-goog-api-key")
		body, _ := io.ReadAll(r.Body)
		mu.Lock()
		_ = json.Unmarshal(body, &gotBody)
		mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"candidates":[{"content":{"parts":[{"text":"{\"ok\":true}"}]}}]}`)
	}))
	defer srv.Close()

	c := NewGeminiClient("test-key", "gemini-2.5-flash").WithBaseURL(srv.URL)

	out, err := c.GenerateJSON(context.Background(), "system prompt", "user prompt", JSONOptions())
	if err != nil {
		t.Fatalf("GenerateJSON: %v", err)
	}
	if string(out) != `{"ok":true}` {
		t.Fatalf("unexpected output %q", string(out))
	}
	if gotKey != "test-key" {
		t.Errorf("api key header = %q", gotKey)
	}
	if gotBody.SystemInstruction == nil || gotBody.SystemInstruction.Parts[0].Text != "system prompt" {
		t.Errorf("system instruction = %+v", gotBody.SystemInstruction)
	}
	if len(gotBody.Contents) != 1 || gotBody.Contents[0].Role != "user" || gotBody.Contents[0].Parts[0].Text != "user prompt" {
		t.Errorf("contents = %+v", gotBody.Contents)
	}
	if gotBody.GenerationConfig.ResponseMimeType != "application/json" {
		t.Errorf("response mime type = %q, want application/json", gotBody.GenerationConfig.ResponseMimeType)
	}
	if gotBody.GenerationConfig.Temperature != 0.4 || gotBody.GenerationConfig.MaxOutputTokens != 8192 {
		t.Errorf("temperature/max tokens = %v/%d, want 0.4/8192",
			gotBody.GenerationConfig.Temperature, gotBody.GenerationConfig.MaxOutputTokens)
	}
}

func TestGeminiRejectsOverlongPrompt(t *testing.T) {
	c := NewGeminiClient("k", "gemini-2.5-flash")
	_, err := c.GenerateJSON(context.Background(), "", strings.Repeat("a", 8001), JSONOptions())
	if err == nil {
		t.Fatal("expected error for overlong prompt")
	}
	if !strings.Contains(err.Error(), "8000") {
		t.Errorf("error = %v, want mention of the 8000-char limit", err)
	}
}

func TestGeminiAPIError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"error":{"message":"API key invalid"}}`)
	}))
	defer srv.Close()

	c := NewGeminiClient("bad-key", "gemini-2.5-flash").WithBaseURL(srv.URL)
	_, err := c.GenerateJSON(context.Background(), "", "hi", JSONOptions())
	if err == nil || !strings.Contains(err.Error(), "API key invalid") {
		t.Fatalf("expected API error, got %v", err)
	}
}

func TestGeminiNoCandidates(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, `{"candidates":[]}`)
	}))
	defer srv.Close()

	c := NewGeminiClient("k", "gemini-2.5-flash").WithBaseURL(srv.URL)
	if _, err := c.GenerateJSON(context.Background(), "", "hi", JSONOptions()); err == nil {
		t.Fatal("expected error for empty candidates")
	}
}

func TestGeminiStream(t *testing.T) {
	var gotConfig geminiGenerationConfig
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		var req geminiRequest
		_ = json.Unmarshal(body, &req)
		gotConfig = req.GenerationConfig
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"candidates":[{"content":{"parts":[{"text":"Hello from gemini"}]}}]}`)
	}))
	defer srv.Close()

	c := NewGeminiClient("k", "gemini-2.5-flash").WithBaseURL(srv.URL)
	ch, err := c.Stream(context.Background(), []Message{
		{Role: "system", Content: "be terse"},
		{Role: "user", Content: "hi"},
	}, nil, DefaultOptions())
	if err != nil {
		t.Fatalf("Stream: %v", err)
	}

	var deltas []string
	var final, errMsg string
	for ev := range ch {
		switch ev.Type {
		case "text_delta":
			deltas = append(deltas, ev.Delta)
		case "done":
			final = ev.Content
		case "error":
			errMsg = ev.Error.Error()
		}
	}
	if errMsg != "" {
		t.Fatalf("unexpected error event: %s", errMsg)
	}
	if len(deltas) != 1 || deltas[0] != "Hello from gemini" {
		t.Errorf("deltas = %+v", deltas)
	}
	if final != "Hello from gemini" {
		t.Errorf("final content = %q", final)
	}
	if gotConfig.ResponseMimeType != "" {
		t.Errorf("expected no response mime type for plain stream, got %q", gotConfig.ResponseMimeType)
	}
}

func TestGeminiStreamJSONMode(t *testing.T) {
	var gotConfig geminiGenerationConfig
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		var req geminiRequest
		_ = json.Unmarshal(body, &req)
		gotConfig = req.GenerationConfig
		fmt.Fprint(w, `{"candidates":[{"content":{"parts":[{"text":"{}"}]}}]}`)
	}))
	defer srv.Close()

	c := NewGeminiClient("k", "gemini-2.5-flash").WithBaseURL(srv.URL)
	ch, err := c.Stream(context.Background(), []Message{{Role: "user", Content: "json please"}}, nil, JSONOptions())
	if err != nil {
		t.Fatalf("Stream: %v", err)
	}
	for ev := range ch {
		if ev.Type == "error" {
			t.Fatalf("unexpected error event: %v", ev.Error)
		}
	}
	if gotConfig.ResponseMimeType != "application/json" {
		t.Errorf("response mime type = %q, want application/json", gotConfig.ResponseMimeType)
	}
}

func TestGeminiStreamFlattensConversation(t *testing.T) {
	var gotBody geminiRequest
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		_ = json.Unmarshal(body, &gotBody)
		fmt.Fprint(w, `{"candidates":[{"content":{"parts":[{"text":"ok"}]}}]}`)
	}))
	defer srv.Close()

	c := NewGeminiClient("k", "gemini-2.5-flash").WithBaseURL(srv.URL)
	ch, err := c.Stream(context.Background(), []Message{
		{Role: "system", Content: "be terse"},
		{Role: "user", Content: "hello"},
		{Role: "assistant", Content: "hi there"},
		{Role: "user", Content: "again"},
	}, nil, DefaultOptions())
	if err != nil {
		t.Fatalf("Stream: %v", err)
	}
	for ev := range ch {
		if ev.Type == "error" {
			t.Fatalf("unexpected error event: %v", ev.Error)
		}
	}
	if gotBody.SystemInstruction == nil || gotBody.SystemInstruction.Parts[0].Text != "be terse" {
		t.Errorf("system instruction = %+v", gotBody.SystemInstruction)
	}
	if len(gotBody.Contents) != 1 {
		t.Fatalf("contents = %+v, want exactly one flattened user turn", gotBody.Contents)
	}
	want := "User: hello\nAssistant: hi there\nUser: again"
	if got := gotBody.Contents[0].Parts[0].Text; got != want {
		t.Errorf("flattened prompt = %q, want %q", got, want)
	}
}

func TestGeminiConcurrentUse(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"candidates":[{"content":{"parts":[{"text":"{}"}]}}]}`)
	}))
	defer srv.Close()

	c := NewGeminiClient("k", "gemini-2.5-flash").WithBaseURL(srv.URL)

	var wg sync.WaitGroup
	errs := make(chan error, 16)
	for i := 0; i < 16; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if _, err := c.GenerateJSON(context.Background(), "s", "u", JSONOptions()); err != nil {
				errs <- err
			}
		}()
	}
	wg.Wait()
	close(errs)
	for err := range errs {
		t.Errorf("concurrent GenerateJSON: %v", err)
	}
}
