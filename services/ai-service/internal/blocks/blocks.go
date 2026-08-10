package blocks

import (
	"encoding/json"
	"fmt"
	"strings"
)

// Block types the wave editor understands.
var validLearnTypes = map[string]bool{
	"text":              true,
	"math":              true,
	"image":             true,
	"video":             true,
	"callout":           true,
	"example":           true,
	"mathviz_manim":     true,
	"html_simulation":   true,
	"elecsim_tscircuit": true,
}

var validEvaluateTypes = map[string]bool{
	"mcq":           true,
	"fill_in_blank": true,
	"true_false":    true,
	"numeric":       true,
	"drag_drop":     true,
}

type LearnBlock struct {
	ID       string `json:"id"`
	Type     string `json:"type"`
	Content  string `json:"content"`
	Metadata string `json:"metadata,omitempty"`
}

// UnmarshalJSON tolerates the model's metadata variants: "metadata" may be a
// plain string, a JSON object (e.g. a viz scene_spec), or missing entirely.
// Object metadata is re-encoded as its JSON string so downstream consumers
// (validation, Puck serialization) always see valid JSON or "". The model
// often puts the title at block level ("title") while viz validation expects
// it inside metadata — it is injected when the object lacks one.
func (b *LearnBlock) UnmarshalJSON(raw []byte) error {
	type alias LearnBlock
	var a struct {
		alias
		Title    string          `json:"title"`
		Metadata json.RawMessage `json:"metadata"`
	}
	if err := json.Unmarshal(raw, &a); err != nil {
		return err
	}
	*b = LearnBlock(a.alias)
	if len(a.Metadata) > 0 {
		var s string
		if json.Unmarshal(a.Metadata, &s) == nil {
			b.Metadata = s
		} else {
			// Object/array metadata: keep the raw JSON as the string value.
			var meta map[string]any
			if json.Unmarshal(a.Metadata, &meta) == nil && a.Title != "" {
				if _, ok := meta["title"]; !ok {
					meta["title"] = a.Title
				}
				if injected, err := json.Marshal(meta); err == nil {
					b.Metadata = string(injected)
				} else {
					b.Metadata = string(a.Metadata)
				}
			} else {
				b.Metadata = string(a.Metadata)
			}
		}
	}
	return nil
}

type EvaluateBlock struct {
	ID            string   `json:"id"`
	Type          string   `json:"type"`
	Question      string   `json:"question"`
	Options       []string `json:"options,omitempty"`
	CorrectAnswer string   `json:"correctAnswer"`
	// CorrectIndex is an accepted alternative to CorrectAnswer for mcq
	// blocks: the model frequently emits the index of the right option
	// instead of its text. It is resolved to CorrectAnswer during parsing.
	CorrectIndex int    `json:"correctIndex,omitempty"`
	Explanation  string `json:"explanation,omitempty"`
}

// UnmarshalJSON tolerates the model's common field-name variants: "choices"
// is accepted as an alias for "options", and either "correctAnswer" or
// "correctIndex" locates the right option.
func (b *EvaluateBlock) UnmarshalJSON(raw []byte) error {
	type alias EvaluateBlock
	var a struct {
		alias
		Choices []string `json:"choices,omitempty"`
	}
	if err := json.Unmarshal(raw, &a); err != nil {
		return err
	}
	*b = EvaluateBlock(a.alias)
	if len(b.Options) == 0 && len(a.Choices) > 0 {
		b.Options = a.Choices
	}
	return nil
}

// ParseLearnBlocks decodes and validates AI-generated learn blocks, so
// malformed model output is rejected before it reaches an educator's editor.
func ParseLearnBlocks(raw []byte) ([]LearnBlock, error) {
	var parsed []LearnBlock
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, fmt.Errorf("learn blocks are not valid JSON: %w", err)
	}
	if len(parsed) == 0 {
		return nil, fmt.Errorf("no learn blocks generated")
	}

	for i := range parsed {
		b := &parsed[i]
		if b.ID == "" {
			b.ID = fmt.Sprintf("learn-%d", i+1)
		}
		b.Type = strings.ToLower(strings.TrimSpace(b.Type))
		if !validLearnTypes[b.Type] {
			b.Type = "text"
		}
		if strings.TrimSpace(b.Content) == "" {
			return nil, fmt.Errorf("learn block %d has empty content", i+1)
		}
		if IsVizType(b.Type) {
			// A viz block whose metadata fails validation degrades to a plain
			// text block rather than failing the whole payload: the model
			// often emits a placeholder ("{}") for the scene spec, and one
			// bad block should never discard the other valid learn content.
			if b.Metadata == "" {
				b.Type = "text"
				b.Metadata = ""
				continue
			}
			if _, err := ValidateVizMetadata(b.Type, json.RawMessage(b.Metadata)); err != nil {
				b.Type = "text"
				b.Metadata = ""
				continue
			}
		}
	}
	return parsed, nil
}

// ParseEvaluateBlocks decodes and validates AI-generated evaluate blocks.
func ParseEvaluateBlocks(raw []byte) ([]EvaluateBlock, error) {
	var parsed []EvaluateBlock
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, fmt.Errorf("evaluate blocks are not valid JSON: %w", err)
	}
	if len(parsed) == 0 {
		return nil, fmt.Errorf("no evaluate blocks generated")
	}

	for i := range parsed {
		b := &parsed[i]
		if b.ID == "" {
			b.ID = fmt.Sprintf("eval-%d", i+1)
		}
		b.Type = strings.ToLower(strings.TrimSpace(b.Type))
		if !validEvaluateTypes[b.Type] {
			return nil, fmt.Errorf("evaluate block %d has unknown type %q", i+1, b.Type)
		}
		if strings.TrimSpace(b.Question) == "" {
			return nil, fmt.Errorf("evaluate block %d has empty question", i+1)
		}
		if b.Type == "mcq" {
			// Resolve correctIndex -> correctAnswer when the model only
			// emitted the option index.
			if strings.TrimSpace(b.CorrectAnswer) == "" && b.CorrectIndex >= 0 && b.CorrectIndex < len(b.Options) {
				b.CorrectAnswer = b.Options[b.CorrectIndex]
			}
			if strings.TrimSpace(b.CorrectAnswer) == "" {
				return nil, fmt.Errorf("evaluate block %d (mcq) has no correct answer", i+1)
			}
			if len(b.Options) < 2 {
				return nil, fmt.Errorf("evaluate block %d (mcq) needs at least 2 options", i+1)
			}
			found := false
			for _, opt := range b.Options {
				if strings.EqualFold(strings.TrimSpace(opt), strings.TrimSpace(b.CorrectAnswer)) {
					found = true
					break
				}
			}
			if !found {
				return nil, fmt.Errorf("evaluate block %d (mcq) correct answer is not among options", i+1)
			}
		} else if strings.TrimSpace(b.CorrectAnswer) == "" {
			return nil, fmt.Errorf("evaluate block %d has empty correct answer", i+1)
		}
	}
	return parsed, nil
}
