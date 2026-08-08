// Package provider defines the LLM backend abstraction used by the agentic
// AI service. Providers are selected via the AI_PROVIDER environment variable
// (opencode by default, gemini as a fallback).
package provider

import "context"

// Provider is the LLM backend interface. Implementations: opencode (primary),
// gemini (fallback).
type Provider interface {
	// GenerateJSON returns model output as raw JSON bytes (JSON-mode enforced
	// by the backend).
	GenerateJSON(ctx context.Context, system, user string, opts Options) ([]byte, error)
	// Stream streams assistant text deltas and tool calls. Returns a channel
	// that is closed when done.
	Stream(ctx context.Context, msgs []Message, tools []Tool, opts Options) (<-chan StreamEvent, error)
}

// Options configures a single model call.
type Options struct {
	Temperature float64
	MaxTokens   int
	JSONMode    bool
}

// Message is a single turn in a chat conversation.
type Message struct {
	Role    string // "system" | "user" | "assistant" | "tool"
	Content string
	// ToolCallID is set for Role == "tool" (the tool result being fed back).
	ToolCallID string
	// ToolCalls is set for Role == "assistant" when the model requested tools.
	ToolCalls []ToolCall
}

// ToolCall is a request from the model to invoke a tool.
type ToolCall struct {
	ID        string
	Name      string
	Arguments string // raw JSON arguments object
}

// Tool describes a function the model may call.
type Tool struct {
	Name        string
	Description string
	Parameters  map[string]any // JSON schema object (properties + required)
}

// StreamEvent is a single event emitted on the stream channel.
type StreamEvent struct {
	Type     string // "text_delta" | "tool_call" | "done" | "error"
	Delta    string
	ToolCall *ToolCall
	Error    error
	// Content carries the full assistant content when Type == "done".
	Content string
}
