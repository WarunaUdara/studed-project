package blocks

import (
	"encoding/json"
	"fmt"
	"strings"
)

// Block types the wave editor understands.
var validLearnTypes = map[string]bool{
	"text":    true,
	"math":    true,
	"image":   true,
	"video":   true,
	"callout": true,
	"example": true,
}

var validEvaluateTypes = map[string]bool{
	"mcq":           true,
	"fill_in_blank": true,
	"true_false":    true,
	"numeric":       true,
}

type LearnBlock struct {
	ID       string `json:"id"`
	Type     string `json:"type"`
	Content  string `json:"content"`
	Metadata string `json:"metadata,omitempty"`
}

type EvaluateBlock struct {
	ID            string   `json:"id"`
	Type          string   `json:"type"`
	Question      string   `json:"question"`
	Options       []string `json:"options,omitempty"`
	CorrectAnswer string   `json:"correctAnswer"`
	Explanation   string   `json:"explanation,omitempty"`
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
		if strings.TrimSpace(b.CorrectAnswer) == "" {
			return nil, fmt.Errorf("evaluate block %d has empty correct answer", i+1)
		}
		if b.Type == "mcq" {
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
		}
	}
	return parsed, nil
}
