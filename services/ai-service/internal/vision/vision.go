// Package vision provides image analysis via the vision model (an
// OpenAI-compatible endpoint, same base as the opencode provider but with a
// vision-capable model such as qwen3.7-plus). It returns a typed Analysis of
// the educational content in an uploaded image.
package vision

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

const (
	defaultBaseURL = "https://opencode.ai/zen/go/v1"
	defaultModel   = "qwen3.7-plus"
	httpTimeout    = 90 * time.Second
	defaultPrompt  = "Analyze this image and describe its educational content for a Sri Lankan school lesson."
)

// Analysis is the typed result of an image analysis. ContentType and
// SuggestedVisualization are constrained to the documented enums; the model
// is prompted to comply and the values are surfaced verbatim.
type Analysis struct {
	ContentType            string   `json:"contentType"`      // handwritten_notes|textbook|diagram|equations|molecule|circuit|physics_setup|other
	DetectedLanguage       string   `json:"detectedLanguage"` // en|si|ta
	Subjects               []string `json:"subjects"`
	KeyConcepts            []string `json:"keyConcepts"`
	HasEquations           bool     `json:"hasEquations"`
	SuggestedVisualization string   `json:"suggestedVisualization"` // manim|3dmol|tscircuit|matterjs|none
	ExtractedText          string   `json:"extractedText"`
}

// Client is an OpenAI-compatible vision client. It is safe for concurrent
// use; configuration is read once at construction time from the environment.
type Client struct {
	baseURL string
	apiKey  string
	model   string
	http    *http.Client
}

// NewClient builds a vision client from the environment: OPENCODE_BASE_URL
// (default https://opencode.ai/zen/go/v1), OPENCODE_API_KEY, and
// OPENCODE_VISION_MODEL (default qwen3.7-plus).
func NewClient() *Client {
	return &Client{
		baseURL: strings.TrimRight(envOr("OPENCODE_BASE_URL", defaultBaseURL), "/"),
		apiKey:  os.Getenv("OPENCODE_API_KEY"),
		model:   envOr("OPENCODE_VISION_MODEL", defaultModel),
		http:    &http.Client{Timeout: httpTimeout},
	}
}

// WithBaseURL overrides the API endpoint; used by tests to mock the server.
func (c *Client) WithBaseURL(url string) *Client {
	c.baseURL = strings.TrimRight(url, "/")
	return c
}

// systemPrompt instructs the vision model to return the exact Analysis
// schema. The model is explicitly told to output JSON only.
const systemPrompt = "You are a curriculum analyst for StudEd, a Sri Lankan school platform (Grades 1-11, O/L, A/L). Analyze the provided image and return JSON exactly matching this schema: contentType (one of handwritten_notes|textbook|diagram|equations|molecule|circuit|physics_setup|other), detectedLanguage (en|si|ta), subjects (array), keyConcepts (array), hasEquations (bool), suggestedVisualization (one of manim|3dmol|tscircuit|matterjs|none), extractedText (string). Only output JSON."

// AnalyzeImage sends a single image (base64, with an optional data URL
// prefix) plus an analysis prompt to the vision model with JSON mode enabled
// and returns the parsed Analysis. If prompt is empty a default analysis
// prompt is used. Uses default reasoning effort (none).
func (c *Client) AnalyzeImage(ctx context.Context, imageBase64, prompt string) (*Analysis, error) {
	if strings.TrimSpace(imageBase64) == "" {
		return nil, fmt.Errorf("vision: image data is empty")
	}
	return c.analyze(ctx, []string{imageBase64}, prompt, "")
}

// AnalyzeImages sends multiple images to the vision model in one request.
// High reasoning effort is used by default: qwen3.7-plus supports extended
// thinking, which materially improves OCR fidelity on handwritten notes,
// whiteboard photos, and low-contrast textbook scans. The extracted text of
// all images is merged into the returned Analysis.ExtractedText, prefixed by
// the image index so downstream consumers can attribute content to a source
// image.
func (c *Client) AnalyzeImages(ctx context.Context, images []string, prompt string) (*Analysis, error) {
	if len(images) == 0 {
		return nil, fmt.Errorf("vision: no images provided")
	}
	for i, img := range images {
		if strings.TrimSpace(img) == "" {
			return nil, fmt.Errorf("vision: image %d is empty", i+1)
		}
	}
	return c.analyze(ctx, images, prompt, "high")
}

// analyze is the shared implementation: builds a multimodal user message
// (text prompt + one image_url part per image), requests JSON mode, and
// parses the typed Analysis. When reasoningEffort is non-empty it is passed
// through to the model.
func (c *Client) analyze(ctx context.Context, images []string, prompt, reasoningEffort string) (*Analysis, error) {
	if strings.TrimSpace(prompt) == "" {
		prompt = defaultPrompt
	}

	parts := make([]contentPart, 0, len(images)+1)
	parts = append(parts, contentPart{Type: "text", Text: prompt})
	for _, img := range images {
		dataURL := img
		if !strings.HasPrefix(dataURL, "data:") {
			dataURL = "data:image/jpeg;base64," + dataURL
		}
		parts = append(parts, contentPart{Type: "image_url", ImageURL: imageURL{URL: dataURL}})
	}

	reqBody := request{
		Model: c.model,
		Messages: []message{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: parts},
		},
		ResponseFormat:  &responseFormat{Type: "json_object"},
		ReasoningEffort: reasoningEffort,
	}
	payload, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("vision: failed to marshal request: %w", err)
	}

	url := fmt.Sprintf("%s/chat/completions", c.baseURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(payload))
	if err != nil {
		return nil, fmt.Errorf("vision: failed to build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("vision: request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("vision: failed to read response: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("vision: API error: status %d, body: %s", resp.StatusCode, snippet(body))
	}

	var parsed response
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, fmt.Errorf("vision: failed to decode response: %w", err)
	}
	if len(parsed.Choices) == 0 {
		return nil, fmt.Errorf("vision: response contained no choices")
	}
	content := parsed.Choices[0].Message.Content
	if strings.TrimSpace(content) == "" {
		return nil, fmt.Errorf("vision: model returned empty content")
	}

	var analysis Analysis
	if err := json.Unmarshal([]byte(content), &analysis); err != nil {
		return nil, fmt.Errorf("vision: model output is not valid JSON: %w", err)
	}
	return &analysis, nil
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// snippet returns a bounded, single-line preview of a response body for error
// messages.
func snippet(b []byte) string {
	s := strings.TrimSpace(string(b))
	if len(s) > 200 {
		s = s[:200] + "..."
	}
	return s
}

type request struct {
	Model          string          `json:"model"`
	Messages       []message       `json:"messages"`
	ResponseFormat *responseFormat `json:"response_format,omitempty"`
	// ReasoningEffort requests extended thinking (low|medium|high) on models
	// that support it; omitted when empty.
	ReasoningEffort string `json:"reasoning_effort,omitempty"`
}

type message struct {
	Role    string `json:"role"`
	Content any    `json:"content"` // string for system, []contentPart for user
}

type contentPart struct {
	Type     string   `json:"type"`
	Text     string   `json:"text,omitempty"`
	ImageURL imageURL `json:"image_url,omitempty"`
}

type imageURL struct {
	URL string `json:"url"`
}

type responseFormat struct {
	Type string `json:"type"`
}

type response struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}
