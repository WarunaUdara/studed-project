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
	// ReasoningEffort requests extended thinking on models that support it
	// (low|medium|high). Only applied when non-empty; used for high-effort
	// OCR via the vision model.
	ReasoningEffort string
}

// Message is a single turn in a chat conversation.
type Message struct {
	Role    string // "system" | "user" | "assistant" | "tool"
	Content string
	// Images holds base64 data URLs (data:image/...;base64,...) attached to a
	// user message for vision-capable models. When present, Content is sent
	// alongside the images as the text part.
	Images []string
	// ToolCallID is set for Role == "tool" (the tool result being fed back).
	ToolCallID string
	// ToolCalls is set for Role == "assistant" when the model requested tools.
	ToolCalls []ToolCall
	// ReasoningContent is set for Role == "assistant" on reasoning models
	// (e.g. deepseek). Providers that emit a separate reasoning stream require
	// it to be echoed back when the assistant message is fed into the next
	// round trip; it is never surfaced to end users.
	ReasoningContent string
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
	// Reasoning carries the full reasoning_content when Type == "done" on
	// reasoning models; the agent echoes it back on the next round trip.
	Reasoning string
}
