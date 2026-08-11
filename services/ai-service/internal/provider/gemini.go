package provider

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const (
	defaultGeminiBaseURL = "https://generativelanguage.googleapis.com/v1beta"
	maxPromptLength      = 8000
)

// GeminiClient adapts the ai-service Gemini REST client to the Provider
// interface. It is used as the fallback provider when opencode is
// unavailable. It is safe for concurrent use.
type GeminiClient struct {
	apiKey  string
	model   string
	baseURL string
	http    *http.Client
}

// NewGeminiClient builds a client for the given API key and model name.
func NewGeminiClient(apiKey, model string) *GeminiClient {
	return &GeminiClient{
		apiKey:  apiKey,
		model:   model,
		baseURL: defaultGeminiBaseURL,
		http:    &http.Client{Timeout: 60 * time.Second},
	}
}

// WithBaseURL overrides the API endpoint; used by tests to mock Gemini.
func (c *GeminiClient) WithBaseURL(url string) *GeminiClient {
	c.baseURL = strings.TrimRight(url, "/")
	return c
}

// GenerateJSON sends a prompt and returns the raw JSON text produced by the
// model (responseMimeType application/json guarantees parseable output).
func (c *GeminiClient) GenerateJSON(ctx context.Context, system, user string, opts Options) ([]byte, error) {
	return c.generate(ctx, system, user, opts, "application/json")
}

// Stream calls the non-streaming generateContent endpoint and emits the full
// assistant text as a single text_delta followed by done. Tools are not yet
// supported on the Gemini path (a later enhancement); streaming is a later
// enhancement as well, correctness first.
func (c *GeminiClient) Stream(ctx context.Context, msgs []Message, tools []Tool, opts Options) (<-chan StreamEvent, error) {
	system, user := splitMessages(msgs)
	mimeType := ""
	if opts.JSONMode {
		mimeType = "application/json"
	}
	out, err := c.generate(ctx, system, user, opts, mimeType)
	if err != nil {
		return nil, err
	}

	text := string(out)
	events := make(chan StreamEvent, 2)
	events <- StreamEvent{Type: "text_delta", Delta: text}
	events <- StreamEvent{Type: "done", Content: text}
	close(events)
	return events, nil
}

// splitMessages extracts the last system message as the system instruction
// and flattens the remaining conversation into a single user prompt, since
// the Gemini REST generateContent endpoint accepts one system instruction and
// a content list.
func splitMessages(msgs []Message) (system, user string) {
	var parts []string
	for _, m := range msgs {
		if m.Role == "system" {
			system = m.Content
			continue
		}
		var b strings.Builder
		switch m.Role {
		case "assistant":
			b.WriteString("Assistant: ")
		case "tool":
			b.WriteString("Tool: ")
		default:
			b.WriteString("User: ")
		}
		b.WriteString(m.Content)
		parts = append(parts, b.String())
	}
	return system, strings.Join(parts, "\n")
}

func (c *GeminiClient) generate(ctx context.Context, system, user string, opts Options, mimeType string) ([]byte, error) {
	if len(user) > maxPromptLength {
		return nil, fmt.Errorf("user prompt exceeds maximum allowed length of %d characters", maxPromptLength)
	}

	reqBody := geminiRequest{
		Contents: []geminiContent{
			{Role: "user", Parts: []geminiPart{{Text: user}}},
		},
		GenerationConfig: geminiGenerationConfig{
			ResponseMimeType: mimeType,
			Temperature:      opts.Temperature,
			MaxOutputTokens:  opts.MaxTokens,
		},
	}
	if system != "" {
		reqBody.SystemInstruction = &geminiContent{Parts: []geminiPart{{Text: system}}}
	}

	payload, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal gemini request: %w", err)
	}

	url := fmt.Sprintf("%s/models/%s:generateContent", c.baseURL, c.model)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(payload))
	if err != nil {
		return nil, fmt.Errorf("failed to build gemini request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", c.apiKey)

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("gemini request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read gemini response: %w", err)
	}

	var parsed geminiResponse
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, fmt.Errorf("failed to decode gemini response: %w", err)
	}
	if parsed.Error != nil {
		return nil, fmt.Errorf("gemini API error: %s", parsed.Error.Message)
	}
	if len(parsed.Candidates) == 0 || len(parsed.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("gemini returned no candidates (status %d)", resp.StatusCode)
	}

	return []byte(parsed.Candidates[0].Content.Parts[0].Text), nil
}

type geminiRequest struct {
	SystemInstruction *geminiContent         `json:"system_instruction,omitempty"`
	Contents          []geminiContent        `json:"contents"`
	GenerationConfig  geminiGenerationConfig `json:"generationConfig"`
}

type geminiContent struct {
	Role  string       `json:"role,omitempty"`
	Parts []geminiPart `json:"parts"`
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiGenerationConfig struct {
	ResponseMimeType string  `json:"responseMimeType,omitempty"`
	Temperature      float64 `json:"temperature"`
	MaxOutputTokens  int     `json:"maxOutputTokens,omitempty"`
}

type geminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}
