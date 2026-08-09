package provider

import (
	"bufio"
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
	defaultOpenCodeBaseURL = "https://opencode.ai/zen/go/v1"
	defaultOpenCodeModel   = "deepseek-v4-flash"
	openCodeTimeout        = 90 * time.Second
)

// OpenCodeClient is an OpenAI-compatible chat completions client used as the
// primary LLM provider. It is safe for concurrent use; configuration is read
// once at construction time from the environment.
type OpenCodeClient struct {
	baseURL string
	apiKey  string
	model   string
	http    *http.Client
}

// NewOpenCodeClient builds a client from the environment: OPENCODE_BASE_URL
// (default https://opencode.ai/zen/go/v1), OPENCODE_API_KEY, and OPENCODE_MODEL
// (default deepseek-v4-flash).
func NewOpenCodeClient() *OpenCodeClient {
	return &OpenCodeClient{
		baseURL: strings.TrimRight(envOr("OPENCODE_BASE_URL", defaultOpenCodeBaseURL), "/"),
		apiKey:  os.Getenv("OPENCODE_API_KEY"),
		model:   envOr("OPENCODE_MODEL", defaultOpenCodeModel),
		http:    &http.Client{Timeout: openCodeTimeout},
	}
}

// WithBaseURL overrides the API endpoint; used by tests to mock the server.
func (c *OpenCodeClient) WithBaseURL(url string) *OpenCodeClient {
	c.baseURL = strings.TrimRight(url, "/")
	return c
}

// GenerateJSON sends a chat completion request with JSON mode enabled and
// returns the raw JSON text produced by the model.
func (c *OpenCodeClient) GenerateJSON(ctx context.Context, system, user string, opts Options) ([]byte, error) {
	msgs := make([]Message, 0, 2)
	if system != "" {
		msgs = append(msgs, Message{Role: "system", Content: system})
	}
	msgs = append(msgs, Message{Role: "user", Content: user})

	resp, err := c.chatCompletion(ctx, msgs, nil, opts, false)
	if err != nil {
		return nil, err
	}
	content := resp.Choices[0].Message.Content
	if strings.TrimSpace(content) == "" {
		return nil, fmt.Errorf("opencode returned empty content")
	}
	return []byte(content), nil
}

// Stream posts a streaming chat completion and returns a channel of events
// that is closed when the stream ends. reasoning_content deltas from deepseek
// are ignored and never accumulated into the final content.
func (c *OpenCodeClient) Stream(ctx context.Context, msgs []Message, tools []Tool, opts Options) (<-chan StreamEvent, error) {
	reqBody := buildChatRequest(c.model, msgs, tools, opts, true)
	payload, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal opencode stream request: %w", err)
	}

	url := fmt.Sprintf("%s/chat/completions", c.baseURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(payload))
	if err != nil {
		return nil, fmt.Errorf("failed to build opencode stream request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("opencode stream request failed: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		return nil, fmt.Errorf("opencode stream API error: status %d, body: %s", resp.StatusCode, snippet(body))
	}

	events := make(chan StreamEvent)
	go func() {
		defer close(events)
		defer resp.Body.Close()
		readOpenCodeStream(ctx, resp.Body, events)
	}()
	return events, nil
}

// chatCompletion posts a non-streaming chat completion and returns the parsed
// response.
func (c *OpenCodeClient) chatCompletion(ctx context.Context, msgs []Message, tools []Tool, opts Options, stream bool) (*chatResponse, error) {
	reqBody := buildChatRequest(c.model, msgs, tools, opts, stream)
	payload, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal opencode request: %w", err)
	}

	url := fmt.Sprintf("%s/chat/completions", c.baseURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(payload))
	if err != nil {
		return nil, fmt.Errorf("failed to build opencode request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("opencode request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read opencode response: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("opencode API error: status %d, body: %s", resp.StatusCode, snippet(body))
	}

	var parsed chatResponse
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, fmt.Errorf("failed to decode opencode response: %w", err)
	}
	if len(parsed.Choices) == 0 {
		return nil, fmt.Errorf("opencode returned no choices (status %d)", resp.StatusCode)
	}
	return &parsed, nil
}

// readOpenCodeStream parses SSE lines and emits events until [DONE], EOF, or
// an error. The channel is closed by the caller.
func readOpenCodeStream(ctx context.Context, body io.Reader, events chan<- StreamEvent) {
	var full strings.Builder
	var reasoning strings.Builder
	// Tool calls accumulate by chunk index across deltas; they are emitted
	// once the stream finishes (the terminal chunk carries finish_reason).
	var toolCallsByIndex []chatToolCall
	scanner := bufio.NewScanner(body)
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	for scanner.Scan() {
		line := scanner.Text()
		if !strings.HasPrefix(line, "data:") {
			continue
		}
		data := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
		if data == "[DONE]" {
			break
		}
		var chunk chatStreamChunk
		if err := json.Unmarshal([]byte(data), &chunk); err != nil {
			events <- StreamEvent{Type: "error", Error: fmt.Errorf("failed to decode opencode stream chunk: %w", err)}
			return
		}
		if len(chunk.Choices) == 0 {
			continue
		}
		delta := chunk.Choices[0].Delta
		// reasoning_content is accumulated but never treated as final
		// content; it must be echoed back to the API on tool round trips.
		if delta.ReasoningContent != "" {
			reasoning.WriteString(delta.ReasoningContent)
		}
		if delta.Content != "" {
			full.WriteString(delta.Content)
			events <- StreamEvent{Type: "text_delta", Delta: delta.Content}
		}
		for _, tc := range delta.ToolCalls {
			// Tool call deltas arrive across chunks: the first chunk carries
			// id + name + empty arguments, subsequent chunks carry only the
			// index and argument fragments. Key the accumulation by the
			// chunk index and fill id/name when present.
			idx := tc.Index
			if idx >= len(toolCallsByIndex) {
				// Grow the slice; unknown/absent indices append at the end.
				toolCallsByIndex = append(toolCallsByIndex, make([]chatToolCall, idx+1-len(toolCallsByIndex))...)
			}
			if tc.ID != "" {
				toolCallsByIndex[idx].ID = tc.ID
			}
			if tc.Type != "" {
				toolCallsByIndex[idx].Type = tc.Type
			}
			if tc.Function.Name != "" {
				toolCallsByIndex[idx].Function.Name = tc.Function.Name
			}
			toolCallsByIndex[idx].Function.Arguments += tc.Function.Arguments
		}
	}
	if err := scanner.Err(); err != nil && ctx.Err() == nil {
		events <- StreamEvent{Type: "error", Error: fmt.Errorf("opencode stream read failed: %w", err)}
		return
	}
	for _, tc := range toolCallsByIndex {
		if tc.ID == "" || tc.Function.Name == "" {
			events <- StreamEvent{Type: "error", Error: fmt.Errorf("opencode stream produced an incomplete tool call")}
			return
		}
		events <- StreamEvent{Type: "tool_call", ToolCall: &ToolCall{
			ID:        tc.ID,
			Name:      tc.Function.Name,
			Arguments: tc.Function.Arguments,
		}}
	}
	events <- StreamEvent{Type: "done", Content: full.String(), Reasoning: reasoning.String()}
}

// buildChatRequest converts provider-level messages and tools into the
// OpenAI-compatible request body.
func buildChatRequest(model string, msgs []Message, tools []Tool, opts Options, stream bool) chatRequest {
	reqBody := chatRequest{
		Model:           model,
		Messages:        toChatMessages(msgs),
		Tools:           toChatTools(tools),
		Temperature:     opts.Temperature,
		MaxTokens:       opts.MaxTokens,
		Stream:          stream,
		ReasoningEffort: opts.ReasoningEffort,
	}
	if opts.JSONMode {
		reqBody.ResponseFormat = &responseFormat{Type: "json_object"}
	}
	return reqBody
}

func toChatMessages(msgs []Message) []chatMessage {
	out := make([]chatMessage, 0, len(msgs))
	for _, m := range msgs {
		cm := chatMessage{Role: m.Role, ToolCallID: m.ToolCallID, ReasoningContent: m.ReasoningContent}
		if len(m.Images) > 0 {
			// Multimodal: content becomes an array of parts (text + images).
			parts := make([]chatContentPart, 0, len(m.Images)+1)
			if m.Content != "" {
				parts = append(parts, chatContentPart{Type: "text", Text: m.Content})
			}
			for _, img := range m.Images {
				parts = append(parts, chatContentPart{Type: "image_url", ImageURL: &chatImageURL{URL: img}})
			}
			cm.Content = parts
		} else {
			cm.Content = m.Content
		}
		if len(m.ToolCalls) > 0 {
			cm.ToolCalls = make([]chatToolCall, 0, len(m.ToolCalls))
			for _, tc := range m.ToolCalls {
				cm.ToolCalls = append(cm.ToolCalls, chatToolCall{
					ID:       tc.ID,
					Type:     "function",
					Function: chatToolCallFunction{Name: tc.Name, Arguments: tc.Arguments},
				})
			}
		}
		out = append(out, cm)
	}
	return out
}

func toChatTools(tools []Tool) []chatTool {
	if len(tools) == 0 {
		return nil
	}
	out := make([]chatTool, 0, len(tools))
	for _, t := range tools {
		out = append(out, chatTool{
			Type: "function",
			Function: chatToolFunction{
				Name:        t.Name,
				Description: t.Description,
				Parameters:  t.Parameters,
			},
		})
	}
	return out
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

type chatRequest struct {
	Model          string          `json:"model"`
	Messages       []chatMessage   `json:"messages"`
	Tools          []chatTool      `json:"tools,omitempty"`
	Temperature    float64         `json:"temperature,omitempty"`
	MaxTokens      int             `json:"max_tokens,omitempty"`
	Stream         bool            `json:"stream"`
	ResponseFormat *responseFormat `json:"response_format,omitempty"`
	// ReasoningEffort requests extended thinking (low|medium|high) on models
	// that support it; omitted when empty.
	ReasoningEffort string `json:"reasoning_effort,omitempty"`
}

// chatContentPart is one element of a multimodal user message: either text
// or an image_url reference.
type chatContentPart struct {
	Type     string          `json:"type"`
	Text     string          `json:"text,omitempty"`
	ImageURL *chatImageURL   `json:"image_url,omitempty"`
}

type chatImageURL struct {
	URL string `json:"url"`
}

type chatMessage struct {
	Role             string         `json:"role"`
	Content          any            `json:"content"`
	ToolCallID       string         `json:"tool_call_id,omitempty"`
	ToolCalls        []chatToolCall `json:"tool_calls,omitempty"`
	ReasoningContent string         `json:"reasoning_content,omitempty"`
}

type chatTool struct {
	Type     string           `json:"type"`
	Function chatToolFunction `json:"function"`
}

type chatToolFunction struct {
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Parameters  map[string]any `json:"parameters"`
}

type chatToolCall struct {
	Index    int                  `json:"index,omitempty"`
	ID       string               `json:"id,omitempty"`
	Type     string               `json:"type,omitempty"`
	Function chatToolCallFunction `json:"function,omitempty"`
}

type chatToolCallFunction struct {
	Name      string `json:"name,omitempty"`
	Arguments string `json:"arguments,omitempty"`
}

type responseFormat struct {
	Type string `json:"type"`
}

type chatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

type chatStreamChunk struct {
	Choices []struct {
		Delta struct {
			Content          string         `json:"content"`
			ReasoningContent string         `json:"reasoning_content"` // deepseek; intentionally ignored
			ToolCalls        []chatToolCall `json:"tool_calls"`
		} `json:"delta"`
	} `json:"choices"`
}
