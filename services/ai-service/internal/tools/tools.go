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
	// BlockOps carries explicit edit/delete operations for the frontend to
	// apply to the live editor (upsert by id, delete by id).
	BlockOps *BlockOps
}

// BlockOps describes modifications to existing blocks in the wave.
type BlockOps struct {
	UpsertLearn []blocks.LearnBlock    `json:"upsertLearn,omitempty"`
	UpsertEval  []blocks.EvaluateBlock `json:"upsertEval,omitempty"`
	DeleteIDs   []string               `json:"deleteIDs,omitempty"`
}

// IsEmpty reports whether the ops carry no changes.
func (o *BlockOps) IsEmpty() bool {
	return o == nil || (len(o.UpsertLearn) == 0 && len(o.UpsertEval) == 0 && len(o.DeleteIDs) == 0)
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
// translation, block management) wired to the given provider, in declaration
// order.
func DefaultSet(p provider.Provider) []Tool {
	return []Tool{
		LearnBlocks(p),
		EvaluateBlocks(p),
		Visualization(p),
		Translate(p),
		ManageBlocks(),
	}
}

const learnSystemPrompt = `You are a curriculum designer for StudEd, a Sri Lankan school platform (Grades 1-11, O/L, A/L). Create Brilliant.org-style interactive lesson content tailored to the requested grade and language. Output JSON only: an array of learn blocks, each with fields: id (string), type (one of text, math, image, video, callout, example, mathviz_manim, chemviz_3dmol, elecsim_tscircuit, html_simulation), content (markdown text, LaTeX math with $...$), and metadata (object; required for visualization types). For mathviz_manim, metadata must be {"title": ..., "scene_spec": {"scene_title": ..., "duration_seconds": ..., "style": ..., "beats": [{"time": ..., "action": ...}], "color_palette": [...]}}. For chemviz_3dmol, metadata must include {"title": ..., "molecule": {"source_type": "smiles", "source_value": "<SMILES string>"}, "style": {"stick": {...}}, "surface": {"type": "VDW", "opacity": 0.7}, "camera": {"position": {"x": 0, "y": 0, "z": 50}, "zoom": 1}, "interactivity": {"rotate": true, "zoom": true, "pan": true, "click_to_identify": true}, "annotations": [...]}. For elecsim_tscircuit, metadata must be {"title": ..., "circuit_code": "..."}. For html_simulation, metadata must be {"title": ..., "description": ..., "height": 560, "html": "<complete escaped HTML/CSS/JS document>"}. Keep content concise, accurate, and grade-appropriate. Do not use emojis.

FIDELITY: Generate exactly the block types and count specified in the prompt. If the prompt names a type (e.g. "a callout"), output that type and nothing else. If a count is given, output exactly that many blocks — no more, no fewer, no substitutes. If no count is given, output a minimal reasonable amount (1-3 blocks). Never pad with extra blocks.`

// LearnBlocks builds the generateLearnBlocks tool: it drafts a set of Learn
// blocks for a Sri Lankan grade in the requested language.
func LearnBlocks(p provider.Provider) Tool {
	return Tool{
		Name:        "generateLearnBlocks",
		Description: "Generate Learn blocks (text, math, image, video, callout, example, visualization) for lesson content. Generate EXACTLY the block types and count the educator requested — never more, never substitutes.",
		Parameters: map[string]any{
			"type": "object",
			"properties": map[string]any{
				"prompt":   map[string]any{"type": "string", "description": "Exactly what the educator wants the lesson to cover, including any requested block types and count"},
				"count":    map[string]any{"type": "integer", "description": "Number of learn blocks to generate. Must match the educator's requested count; omit only if unspecified"},
				"language": map[string]any{"type": "string", "description": "Content language: en, si, or ta"},
				"grade":    map[string]any{"type": "string", "description": "Target grade or exam level (e.g. 8, O/L, A/L)"},
			},
			"required": []string{"prompt"},
		},
		Execute: func(ctx context.Context, args map[string]any) (Result, error) {
			prompt := argString(args, "prompt")
			language := argString(args, "language")
			grade := argString(args, "grade")
			count := argInt(args, "count", 0)

			var user strings.Builder
			user.WriteString("Prompt: " + prompt + "\n")
			user.WriteString("Language: " + language + "\n")
			user.WriteString("Grade: " + grade + "\n")
			if count > 0 {
				user.WriteString(fmt.Sprintf("Generate exactly %d learn blocks. Do not generate more or fewer.", count))
			} else {
				user.WriteString("Generate the exact learn blocks the prompt requests: same block types and same count. If no count is given, generate a minimal reasonable amount (1-3 blocks), never a large batch.")
			}

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

const evalSystemPrompt = `You are an assessment designer for StudEd, a Sri Lankan school platform (Grades 1-11, O/L, A/L). Create assessment questions that check understanding of the provided content. Output JSON only: an array of evaluate blocks, each with fields: id (string), type (one of mcq, fill_in_blank, true_false, numeric, drag_drop), question (string), options (array of strings; required for mcq), correctAnswer (string; for mcq it must exactly match one option), explanation (string). Keep questions grade-appropriate and unambiguous. Do not use emojis.

FIDELITY: Generate exactly the question types and count specified in the prompt. If the prompt names a type (e.g. "a true/false question"), output that type and nothing else. If a count is given, output exactly that many questions — no more, no fewer, no substitutes. If no count is given, output a minimal reasonable amount (1-3 questions). Never pad with extra questions.`

// EvaluateBlocks builds the generateEvaluateBlocks tool: it drafts a set of
// Evaluate blocks (mcq, fill_in_blank, true_false, numeric, drag_drop) for
// the given content.
func EvaluateBlocks(p provider.Provider) Tool {
	return Tool{
		Name:        "generateEvaluateBlocks",
		Description: "Generate Evaluate blocks (MCQs, fill-in-the-blank, true/false, numeric, drag-and-drop) for given content. Generate EXACTLY the question types and count the educator requested — never more, never substitutes (e.g. one true/false stays one true_false).",
		Parameters: map[string]any{
			"type": "object",
			"properties": map[string]any{
				"content": map[string]any{"type": "string", "description": "The lesson content the questions should assess"},
				"count":   map[string]any{"type": "integer", "description": "Number of questions to generate. Must match the educator's requested count; omit only if unspecified"},
				"types":   map[string]any{"type": "array", "items": map[string]any{"type": "string", "enum": []string{"mcq", "fill_in_blank", "true_false", "numeric", "drag_drop"}}, "description": "Exact question types requested by the educator, in order. Generate ONLY these types"},
			},
			"required": []string{"content"},
		},
		Execute: func(ctx context.Context, args map[string]any) (Result, error) {
			content := argString(args, "content")
			count := argInt(args, "count", 0)
			types := argStringSlice(args, "types")

			var user strings.Builder
			user.WriteString("Content:\n" + content + "\n")
			if count > 0 {
				user.WriteString(fmt.Sprintf("Generate exactly %d evaluate blocks. Do not generate more or fewer.", count))
			} else {
				user.WriteString("Generate the exact questions the educator requested: same types and same count. If no count is given, generate a minimal reasonable amount (1-3 questions), never a large batch.")
			}
			if len(types) > 0 {
				user.WriteString("\nUse exactly these question types, in this order: " + strings.Join(types, ", ") + ". Do not use any other types.")
			}

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
// interactive visualization block for a concept. Physics requests produce a
// self-contained runnable HTML/CSS/JS document; the metadata is validated
// against the block schemas.
func Visualization(p provider.Provider) Tool {
	return Tool{
		Name:        "generateVisualization",
		Description: "Generate a self-contained interactive HTML/CSS/JavaScript simulation for a concept. Physics simulations run in a sandboxed iframe and may use Matter.js.",
		Parameters: map[string]any{
			"type": "object",
			"properties": map[string]any{
				"concept": map[string]any{"type": "string", "description": "The concept to visualize"},
				"vizType": map[string]any{"type": "string", "enum": []string{"manim", "3dmol", "tscircuit", "matterjs"}, "description": "Use matterjs for physics; it generates a runnable HTML document"},
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
				// One retry with an explicit repair instruction: models
				// occasionally truncate the large viz config JSON.
				repairUser := user.String() + "\n\nYour previous output was invalid: " + err.Error() + "\nReturn ONLY valid JSON for the complete visualization block. Do not truncate. Include all required fields."
				raw2, err2 := p.GenerateJSON(ctx, system, repairUser, provider.JSONOptions())
				if err2 != nil {
					return Result{Name: "generateVisualization", Content: "tool error: " + err2.Error()}, nil
				}
				block, err = parseVizBlock(raw2, vizType)
				if err != nil {
					return Result{Name: "generateVisualization", Content: err.Error()}, nil
				}
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
		return `You are an expert 3D molecule generator for chemistry education at StudEd (Grades 1-11, O/L, A/L). Output JSON only: a single object with fields id, type, content, metadata where type is chemviz_3dmol, content is the molecule title, and metadata follows this full schema:
{
  "title": "<molecule name, e.g. Water Molecule (H2O)>",
  "description": "<one-line description>",
  "molecule": {"source_type": "smiles", "source_value": "<SMILES string>"},
  "style": {"stick": {"radius": 0.15, "colorscheme": "Jmol"}, "sphere": {"scale": 0.25}},
  "surface": {"type": "VDW", "opacity": 0.7, "color": "white"},
  "camera": {"position": {"x": 0, "y": 0, "z": 50}, "zoom": 1.0},
  "interactivity": {"rotate": true, "zoom": true, "pan": true, "click_to_identify": true, "hover_labels": true},
  "annotations": [{"type": "label", "text": "Hydrogen Bond", "position": {"x": 1.0, "y": 0.5, "z": 0.0}, "color": "red"}],
  "dimensions": {"width": 100, "height": 400}
}
Requirements: molecule.source_type must be "smiles" (preferred — give a valid SMILES string) or "pdb" (source_value like "pdb:1UBQ"). Choose a style appropriate to the molecule: stick for small molecules, cartoon for proteins. Add 0-2 annotations highlighting pedagogically important features (bonds, functional groups). Keep everything grade-appropriate. Do not use emojis.`, nil
	case "tscircuit":
		return `You are an expert tscircuit circuit code generator for physics education at StudEd (Grades 1-11, O/L, A/L). Output JSON only: a single object with fields id, type, content, metadata where type is elecsim_tscircuit, content is the circuit title, and metadata is {"title": ..., "circuit_code": "<tsx component code>"}. Do not use emojis.`, nil
	case "matterjs":
		return `You are an expert interactive physics simulation author for StudEd (Grades 1-11, O/L, A/L). The educator may ask for ANY physics system. Build a complete runnable HTML document, not an abstract config.

Output JSON only: a single object with fields id, type, content, metadata where type is html_simulation, content is the simulation title, and metadata is:
{"title":"<simulation title>","description":"<one-line description>","height":560,"html":"<!doctype html><html><head><meta charset=\\"UTF-8\\"><meta name=\\"viewport\\" content=\\"width=device-width,initial-scale=1\\"><style>...</style></head><body>...</body></html>"}

Rules:
- Include the complete UI, simulation loop, controls, labels, reset button, and educational readouts in the HTML itself.
- Use a responsive canvas or SVG. You may load Matter.js from https://cdnjs.cloudflare.com or implement a focused simulation with vanilla JavaScript. Do not rely on StudEd globals or React.
- Make the requested concept physically meaningful and interactive. Projectile motion must initialize nonzero velocity and visibly show a trajectory; pendulums need a constraint or equivalent; collisions need multiple bodies.
- Do not use placeholders. Escape the HTML as a JSON string. Keep it below 500KB. Do not use emojis.`, nil
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
		return "html_simulation"
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

// ManageBlocks builds the manageBlocks tool: it returns explicit upsert
// (update-or-add by id) and delete operations for existing wave blocks. The
// frontend applies these ops to the live editor, so the agent can edit,
// replace, or remove blocks the educator already placed without re-emitting
// the whole payload. The tool does not call the provider — it just validates
// the requested ops and returns them structurally.
func ManageBlocks() Tool {
	return Tool{
		Name:        "manageBlocks",
		Description: "Update, replace, or delete blocks already in the wave. Use upsertLearn/upsertEval with the EXACT ids of existing blocks to modify them (or new ids to add), and deleteIDs to remove blocks by id. This is how you edit or remove existing content the educator placed.",
		Parameters: map[string]any{
			"type": "object",
			"properties": map[string]any{
				"upsertLearn": map[string]any{
					"type":        "array",
					"items":       map[string]any{"type": "object"},
					"description": "Learn blocks to add or replace (same schema as generateLearnBlocks output: id, type, content, metadata). Keep existing ids to edit in place.",
				},
				"upsertEval": map[string]any{
					"type":        "array",
					"items":       map[string]any{"type": "object"},
					"description": "Evaluate blocks to add or replace (same schema as generateEvaluateBlocks output: id, type, question, options, correctAnswer, explanation). Keep existing ids to edit in place.",
				},
				"deleteIDs": map[string]any{
					"type":        "array",
					"items":       map[string]any{"type": "string"},
					"description": "Ids of blocks to remove from the wave.",
				},
			},
		},
		Execute: func(ctx context.Context, args map[string]any) (Result, error) {
			ops := &BlockOps{}
			var learnRaw, evalRaw []byte
			var err error

			if learnVal, ok := args["upsertLearn"]; ok {
				if learnRaw, err = json.Marshal(learnVal); err == nil {
					if parsed, perr := blocks.ParseLearnBlocks(learnRaw); perr == nil {
						ops.UpsertLearn = parsed
					} else {
						return Result{Name: "manageBlocks", Content: "invalid upsertLearn: " + perr.Error()}, nil
					}
				}
			}
			if evalVal, ok := args["upsertEval"]; ok {
				if evalRaw, err = json.Marshal(evalVal); err == nil {
					if parsed, perr := blocks.ParseEvaluateBlocks(evalRaw); perr == nil {
						ops.UpsertEval = parsed
					} else {
						return Result{Name: "manageBlocks", Content: "invalid upsertEval: " + perr.Error()}, nil
					}
				}
			}
			if idsVal, ok := args["deleteIDs"]; ok {
				if raw, merr := json.Marshal(idsVal); merr == nil {
					var ids []string
					if json.Unmarshal(raw, &ids) == nil {
						for _, id := range ids {
							if strings.TrimSpace(id) != "" {
								ops.DeleteIDs = append(ops.DeleteIDs, id)
							}
						}
					}
				}
			}

			if ops.IsEmpty() {
				return Result{Name: "manageBlocks", Content: "no changes requested: provide upsertLearn, upsertEval, or deleteIDs"}, nil
			}
			return Result{Name: "manageBlocks", BlockOps: ops}, nil
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

func argStringSlice(args map[string]any, key string) []string {
	v, ok := args[key]
	if !ok {
		return nil
	}
	switch items := v.(type) {
	case []any:
		out := make([]string, 0, len(items))
		for _, it := range items {
			if s, ok := it.(string); ok {
				out = append(out, s)
			}
		}
		return out
	case []string:
		return items
	}
	return nil
}
