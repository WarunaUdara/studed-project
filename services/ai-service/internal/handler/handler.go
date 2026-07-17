package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"

	"github.com/studed/ai-service/internal/blocks"
)

// Generator abstracts the Gemini client for testing.
type Generator interface {
	GenerateJSON(ctx context.Context, systemPrompt, userPrompt string) ([]byte, error)
	GenerateText(ctx context.Context, systemPrompt, userPrompt string) (string, error)
}

type Handler struct {
	ai  Generator
	log *slog.Logger
}

func New(ai Generator, log *slog.Logger) *Handler {
	return &Handler{ai: ai, log: log}
}

func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("POST /v1/generate-learn-blocks", h.generateLearnBlocks)
	mux.HandleFunc("POST /v1/generate-evaluate-blocks", h.generateEvaluateBlocks)
	mux.HandleFunc("POST /v1/translate", h.translate)
}

const learnSystemPrompt = `You are a curriculum designer for StudEd, a Sri Lankan school platform (Grades 1-11, O/L, A/L) built in the style of Brilliant.org.
Generate interactive lesson "learn blocks" as a JSON array. Each element:
{"id": "learn-N", "type": "text|math|callout|example", "content": "markdown content"}
Rules:
- Progress from intuition to formalism: start concrete, end precise.
- Keep each block short (under 120 words) and focused on ONE idea.
- Use "math" blocks for formulas, written in LaTeX.
- Write at the requested grade level and in the requested language.
- Output ONLY the JSON array.`

const evaluateSystemPrompt = `You are an assessment designer for StudEd, a Sri Lankan school platform.
Given lesson content, generate evaluation questions as a JSON array. Each element:
{"id": "eval-N", "type": "mcq|fill_in_blank|true_false|numeric", "question": "...", "options": ["..."], "correctAnswer": "...", "explanation": "..."}
Rules:
- "options" is required for mcq (exactly 4 choices, correctAnswer must be one of them verbatim) and true_false (["True","False"]).
- For numeric answers, correctAnswer is the number only (e.g. "0.5").
- Questions must test understanding of the given content, increasing in difficulty.
- Every question needs an explanation that teaches, not just states the answer.
- Output ONLY the JSON array.`

const translateSystemPrompt = `You are a professional translator for Sri Lankan educational content.
Translate the given content into the target language, preserving all markdown formatting, LaTeX math, and code blocks exactly.
For Sinhala and Tamil, use natural academic register appropriate for school students.
Output ONLY the translated content, no preamble.`

type learnRequest struct {
	Prompt   string `json:"prompt"`
	Language string `json:"language"`
	Grade    string `json:"grade"`
}

type evaluateRequest struct {
	Content string `json:"content"`
	Count   int    `json:"count"`
}

type translateRequest struct {
	Content        string `json:"content"`
	TargetLanguage string `json:"target_language"`
}

func (h *Handler) generateLearnBlocks(w http.ResponseWriter, r *http.Request) {
	var req learnRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Prompt) == "" {
		writeError(w, http.StatusBadRequest, "prompt is required")
		return
	}
	if req.Language == "" {
		req.Language = "English"
	}
	if req.Grade == "" {
		req.Grade = "unspecified"
	}

	userPrompt := fmt.Sprintf("Topic: %s\nLanguage: %s\nGrade level: %s\nGenerate 4-8 learn blocks.", req.Prompt, req.Language, req.Grade)

	parsed, err := h.withRetry(r.Context(), learnSystemPrompt, userPrompt, func(raw []byte) (any, error) {
		blocks, err := blocks.ParseLearnBlocks(raw)
		return blocks, err
	})
	if err != nil {
		writeError(w, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(w, map[string]any{"blocks": parsed})
}

func (h *Handler) generateEvaluateBlocks(w http.ResponseWriter, r *http.Request) {
	var req evaluateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Content) == "" {
		writeError(w, http.StatusBadRequest, "content is required")
		return
	}
	if req.Count <= 0 {
		req.Count = 3
	}
	if req.Count > 10 {
		req.Count = 10
	}

	userPrompt := fmt.Sprintf("Lesson content:\n%s\n\nGenerate exactly %d questions.", req.Content, req.Count)

	parsed, err := h.withRetry(r.Context(), evaluateSystemPrompt, userPrompt, func(raw []byte) (any, error) {
		blocks, err := blocks.ParseEvaluateBlocks(raw)
		return blocks, err
	})
	if err != nil {
		writeError(w, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(w, map[string]any{"blocks": parsed})
}

func (h *Handler) translate(w http.ResponseWriter, r *http.Request) {
	var req translateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Content) == "" || strings.TrimSpace(req.TargetLanguage) == "" {
		writeError(w, http.StatusBadRequest, "content and target_language are required")
		return
	}

	userPrompt := fmt.Sprintf("Target language: %s\n\nContent:\n%s", req.TargetLanguage, req.Content)
	translation, err := h.ai.GenerateText(r.Context(), translateSystemPrompt, userPrompt)
	if err != nil {
		writeError(w, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(w, map[string]any{"translation": strings.TrimSpace(translation)})
}

// withRetry validates generated JSON and retries once on schema violations,
// since "almost right" AI output must never reach educators.
func (h *Handler) withRetry(ctx context.Context, systemPrompt, userPrompt string, validate func([]byte) (any, error)) (any, error) {
	var lastErr error
	for attempt := 0; attempt < 2; attempt++ {
		prompt := userPrompt
		if lastErr != nil {
			prompt = fmt.Sprintf("%s\n\nYour previous output was invalid: %v. Fix it and output only the corrected JSON array.", userPrompt, lastErr)
		}
		raw, err := h.ai.GenerateJSON(ctx, systemPrompt, prompt)
		if err != nil {
			return nil, err
		}
		parsed, err := validate(raw)
		if err == nil {
			return parsed, nil
		}
		h.log.Warn("generated blocks failed validation, retrying", slog.Any("error", err))
		lastErr = err
	}
	return nil, fmt.Errorf("AI generated invalid blocks: %w", lastErr)
}

func writeJSON(w http.ResponseWriter, payload any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}
