package gemini

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

const defaultBaseURL = "https://generativelanguage.googleapis.com/v1beta"

// Client is a minimal Gemini REST client that requests strict JSON output.
type Client struct {
	apiKey  string
	model   string
	baseURL string
	http    *http.Client
}

func NewClient(apiKey, model string) *Client {
	return &Client{
		apiKey:  apiKey,
		model:   model,
		baseURL: defaultBaseURL,
		http:    &http.Client{Timeout: 60 * time.Second},
	}
}

// WithBaseURL overrides the API endpoint; used by tests to mock Gemini.
func (c *Client) WithBaseURL(url string) *Client {
	c.baseURL = strings.TrimRight(url, "/")
	return c
}

type generateRequest struct {
	SystemInstruction *content         `json:"system_instruction,omitempty"`
	Contents          []content        `json:"contents"`
	GenerationConfig  generationConfig `json:"generationConfig"`
}

type content struct {
	Role  string `json:"role,omitempty"`
	Parts []part `json:"parts"`
}

type part struct {
	Text string `json:"text"`
}

type generationConfig struct {
	ResponseMimeType string  `json:"responseMimeType,omitempty"`
	Temperature      float64 `json:"temperature"`
}

type generateResponse struct {
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

// GenerateJSON sends a prompt and returns the raw JSON text produced by the
// model (responseMimeType application/json guarantees parseable output).
func (c *Client) GenerateJSON(ctx context.Context, systemPrompt, userPrompt string) ([]byte, error) {
	return c.generate(ctx, systemPrompt, userPrompt, "application/json")
}

// GenerateText sends a prompt and returns plain text output.
func (c *Client) GenerateText(ctx context.Context, systemPrompt, userPrompt string) (string, error) {
	out, err := c.generate(ctx, systemPrompt, userPrompt, "")
	return string(out), err
}

func (c *Client) generate(ctx context.Context, systemPrompt, userPrompt, mimeType string) ([]byte, error) {
	reqBody := generateRequest{
		Contents: []content{
			{Role: "user", Parts: []part{{Text: userPrompt}}},
		},
		GenerationConfig: generationConfig{
			ResponseMimeType: mimeType,
			Temperature:      0.4,
		},
	}
	if systemPrompt != "" {
		reqBody.SystemInstruction = &content{Parts: []part{{Text: systemPrompt}}}
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

	var parsed generateResponse
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
