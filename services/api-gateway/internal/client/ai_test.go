package client

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestGenerateVisualization(t *testing.T) {
	expectedBlock := map[string]any{
		"id":   "viz-1",
		"type": "mechsim_matterjs",
		"data": map[string]any{"world_config": map[string]any{"gravity": 9.8}},
	}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1/generate-visualization" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		var req map[string]any
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			t.Fatalf("bad request body: %v", err)
		}
		if req["concept"] != "pendulum" || req["vizType"] != "matterjs" || req["grade"] != "G11" {
			t.Errorf("unexpected request: %v", req)
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{"block": expectedBlock})
	}))
	defer srv.Close()

	client := NewAIClient(srv.URL)
	got, err := client.GenerateVisualization(context.Background(), "pendulum", "matterjs", "G11")
	if err != nil {
		t.Fatalf("GenerateVisualization failed: %v", err)
	}

	var parsed map[string]any
	if err := json.Unmarshal([]byte(got), &parsed); err != nil {
		t.Fatalf("result is not valid JSON: %v", err)
	}
	if parsed["type"] != "mechsim_matterjs" {
		t.Errorf("expected type mechsim_matterjs, got %v", parsed["type"])
	}
}

func TestGenerateVisualizationEmptyBlock(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"block":null}`))
	}))
	defer srv.Close()

	client := NewAIClient(srv.URL)
	_, err := client.GenerateVisualization(context.Background(), "x", "manim", "")
	if err == nil {
		t.Fatal("expected error for empty block, got nil")
	}
}

func TestAnalyzeImage(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1/analyze-image" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		var req map[string]any
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			t.Fatalf("bad request body: %v", err)
		}
		if req["imageBase64"] != "aGVsbG8=" {
			t.Errorf("unexpected imageBase64: %v", req["imageBase64"])
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"analysis":"a diagram of a plant cell"}`))
	}))
	defer srv.Close()

	client := NewAIClient(srv.URL)
	got, err := client.AnalyzeImage(context.Background(), "aGVsbG8=", "what is this?")
	if err != nil {
		t.Fatalf("AnalyzeImage failed: %v", err)
	}
	if got != "a diagram of a plant cell" {
		t.Errorf("unexpected analysis: %q", got)
	}
}
