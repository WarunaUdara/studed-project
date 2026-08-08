// Package tools implements the runnable functions the agentic loop can call.
// Each tool wraps a provider.GenerateJSON call (JSON mode enabled) and
// validates the model output against the blocks schemas so malformed output
// never reaches an educator's editor; validation failures are returned as
// result text so the agent can repair them.
package tools

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/studed/ai-service/internal/blocks"
	"github.com/studed/ai-service/internal/provider"
)

// Result is the outcome of a tool execution. Exactly one of the payload
// fields is populated depending on the tool; Content is the text fallback
// (and carries validation errors so the agent can repair).
type Result struct {
	Name       string
	Content    string
	Blocks     []blocks.LearnBlock
	EvalBlocks []blocks.EvaluateBlock
	VizBlock   *blocks.LearnBlock
}

// Tool is a runnable function the agent may call. Execute is safe for
// concurrent use when the underlying provider is.
type Tool struct {
	Name        string
	Description string
	Parameters  map[string]any // JSON schema object (properties + required)
	Execute     func(ctx context.Context, args map[string]any) (Result, error)
}

// DefaultSet returns the full tool set (learn, evaluate, visualization,
// translation) wired to the given provider, in declaration order.
func DefaultSet(p provider.Provider) []Tool {
	return []Tool{
		LearnBlocks(p),
		EvaluateBlocks(p),
		Visualization(p),
		Translate(p),
	}
}

const learnSystemPrompt = `You are a curriculum designer for StudEd, a Sri Lankan school platform (Grades 1-11, O/L, A/L). Create Brilliant.org-style interactive lesson content tailored to the requested grade and language. Output JSON only: an array of learn blocks, each with fields: id (string), type (one of text, math, image, video, callout, example, mathviz_manim, chemviz_3dmol, elecsim_tscircuit, mechsim_matterjs), content (markdown text, LaTeX math with $...$), and metadata (object; required for visualization types). For mathviz_manim, metadata must be {"title": ..., "scene_spec": {"scene_title": ..., "duration_seconds": ..., "style": ..., "beats": [{"time": ..., "action": ...}], "color_palette": [...]}}. For chemviz_3dmol, metadata must be {"title": ..., "molecule": {"source_type": "smiles", "source_value": "..."}, "style": {"stick": {}}}. For elecsim_tscircuit, metadata must be {"title": ..., "circuit_code": "..."}. For mechsim_matterjs, metadata must be {"title": ..., "scenario_type": "...", "world_config": {"gravity": {"x": ..., "y": ...}, "bounds": {"width": ..., "height": ...}, "bodies": [{"id": ..., "type": ..., "position": {"x": ..., "y": ...}}]}}. Keep content concise, accurate, and grade-appropriate. Do not use emojis.`

// LearnBlocks builds the generateLearnBlocks tool: it drafts a set of Learn
// blocks for a Sri Lankan grade in the requested language.
func LearnBlocks(p provider.Provider) Tool {
	return Tool{
		Name:        "generateLearnBlocks",
		Description: "Generate a set of Learn blocks (Brilliant.org style lesson content) for a Sri Lankan grade, in the requested language.",
		Parameters: map[string]any{
			"type": "object",
			"properties": map[string]any{
				"prompt":   map[string]any{"type": "string", "description": "What the educator wants the lesson to cover"},
				"language": map[string]any{"type": "string", "description": "Content language: en, si, or ta"},
				"grade":    map[string]any{"type": "string", "description": "Target grade or exam level (e.g. 8, O/L, A/L)"},
			},
			"required": []string{"prompt"},
		},
		Execute: func(ctx context.Context, args map[string]any) (Result, error) {
			prompt := argString(args, "prompt")
			language := argString(args, "language")
			grade := argString(args, "grade")

			var user strings.Builder
			user.WriteString("Prompt: " + prompt + "\n")
			user.WriteString("Language: " + language + "\n")
			user.WriteString("Grade: " + grade + "\n")
			user.WriteString("Generate a set of learn blocks.")

			raw, err := p.GenerateJSON(ctx, learnSystemPrompt, user.String(), provider.JSONOptions())
			if err != nil {
				return Result{Name: "generateLearnBlocks", Content: "tool error: " + err.Error()}, nil
			}
			parsed, err := parseLearnBlocks(raw)
			if err != nil {
				return Result{Name: "generateLearnBlocks", Content: err.Error()}, nil
			}
			return Result{Name: "generateLearnBlocks", Blocks: parsed}, nil
		},
	}
}

// parseLearnBlocks decodes model output into blocks.LearnBlock values. The
// model emits metadata as a JSON object but blocks.LearnBlock.Metadata is a
// string, so each metadata object is re-marshaled to a JSON string before
// blocks.ParseLearnBlocks validates the payload.
func parseLearnBlocks(raw []byte) ([]blocks.LearnBlock, error) {
	var arr []map[string]any
	if err := json.Unmarshal(raw, &arr); err != nil {
		return nil, fmt.Errorf("learn blocks are not valid JSON: %w", err)
	}
	for i := range arr {
		meta, ok := arr[i]["metadata"]
		if !ok || meta == nil {
			continue
		}
		if m, ok := meta.(map[string]any); ok {
			b, err := json.Marshal(m)
			if err != nil {
				return nil, fmt.Errorf("learn block %d metadata is not serializable: %w", i+1, err)
			}
			arr[i]["metadata"] = string(b)
		}
	}
	out, err := json.Marshal(arr)
	if err != nil {
		return nil, fmt.Errorf("failed to re-encode learn blocks: %w", err)
	}
	return blocks.ParseLearnBlocks(out)
}

const evalSystemPrompt = `You are an assessment designer for StudEd, a Sri Lankan school platform (Grades 1-11, O/L, A/L). Create assessment questions that check understanding of the provided content. Output JSON only: an array of evaluate blocks, each with fields: id (string), type (one of mcq, fill_in_blank, true_false, numeric, drag_drop), question (string), options (array of strings; required for mcq), correctAnswer (string; for mcq it must exactly match one option), explanation (string). Keep questions grade-appropriate and unambiguous. Do not use emojis.`

// EvaluateBlocks builds the generateEvaluateBlocks tool: it drafts a set of
// Evaluate blocks (mcq, fill_in_blank, true_false, numeric, drag_drop) for
// the given content.
func EvaluateBlocks(p provider.Provider) Tool {
	return Tool{
		Name:        "generateEvaluateBlocks",
		Description: "Generate a set of Evaluate blocks (MCQs, fill-in-the-blank, true/false, numeric, drag-and-drop) for given content.",
		Parameters: map[string]any{
			"type": "object",
			"properties": map[string]any{
				"content": map[string]any{"type": "string", "description": "The lesson content the questions should assess"},
				"count":   map[string]any{"type": "integer", "description": "Number of questions to generate"},
			},
			"required": []string{"content"},
		},
		Execute: func(ctx context.Context, args map[string]any) (Result, error) {
			content := argString(args, "content")
			count := argInt(args, "count", 5)

			var user strings.Builder
			user.WriteString("Content:\n" + content + "\n")
			user.WriteString(fmt.Sprintf("Generate %d evaluate blocks.", count))

			raw, err := p.GenerateJSON(ctx, evalSystemPrompt, user.String(), provider.JSONOptions())
			if err != nil {
				return Result{Name: "generateEvaluateBlocks", Content: "tool error: " + err.Error()}, nil
			}
			parsed, err := blocks.ParseEvaluateBlocks(raw)
			if err != nil {
				return Result{Name: "generateEvaluateBlocks", Content: err.Error()}, nil
			}
			return Result{Name: "generateEvaluateBlocks", EvalBlocks: parsed}, nil
		},
	}
}

// Visualization builds the generateVisualization tool: it generates a single
// interactive visualization block (manim, 3dmol, tscircuit, or matterjs) for
// a concept. The metadata object is validated against the block schemas.
func Visualization(p provider.Provider) Tool {
	return Tool{
		Name:        "generateVisualization",
		Description: "Generate a single interactive visualization block (manim, 3dmol, tscircuit, or matterjs) for a concept.",
		Parameters: map[string]any{
			"type": "object",
			"properties": map[string]any{
				"concept": map[string]any{"type": "string", "description": "The concept to visualize"},
				"vizType": map[string]any{"type": "string", "enum": []string{"manim", "3dmol", "tscircuit", "matterjs"}, "description": "Visualization family"},
				"grade":   map[string]any{"type": "string", "description": "Target grade or exam level"},
			},
			"required": []string{"concept", "vizType"},
		},
		Execute: func(ctx context.Context, args map[string]any) (Result, error) {
			concept := argString(args, "concept")
			vizType := strings.ToLower(strings.TrimSpace(argString(args, "vizType")))
			grade := argString(args, "grade")

			system, err := vizSystemPrompt(vizType)
			if err != nil {
				return Result{Name: "generateVisualization", Content: "tool error: " + err.Error()}, nil
			}
			var user strings.Builder
			user.WriteString("Concept: " + concept + "\n")
			user.WriteString("Visualization type: " + vizType + "\n")
			user.WriteString("Grade: " + grade + "\n")
			user.WriteString("Generate the visualization block.")

			raw, err := p.GenerateJSON(ctx, system, user.String(), provider.JSONOptions())
			if err != nil {
				return Result{Name: "generateVisualization", Content: "tool error: " + err.Error()}, nil
			}
			block, err := parseVizBlock(raw, vizType)
			if err != nil {
				return Result{Name: "generateVisualization", Content: err.Error()}, nil
			}
			return Result{Name: "generateVisualization", VizBlock: block}, nil
		},
	}
}

// vizSystemPrompt returns the code/config generator prompt for a
// visualization family.
func vizSystemPrompt(vizType string) (string, error) {
	switch vizType {
	case "manim":
		return `You are an expert Manim animation generator for mathematics education at StudEd (Grades 1-11, O/L, A/L). Output JSON only: a single object with fields id, type, content, metadata where type is mathviz_manim, content is the animation title, and metadata is {"title": ..., "scene_spec": {"scene_title": ..., "duration_seconds": ..., "style": ..., "beats": [{"time": ..., "action": ...}], "color_palette": [...]}}. Do not use emojis.`, nil
	case "3dmol":
		return `You are an expert 3D molecule generator for chemistry education at StudEd (Grades 1-11, O/L, A/L). Output JSON only: a single object with fields id, type, content, metadata where type is chemviz_3dmol, content is the molecule title, and metadata is {"title": ..., "molecule": {"source_type": "smiles", "source_value": "<SMILES string>"}, "style": {"stick": {}}}. Do not use emojis.`, nil
	case "tscircuit":
		return `You are an expert tscircuit circuit code generator for physics education at StudEd (Grades 1-11, O/L, A/L). Output JSON only: a single object with fields id, type, content, metadata where type is elecsim_tscircuit, content is the circuit title, and metadata is {"title": ..., "circuit_code": "<tsx component code>"}. Do not use emojis.`, nil
	case "matterjs":
		return `You are an expert Matter.js physics simulation generator for physics education at StudEd (Grades 1-11, O/L, A/L). Output JSON only: a single object with fields id, type, content, metadata where type is mechsim_matterjs, content is the simulation title, and metadata is {"title": ..., "scenario_type": "<type>", "world_config": {"gravity": {"x": ..., "y": ...}, "bounds": {"width": ..., "height": ...}, "bodies": [{"id": ..., "type": ..., "position": {"x": ..., "y": ...}}]}}. Do not use emojis.`, nil
	default:
		return "", fmt.Errorf("unknown visualization type %q (must be manim, 3dmol, tscircuit, or matterjs)", vizType)
	}
}

// parseVizBlock decodes model output into a single LearnBlock. The type is
// forced to the family's block type and the metadata object (re-marshaled to
// a JSON string) is validated via blocks.ValidateVizMetadata.
func parseVizBlock(raw []byte, vizType string) (*blocks.LearnBlock, error) {
	var obj map[string]any
	if err := json.Unmarshal(raw, &obj); err != nil {
		return nil, fmt.Errorf("visualization block is not valid JSON: %w", err)
	}
	if meta, ok := obj["metadata"]; ok && meta != nil {
		if m, ok := meta.(map[string]any); ok {
			b, err := json.Marshal(m)
			if err != nil {
				return nil, fmt.Errorf("visualization metadata is not serializable: %w", err)
			}
			obj["metadata"] = string(b)
		}
	}
	out, err := json.Marshal(obj)
	if err != nil {
		return nil, fmt.Errorf("failed to re-encode visualization block: %w", err)
	}

	var block blocks.LearnBlock
	if err := json.Unmarshal(out, &block); err != nil {
		return nil, fmt.Errorf("visualization block is not valid JSON: %w", err)
	}
	if strings.TrimSpace(block.Content) == "" {
		return nil, fmt.Errorf("visualization block has empty content")
	}
	block.Type = vizLearnType(vizType)
	if block.Metadata == "" {
		return nil, fmt.Errorf("%s block requires JSON metadata", block.Type)
	}
	if _, err := blocks.ValidateVizMetadata(block.Type, json.RawMessage(block.Metadata)); err != nil {
		return nil, err
	}
	return &block, nil
}

// vizLearnType maps a visualization family name to its Learn block type.
func vizLearnType(vizType string) string {
	switch vizType {
	case "manim":
		return "mathviz_manim"
	case "3dmol":
		return "chemviz_3dmol"
	case "tscircuit":
		return "elecsim_tscircuit"
	case "matterjs":
		return "mechsim_matterjs"
	}
	return ""
}

const translateSystemPrompt = `You are a professional translator for StudEd, a Sri Lankan school platform. Translate educational content faithfully between English, Sinhala, and Tamil, preserving markdown formatting and LaTeX math. Output JSON only: {"translation": "<translated text>"}. Do not use emojis.`

// Translate builds the translateContent tool: it translates educational
// content into a target language while preserving markdown and LaTeX.
func Translate(p provider.Provider) Tool {
	return Tool{
		Name:        "translateContent",
		Description: "Translate educational content into a target language (en, si, ta), preserving markdown and LaTeX.",
		Parameters: map[string]any{
			"type": "object",
			"properties": map[string]any{
				"content":        map[string]any{"type": "string", "description": "The content to translate"},
				"targetLanguage": map[string]any{"type": "string", "description": "Target language: en, si, or ta"},
			},
			"required": []string{"content", "targetLanguage"},
		},
		Execute: func(ctx context.Context, args map[string]any) (Result, error) {
			content := argString(args, "content")
			target := argString(args, "targetLanguage")

			var user strings.Builder
			user.WriteString("Target language: " + target + "\n")
			user.WriteString("Content:\n" + content + "\n")

			raw, err := p.GenerateJSON(ctx, translateSystemPrompt, user.String(), provider.JSONOptions())
			if err != nil {
				return Result{Name: "translateContent", Content: "tool error: " + err.Error()}, nil
			}
			return Result{Name: "translateContent", Content: extractTranslation(raw)}, nil
		},
	}
}

// extractTranslation pulls the translated text out of the model's JSON
// envelope, falling back to the raw output if it is not JSON.
func extractTranslation(raw []byte) string {
	var out struct {
		Translation string `json:"translation"`
		Content     string `json:"content"`
	}
	if err := json.Unmarshal(raw, &out); err == nil {
		if strings.TrimSpace(out.Translation) != "" {
			return out.Translation
		}
		if strings.TrimSpace(out.Content) != "" {
			return out.Content
		}
	}
	return strings.TrimSpace(string(raw))
}

func argString(args map[string]any, key string) string {
	v, ok := args[key]
	if !ok {
		return ""
	}
	s, ok := v.(string)
	if !ok {
		return ""
	}
	return s
}

func argInt(args map[string]any, key string, def int) int {
	v, ok := args[key]
	if !ok {
		return def
	}
	switch n := v.(type) {
	case float64:
		return int(n)
	case int:
		return n
	case string:
		var parsed int
		if _, err := fmt.Sscanf(n, "%d", &parsed); err == nil && parsed > 0 {
			return parsed
		}
	}
	return def
}
