// Package agent implements the tool-calling loop that drives content
// generation. The agent streams provider events to a channel: it plans,
// invokes tools, and finally emits a done event carrying the validated Learn
// and Evaluate blocks. The Agent is safe for concurrent Run calls; all state
// is local to Run and the tool map is read-only after New.
package agent

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/studed/ai-service/internal/blocks"
	"github.com/studed/ai-service/internal/provider"
	"github.com/studed/ai-service/internal/tools"
)

// Request is a single educator request to the agent.
type Request struct {
	Prompt      string // educator request
	Language    string
	Grade       string
	WaveContext string // optional existing wave content (markdown/JSON summary)
	// Images holds base64 data URLs of uploaded photos (handwritten notes,
	// textbook pages, whiteboards). The handler runs high-effort OCR on them
	// first (qwen3.7-plus) and injects the extracted text into the prompt via
	// OCRContext; the raw images are also attached to the first user message
	// so vision-capable models can inspect them directly.
	Images []string
	// OCRContext is the pre-computed vision analysis (extracted text,
	// detected subjects, suggested visualization) used as context for the
	// generation prompt. Kept separate from WaveContext so the agent can
	// distinguish "what the photo says" from "what the wave already has".
	OCRContext string
}

// Event is streamed to the caller. Type is one of plan|ocr|tool_start|
// tool_end|delta|done|error. The done event carries the final blocks.
type Event struct {
	Type    string `json:"type"`
	Tool    string `json:"tool,omitempty"`
	Message string `json:"message,omitempty"`

	LearnBlocks    []blocks.LearnBlock    `json:"learnBlocks,omitempty"`
	EvaluateBlocks []blocks.EvaluateBlock `json:"evaluateBlocks,omitempty"`
	Error          string                 `json:"error,omitempty"`
}

// Agent runs the tool-calling loop against a provider. It is safe for
// concurrent use.
type Agent struct {
	provider      provider.Provider
	tools         []provider.Tool
	toolByName    map[string]tools.Tool
	maxIterations int
}

// New builds an agent around a provider and a tool set. maxIterations bounds
// the number of provider round trips; values <= 0 fall back to 6.
func New(p provider.Provider, toolSet []tools.Tool, maxIterations int) *Agent {
	if maxIterations <= 0 {
		maxIterations = 6
	}
	byName := make(map[string]tools.Tool, len(toolSet))
	ptools := make([]provider.Tool, 0, len(toolSet))
	for _, t := range toolSet {
		byName[t.Name] = t
		ptools = append(ptools, provider.Tool{
			Name:        t.Name,
			Description: t.Description,
			Parameters:  t.Parameters,
		})
	}
	return &Agent{
		provider:      p,
		tools:         ptools,
		toolByName:    byName,
		maxIterations: maxIterations,
	}
}

// Tools returns the provider-facing tool declarations for the agent loop.
func (a *Agent) Tools() []provider.Tool { return a.tools }

// Run executes the agent loop and streams events into events; the channel is
// closed when the run finishes. ctx cancellation stops the loop.
func (a *Agent) Run(ctx context.Context, req Request, events chan<- Event) {
	defer close(events)
	events <- Event{Type: "plan", Message: "Planning generation for: " + req.Prompt}

	msgs := buildMessages(req)
	for iter := 0; iter < a.maxIterations; iter++ {
		if ctx.Err() != nil {
			return
		}

		assistantText, reasoning, calls, err := a.streamOnce(ctx, msgs, events)
		if err != nil {
			events <- Event{Type: "error", Error: err.Error()}
			return
		}
		msgs = append(msgs, provider.Message{
			Role:             "assistant",
			Content:          assistantText,
			ToolCalls:        calls,
			ReasoningContent: reasoning,
		})

		if len(calls) == 0 {
			events <- a.doneEvent(assistantText)
			return
		}

		for _, tc := range calls {
			if ctx.Err() != nil {
				return
			}
			tool, ok := a.toolByName[tc.Name]
			if !ok {
				msgs = append(msgs, provider.Message{Role: "tool", ToolCallID: tc.ID, Content: "unknown tool: " + tc.Name})
				continue
			}
			var args map[string]any
			if err := json.Unmarshal([]byte(tc.Arguments), &args); err != nil {
				msgs = append(msgs, provider.Message{Role: "tool", ToolCallID: tc.ID, Content: "invalid tool arguments: " + err.Error()})
				continue
			}

			events <- Event{Type: "tool_start", Tool: tc.Name}
			res, execErr := tool.Execute(ctx, args)
			events <- Event{Type: "tool_end", Tool: tc.Name, Message: summarize(res, execErr)}
			if execErr != nil {
				msgs = append(msgs, provider.Message{Role: "tool", ToolCallID: tc.ID, Content: "tool error: " + execErr.Error()})
				continue
			}
			msgs = append(msgs, provider.Message{Role: "tool", ToolCallID: tc.ID, Content: resultContent(res)})
		}
	}
	events <- Event{Type: "error", Error: "agent exceeded max iterations"}
}

// streamOnce calls the provider and accumulates text deltas and tool calls
// from the stream, forwarding deltas as events. Tool call arguments are
// accumulated by call ID so providers that split arguments across chunks are
// handled correctly. It returns the assistant text, the full reasoning
// content (for reasoning models; echoed back on tool round trips), and the
// requested tool calls.
func (a *Agent) streamOnce(ctx context.Context, msgs []provider.Message, events chan<- Event) (string, string, []provider.ToolCall, error) {
	ch, err := a.provider.Stream(ctx, msgs, a.Tools(), provider.DefaultOptions())
	if err != nil {
		return "", "", nil, err
	}

	var text strings.Builder
	var reasoning strings.Builder
	var calls []provider.ToolCall
	callIndex := make(map[string]int)
	var streamErr error
	for ev := range ch {
		switch ev.Type {
		case "text_delta":
			text.WriteString(ev.Delta)
			events <- Event{Type: "delta", Message: ev.Delta}
		case "tool_call":
			if ev.ToolCall == nil {
				continue
			}
			tc := *ev.ToolCall
			if idx, ok := callIndex[tc.ID]; ok {
				calls[idx].Arguments += tc.Arguments
			} else {
				callIndex[tc.ID] = len(calls)
				calls = append(calls, tc)
			}
		case "error":
			if ev.Error != nil {
				streamErr = ev.Error
			}
		case "done":
			reasoning.WriteString(ev.Reasoning)
		}
	}
	if streamErr != nil {
		return "", "", nil, streamErr
	}
	return text.String(), reasoning.String(), calls, nil
}

// doneEvent builds the final done event. If the assistant text looks like a
// JSON blocks payload it is parsed into Learn/Evaluate blocks; otherwise the
// text is delivered as-is. Markdown code fences around the JSON are stripped.
func (a *Agent) doneEvent(final string) Event {
	ev := Event{Type: "done", Message: final}
	trimmed := extractJSON(strings.TrimSpace(final))
	switch {
	case strings.HasPrefix(trimmed, "["):
		if lbs, err := blocks.ParseLearnBlocks([]byte(trimmed)); err == nil {
			ev.LearnBlocks = lbs
		} else if evs, err := blocks.ParseEvaluateBlocks([]byte(trimmed)); err == nil {
			ev.EvaluateBlocks = evs
		}
	case strings.HasPrefix(trimmed, "{"):
		var payload struct {
			LearnBlocks    json.RawMessage `json:"learnBlocks"`
			EvaluateBlocks json.RawMessage `json:"evaluateBlocks"`
			Blocks         json.RawMessage `json:"blocks"`
		}
		if err := json.Unmarshal([]byte(trimmed), &payload); err == nil {
			if len(payload.LearnBlocks) > 0 {
				if lbs, err := blocks.ParseLearnBlocks(payload.LearnBlocks); err == nil {
					ev.LearnBlocks = lbs
				}
			}
			if len(payload.EvaluateBlocks) > 0 {
				if evs, err := blocks.ParseEvaluateBlocks(payload.EvaluateBlocks); err == nil {
					ev.EvaluateBlocks = evs
				}
			}
			if len(ev.LearnBlocks) == 0 && len(ev.EvaluateBlocks) == 0 && len(payload.Blocks) > 0 {
				if lbs, err := blocks.ParseLearnBlocks(payload.Blocks); err == nil {
					ev.LearnBlocks = lbs
				}
			}
		}
	}
	return ev
}

// extractJSON pulls the first JSON value (array or object) out of s, skipping
// markdown code fences and any prose around it. If no JSON value is found it
// returns s unchanged so the caller's parse attempt fails naturally.
func extractJSON(s string) string {
	if !strings.Contains(s, "```") {
		return s
	}
	start := strings.IndexByte(s, '[')
	endObj := strings.IndexByte(s, '{')
	if endObj >= 0 && (start < 0 || endObj < start) {
		start = endObj
	}
	if start < 0 {
		return s
	}
	depth := 0
	inString := false
	escaped := false
	for i := start; i < len(s); i++ {
		c := s[i]
		if inString {
			if escaped {
				escaped = false
				continue
			}
			if c == '\\' {
				escaped = true
				continue
			}
			if c == '"' {
				inString = false
			}
			continue
		}
		switch c {
		case '"':
			inString = true
		case '[', '{':
			depth++
		case ']', '}':
			depth--
			if depth == 0 {
				return s[start : i+1]
			}
		}
	}
	return s
}

// buildMessages assembles the system prompt and user message for the first
// provider round trip. Uploaded images are attached as multimodal parts and
// the OCR context (if any) is included in the user text.
func buildMessages(req Request) []provider.Message {
	var user strings.Builder
	user.WriteString("Prompt: " + req.Prompt + "\n")
	if req.Language != "" {
		user.WriteString("Language: " + req.Language + "\n")
	}
	if req.Grade != "" {
		user.WriteString("Grade: " + req.Grade + "\n")
	}
	if req.OCRContext != "" {
		user.WriteString("Uploaded images (OCR analysis):\n" + req.OCRContext + "\n")
	}
	if req.WaveContext != "" {
		user.WriteString("Wave context:\n" + req.WaveContext + "\n")
	}
	return []provider.Message{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: user.String(), Images: req.Images},
	}
}

const systemPrompt = `You are StudEd's educator assistant, helping Sri Lankan educators (Grades 1-11, O/L, A/L) build lesson content. You have tools for generating Learn blocks, Evaluate blocks, interactive visualizations, and translations. Use the tools to fulfil the educator's request, then reply with the final result.

Learn block types: text, math, image, video, callout, example, mathviz_manim, chemviz_3dmol, elecsim_tscircuit, mechsim_matterjs.
Evaluate block types: mcq, fill_in_blank, true_false, numeric, drag_drop.

When the task is complete, reply with the final payload as JSON: either an array of learn blocks, or an object with learnBlocks and evaluateBlocks arrays.`

// resultContent serializes a tool result for the model: structured payloads
// are re-encoded as JSON, text results are returned verbatim.
func resultContent(res tools.Result) string {
	switch {
	case len(res.Blocks) > 0:
		if b, err := json.Marshal(res.Blocks); err == nil {
			return string(b)
		}
	case len(res.EvalBlocks) > 0:
		if b, err := json.Marshal(res.EvalBlocks); err == nil {
			return string(b)
		}
	case res.VizBlock != nil:
		if b, err := json.Marshal(res.VizBlock); err == nil {
			return string(b)
		}
	}
	return res.Content
}

// summarize renders a short human-readable tool_end message.
func summarize(res tools.Result, execErr error) string {
	if execErr != nil {
		return "tool failed: " + execErr.Error()
	}
	switch {
	case len(res.Blocks) > 0:
		return fmt.Sprintf("generated %d learn blocks", len(res.Blocks))
	case len(res.EvalBlocks) > 0:
		return fmt.Sprintf("generated %d evaluate blocks", len(res.EvalBlocks))
	case res.VizBlock != nil:
		return "generated visualization block"
	default:
		s := strings.TrimSpace(res.Content)
		if len(s) > 120 {
			s = s[:120] + "..."
		}
		return s
	}
}
