package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"

	"github.com/studed/ai-service/internal/agent"
	"github.com/studed/ai-service/internal/provider"
	"github.com/studed/ai-service/internal/tools"
	"github.com/studed/ai-service/internal/vision"
)

// Handler exposes the AI service HTTP surface. The three legacy endpoints
// (generate-learn-blocks, generate-evaluate-blocks, translate) are kept
// byte-compatible with the api-gateway client; the rest are new.
type Handler struct {
	provider     provider.Provider
	agent        *agent.Agent
	vision       *vision.Client
	log          *slog.Logger
	maxBodyBytes int64
}

// New builds the handler. maxBodyBytes bounds request bodies; values <= 0
// fall back to 15MB (multi-image uploads need headroom beyond 2MB).
func New(p provider.Provider, a *agent.Agent, v *vision.Client, log *slog.Logger, maxBodyBytes int64) *Handler {
	if maxBodyBytes <= 0 {
		maxBodyBytes = 15 << 20
	}
	return &Handler{provider: p, agent: a, vision: v, log: log, maxBodyBytes: maxBodyBytes}
}

func (h *Handler) Register(mux *http.ServeMux) {
	// Legacy endpoints (byte-compatible).
	mux.HandleFunc("POST /v1/generate-learn-blocks", h.generateLearnBlocks)
	mux.HandleFunc("POST /v1/generate-evaluate-blocks", h.generateEvaluateBlocks)
	mux.HandleFunc("POST /v1/translate", h.translate)

	// New endpoints.
	mux.HandleFunc("POST /v1/generate-visualization", h.generateVisualization)
	mux.HandleFunc("POST /v1/analyze-image", h.analyzeImage)
	mux.HandleFunc("POST /v1/agent/task", h.agentTask)
	mux.HandleFunc("POST /v1/agent/stream", h.agentStream)
}

// ---- Request / response types -------------------------------------------------

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

type visualizationRequest struct {
	Concept string `json:"concept"`
	VizType string `json:"vizType"` // manim | 3dmol | tscircuit | matterjs
	Grade   string `json:"grade"`
}

type analyzeImageRequest struct {
	ImageBase64 string `json:"imageBase64"`
	Prompt      string `json:"prompt,omitempty"`
}

type agentRequest struct {
	Prompt      string   `json:"prompt"`
	Language    string   `json:"language,omitempty"`
	Grade       string   `json:"grade,omitempty"`
	WaveContext string   `json:"waveContext,omitempty"`
	Images      []string `json:"images,omitempty"` // base64 data URLs
}

// ---- Legacy endpoints ----------------------------------------------------------

func (h *Handler) generateLearnBlocks(w http.ResponseWriter, r *http.Request) {
	var req learnRequest
	if err := h.decode(w, r, &req); err != nil {
		return
	}
	if strings.TrimSpace(req.Prompt) == "" {
		writeError(w, http.StatusBadRequest, "prompt is required")
		return
	}
	if req.Language == "" {
		req.Language = "English"
	}
	if req.Grade == "" {
		req.Grade = "unspecified"
	}

	res, err := tools.LearnBlocks(h.provider).Execute(r.Context(), map[string]any{
		"prompt":   req.Prompt,
		"language": req.Language,
		"grade":    req.Grade,
	})
	if err != nil {
		writeError(w, http.StatusBadGateway, err.Error())
		return
	}
	if len(res.Blocks) == 0 {
		writeError(w, http.StatusBadGateway, res.Content)
		return
	}
	writeJSON(w, map[string]any{"blocks": res.Blocks})
}

func (h *Handler) generateEvaluateBlocks(w http.ResponseWriter, r *http.Request) {
	var req evaluateRequest
	if err := h.decode(w, r, &req); err != nil {
		return
	}
	if strings.TrimSpace(req.Content) == "" {
		writeError(w, http.StatusBadRequest, "content is required")
		return
	}
	if req.Count <= 0 {
		req.Count = 3
	}
	if req.Count > 10 {
		req.Count = 10
	}

	res, err := tools.EvaluateBlocks(h.provider).Execute(r.Context(), map[string]any{
		"content": req.Content,
		"count":   req.Count,
	})
	if err != nil {
		writeError(w, http.StatusBadGateway, err.Error())
		return
	}
	if len(res.EvalBlocks) == 0 {
		writeError(w, http.StatusBadGateway, res.Content)
		return
	}
	writeJSON(w, map[string]any{"blocks": res.EvalBlocks})
}

func (h *Handler) translate(w http.ResponseWriter, r *http.Request) {
	var req translateRequest
	if err := h.decode(w, r, &req); err != nil {
		return
	}
	if strings.TrimSpace(req.Content) == "" || strings.TrimSpace(req.TargetLanguage) == "" {
		writeError(w, http.StatusBadRequest, "content and target_language are required")
		return
	}

	res, err := tools.Translate(h.provider).Execute(r.Context(), map[string]any{
		"content":        req.Content,
		"targetLanguage": req.TargetLanguage,
	})
	if err != nil {
		writeError(w, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(w, map[string]any{"translation": strings.TrimSpace(res.Content)})
}

// ---- New endpoints ---------------------------------------------------------------

func (h *Handler) generateVisualization(w http.ResponseWriter, r *http.Request) {
	var req visualizationRequest
	if err := h.decode(w, r, &req); err != nil {
		return
	}
	if strings.TrimSpace(req.Concept) == "" {
		writeError(w, http.StatusBadRequest, "concept is required")
		return
	}
	req.VizType = strings.ToLower(strings.TrimSpace(req.VizType))
	switch req.VizType {
	case "manim", "3dmol", "tscircuit", "matterjs":
	default:
		writeError(w, http.StatusBadRequest, "vizType must be one of manim|3dmol|tscircuit|matterjs")
		return
	}
	if req.Grade == "" {
		req.Grade = "unspecified"
	}

	res, err := tools.Visualization(h.provider).Execute(r.Context(), map[string]any{
		"concept": req.Concept,
		"vizType": req.VizType,
		"grade":   req.Grade,
	})
	if err != nil {
		writeError(w, http.StatusBadGateway, err.Error())
		return
	}
	if res.VizBlock == nil {
		writeError(w, http.StatusBadGateway, res.Content)
		return
	}
	writeJSON(w, map[string]any{"block": res.VizBlock})
}

func (h *Handler) analyzeImage(w http.ResponseWriter, r *http.Request) {
	var req analyzeImageRequest
	if err := h.decode(w, r, &req); err != nil {
		return
	}
	if strings.TrimSpace(req.ImageBase64) == "" {
		writeError(w, http.StatusBadRequest, "imageBase64 is required")
		return
	}

	analysis, err := h.vision.AnalyzeImage(r.Context(), req.ImageBase64, req.Prompt)
	if err != nil {
		writeError(w, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(w, map[string]any{"analysis": analysis})
}

func (h *Handler) agentTask(w http.ResponseWriter, r *http.Request) {
	var req agentRequest
	if err := h.decode(w, r, &req); err != nil {
		return
	}
	if strings.TrimSpace(req.Prompt) == "" {
		writeError(w, http.StatusBadRequest, "prompt is required")
		return
	}

	events := make(chan agent.Event)
	go func() {
		ocrCtx, ocrErr := h.ocrImages(r.Context(), req, events)
		if ocrErr != nil {
			events <- agent.Event{Type: "error", Error: ocrErr.Error()}
			return
		}
		h.agent.Run(r.Context(), agent.Request{
			Prompt:      req.Prompt,
			Language:    req.Language,
			Grade:       req.Grade,
			WaveContext: req.WaveContext,
			Images:      req.Images,
			OCRContext:  ocrCtx,
		}, events)
	}()

	var final agent.Event
	lastErr := ""
	for ev := range events {
		switch ev.Type {
		case "done":
			final = ev
		case "error":
			lastErr = ev.Error
		}
	}
	if final.Type == "done" {
		writeJSON(w, map[string]any{
			"message":        final.Message,
			"learnBlocks":    final.LearnBlocks,
			"evaluateBlocks": final.EvaluateBlocks,
		})
		return
	}
	if lastErr != "" {
		writeError(w, http.StatusBadGateway, lastErr)
		return
	}
	writeError(w, http.StatusBadGateway, "agent produced no result")
}

func (h *Handler) agentStream(w http.ResponseWriter, r *http.Request) {
	var req agentRequest
	if err := h.decode(w, r, &req); err != nil {
		return
	}
	if strings.TrimSpace(req.Prompt) == "" {
		writeError(w, http.StatusBadRequest, "prompt is required")
		return
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		writeError(w, http.StatusInternalServerError, "streaming unsupported")
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	// Disable compression middleware interference and timeouts for the stream.
	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()

	events := make(chan agent.Event)
	go func() {
		// Run OCR (if images uploaded) before the agent loop, so extracted
		// text becomes part of the generation context.
		ocrCtx, ocrErr := h.ocrImages(ctx, req, events)
		if ocrErr != nil {
			events <- agent.Event{Type: "error", Error: ocrErr.Error()}
			return
		}
		h.agent.Run(ctx, agent.Request{
			Prompt:      req.Prompt,
			Language:    req.Language,
			Grade:       req.Grade,
			WaveContext: req.WaveContext,
			Images:      req.Images,
			OCRContext:  ocrCtx,
		}, events)
	}()

	for ev := range events {
		payload, err := json.Marshal(ev)
		if err != nil {
			break
		}
		if _, err := fmt.Fprintf(w, "data: %s\n\n", payload); err != nil {
			h.log.Warn("agent stream write failed", slog.Any("error", err))
			return
		}
		flusher.Flush()
	}
}

// ---- helpers ---------------------------------------------------------------------

// ocrImages runs high-effort vision analysis (qwen3.7-plus with
// reasoning_effort=high) over uploaded images and returns a compact context
// block summarizing the extracted text and detected structure. It streams an
// "ocr" agent event so the UI can show progress. Failures are returned as
// errors — an educator should not silently lose uploaded content.
func (h *Handler) ocrImages(ctx context.Context, req agentRequest, events chan<- agent.Event) (string, error) {
	if len(req.Images) == 0 {
		return "", nil
	}
	if h.vision == nil {
		return "", fmt.Errorf("vision is not configured")
	}
	events <- agent.Event{Type: "ocr", Message: "Analyzing uploaded images (high-effort OCR)..."}

	analysis, err := h.vision.AnalyzeImages(ctx, req.Images, defaultOCRPrompt)
	if err != nil {
		return "", fmt.Errorf("image analysis failed: %w", err)
	}
	if strings.TrimSpace(analysis.ExtractedText) == "" {
		return "", fmt.Errorf("image analysis returned no text")
	}

	var b strings.Builder
	b.WriteString("contentType: " + analysis.ContentType + "\n")
	b.WriteString("detectedLanguage: " + analysis.DetectedLanguage + "\n")
	if len(analysis.Subjects) > 0 {
		b.WriteString("subjects: " + strings.Join(analysis.Subjects, ", ") + "\n")
	}
	if len(analysis.KeyConcepts) > 0 {
		b.WriteString("keyConcepts: " + strings.Join(analysis.KeyConcepts, ", ") + "\n")
	}
	if analysis.SuggestedVisualization != "" && analysis.SuggestedVisualization != "none" {
		b.WriteString("suggestedVisualization: " + analysis.SuggestedVisualization + "\n")
	}
	b.WriteString("extractedText:\n" + analysis.ExtractedText)
	return b.String(), nil
}

const defaultOCRPrompt = "Analyze the uploaded images and extract all educational content: transcribe handwritten or printed text verbatim (preserving equations and Sinhala/Tamil script), describe diagrams, and list the topics covered. Be thorough — this text will be used to generate lesson content."

func (h *Handler) decode(w http.ResponseWriter, r *http.Request, dst any) error {
	r.Body = http.MaxBytesReader(w, r.Body, h.maxBodyBytes)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		var msg string
		if err == io.EOF {
			msg = "empty request body"
		} else {
			msg = fmt.Sprintf("invalid request body: %v", err)
		}
		writeError(w, http.StatusBadRequest, msg)
		return err
	}
	return nil
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
