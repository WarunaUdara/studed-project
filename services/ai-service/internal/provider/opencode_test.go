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
	"time"
)

func TestOpenCodeGenerateJSON(t *testing.T) {
	var mu sync.Mutex
	var gotBody chatRequest
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
		if err := json.Unmarshal(body, &gotBody); err != nil {
			t.Errorf("decode body: %v", err)
		}
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"choices":[{"message":{"content":"{\"ok\":true}"}}]}`)
	}))
	defer srv.Close()

	t.Setenv("OPENCODE_API_KEY", "test-key")
	c := NewOpenCodeClient().WithBaseURL(srv.URL)

	out, err := c.GenerateJSON(context.Background(), "system prompt", "user prompt", JSONOptions())
	if err != nil {
		t.Fatalf("GenerateJSON: %v", err)
	}
	if string(out) != `{"ok":true}` {
		t.Fatalf("unexpected output %q", string(out))
	}
	if gotAuth != "Bearer test-key" {
		t.Errorf("auth header = %q, want %q", gotAuth, "Bearer test-key")
	}
	if gotBody.Model != "deepseek-v4-flash" {
		t.Errorf("model = %q, want deepseek-v4-flash", gotBody.Model)
	}
	if gotBody.Stream {
		t.Error("expected stream=false for GenerateJSON")
	}
	if gotBody.ResponseFormat == nil || gotBody.ResponseFormat.Type != "json_object" {
		t.Errorf("response_format = %+v, want json_object", gotBody.ResponseFormat)
	}
	if gotBody.Temperature != 0.4 || gotBody.MaxTokens != 2048 {
		t.Errorf("temperature/max_tokens = %v/%d, want 0.4/2048", gotBody.Temperature, gotBody.MaxTokens)
	}
	if len(gotBody.Messages) != 2 {
		t.Fatalf("messages = %+v", gotBody.Messages)
	}
	if gotBody.Messages[0].Role != "system" || gotBody.Messages[0].Content != "system prompt" {
		t.Errorf("first message = %+v", gotBody.Messages[0])
	}
	if gotBody.Messages[1].Role != "user" || gotBody.Messages[1].Content != "user prompt" {
		t.Errorf("second message = %+v", gotBody.Messages[1])
	}
}

func TestOpenCodeGenerateJSONWithoutJSONMode(t *testing.T) {
	var gotBody chatRequest
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		_ = json.Unmarshal(body, &gotBody)
		fmt.Fprint(w, `{"choices":[{"message":{"content":"plain text"}}]}`)
	}))
	defer srv.Close()

	t.Setenv("OPENCODE_API_KEY", "k")
	c := NewOpenCodeClient().WithBaseURL(srv.URL)

	out, err := c.GenerateJSON(context.Background(), "", "hi", DefaultOptions())
	if err != nil {
		t.Fatalf("GenerateJSON: %v", err)
	}
	if string(out) != "plain text" {
		t.Errorf("output = %q", string(out))
	}
	if gotBody.ResponseFormat != nil {
		t.Errorf("response_format = %+v, want nil", gotBody.ResponseFormat)
	}
	if len(gotBody.Messages) != 1 || gotBody.Messages[0].Role != "user" {
		t.Errorf("messages = %+v, want single user message", gotBody.Messages)
	}
}

func TestOpenCodeGenerateJSONHTTPError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, `{"error":{"message":"boom"}}`, http.StatusInternalServerError)
	}))
	defer srv.Close()

	t.Setenv("OPENCODE_API_KEY", "k")
	c := NewOpenCodeClient().WithBaseURL(srv.URL)

	_, err := c.GenerateJSON(context.Background(), "", "hi", DefaultOptions())
	if err == nil {
		t.Fatal("expected error for 500 response")
	}
	if !strings.Contains(err.Error(), "500") || !strings.Contains(err.Error(), "boom") {
		t.Errorf("error should carry status and body snippet: %v", err)
	}
}

func TestOpenCodeStream(t *testing.T) {
	var mu sync.Mutex
	var gotBody chatRequest

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		mu.Lock()
		_ = json.Unmarshal(body, &gotBody)
		mu.Unlock()

		w.Header().Set("Content-Type", "text/event-stream")
		flusher, ok := w.(http.Flusher)
		if !ok {
			t.Fatal("response writer does not support flushing")
		}
		for _, e := range []string{
			`data: {"choices":[{"delta":{"content":"Hello"}}]}`,
			`data: {"choices":[{"delta":{"reasoning_content":"deepseek thinking..."}}]}`,
			`data: {"choices":[{"delta":{"content":" world"}}]}`,
			`data: {"choices":[{"delta":{"tool_calls":[{"id":"call_1","type":"function","function":{"name":"search","arguments":"{\"q\":\"flyers\"}"}}]}}]}`,
			`data: [DONE]`,
		} {
			fmt.Fprintln(w, e)
			flusher.Flush()
		}
	}))
	defer srv.Close()

	t.Setenv("OPENCODE_API_KEY", "k")
	c := NewOpenCodeClient().WithBaseURL(srv.URL)

	msgs := []Message{
		{Role: "user", Content: "find flyer info"},
		{Role: "assistant", Content: "", ToolCalls: []ToolCall{{ID: "call_1", Name: "search", Arguments: `{"q":"x"}`}}},
		{Role: "tool", ToolCallID: "call_1", Content: "no results"},
	}
	tools := []Tool{{Name: "search", Description: "Search the web", Parameters: map[string]any{"type": "object"}}}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	ch, err := c.Stream(ctx, msgs, tools, DefaultOptions())
	if err != nil {
		t.Fatalf("Stream: %v", err)
	}

	var deltas []string
	var toolCalls []ToolCall
	var final, errMsg string
	for ev := range ch {
		switch ev.Type {
		case "text_delta":
			deltas = append(deltas, ev.Delta)
		case "tool_call":
			if ev.ToolCall != nil {
				toolCalls = append(toolCalls, *ev.ToolCall)
			}
		case "done":
			final = ev.Content
		case "error":
			errMsg = ev.Error.Error()
		}
	}
	if errMsg != "" {
		t.Fatalf("unexpected error event: %s", errMsg)
	}
	if joined := strings.Join(deltas, ""); joined != "Hello world" {
		t.Errorf("deltas = %q, want %q", joined, "Hello world")
	}
	if final != "Hello world" {
		t.Errorf("final content = %q (reasoning_content must not be accumulated)", final)
	}
	if len(toolCalls) != 1 {
		t.Fatalf("tool calls = %+v, want 1", toolCalls)
	}
	if toolCalls[0].ID != "call_1" || toolCalls[0].Name != "search" || toolCalls[0].Arguments != `{"q":"flyers"}` {
		t.Errorf("tool call = %+v", toolCalls[0])
	}

	mu.Lock()
	defer mu.Unlock()
	if !gotBody.Stream {
		t.Error("expected stream=true in request body")
	}
	if len(gotBody.Messages) != 3 {
		t.Fatalf("messages = %+v", gotBody.Messages)
	}
	if len(gotBody.Messages[1].ToolCalls) != 1 || gotBody.Messages[1].ToolCalls[0].ID != "call_1" {
		t.Errorf("assistant tool calls = %+v", gotBody.Messages[1].ToolCalls)
	}
	if gotBody.Messages[2].Role != "tool" || gotBody.Messages[2].ToolCallID != "call_1" {
		t.Errorf("tool message = %+v", gotBody.Messages[2])
	}
	if len(gotBody.Tools) != 1 || gotBody.Tools[0].Function.Name != "search" {
		t.Errorf("tools = %+v", gotBody.Tools)
	}
}

func TestOpenCodeStreamHTTPError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "upstream down", http.StatusBadGateway)
	}))
	defer srv.Close()

	t.Setenv("OPENCODE_API_KEY", "k")
	c := NewOpenCodeClient().WithBaseURL(srv.URL)

	_, err := c.Stream(context.Background(), nil, nil, DefaultOptions())
	if err == nil {
		t.Fatal("expected error for 502 response")
	}
	if !strings.Contains(err.Error(), "502") || !strings.Contains(err.Error(), "upstream down") {
		t.Errorf("error should carry status and body snippet: %v", err)
	}
}

func TestOpenCodeStreamContextCancellation(t *testing.T) {
	started := make(chan struct{})
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		close(started)
		w.Header().Set("Content-Type", "text/event-stream")
		w.WriteHeader(http.StatusOK)
		if f, ok := w.(http.Flusher); ok {
			f.Flush()
		}
		<-r.Context().Done() // hold the stream open until the client cancels
	}))
	defer srv.Close()

	t.Setenv("OPENCODE_API_KEY", "k")
	c := NewOpenCodeClient().WithBaseURL(srv.URL)

	ctx, cancel := context.WithCancel(context.Background())
	ch, err := c.Stream(ctx, nil, nil, DefaultOptions())
	if err != nil {
		t.Fatalf("Stream: %v", err)
	}
	<-started
	cancel()

	deadline := time.After(5 * time.Second)
	for {
		select {
		case ev, ok := <-ch:
			if !ok {
				return // channel closed cleanly, no spurious error
			}
			if ev.Type == "error" {
				t.Fatalf("unexpected error event after cancellation: %v", ev.Error)
			}
		case <-deadline:
			t.Fatal("stream did not close after context cancellation")
		}
	}
}

func TestOpenCodeConcurrentUse(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"choices":[{"message":{"content":"{}"}}]}`)
	}))
	defer srv.Close()

	t.Setenv("OPENCODE_API_KEY", "k")
	c := NewOpenCodeClient().WithBaseURL(srv.URL)

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
