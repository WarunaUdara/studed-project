package handler

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"

	"github.com/studed/ai-service/internal/provider"
)

// askRequest is the student tutor's input. It is deliberately narrower than
// agentRequest: a student cannot upload images, call tools, or generate blocks.
type askRequest struct {
	Prompt      string             `json:"prompt"`
	Language    string             `json:"language"`
	Grade       string             `json:"grade"`
	WaveContext string             `json:"waveContext"`
	History     []provider.Message `json:"history"`
}

// askEvent mirrors the shape the frontend chat panel already parses, so the
// student panel and the educator panel read the same stream format.
type askEvent struct {
	Type    string `json:"type"`
	Message string `json:"message,omitempty"`
	Error   string `json:"error,omitempty"`
}

const (
	maxAskPromptChars  = 1000
	maxAskContextChars = 4000
	maxAskHistoryTurns = 8
)

// studentTutorSystem keeps the assistant inside the lesson and inside the
// vocabulary of a child. It answers, it does not do the work: a student who
// asks for the answer to their own evaluate question gets a nudge instead,
// because handing it over is the one thing that would make the feature
// worthless to the student it is meant to help.
const studentTutorSystem = `You are Blobby, a friendly science and maths teacher for Sri Lankan school children.

Rules you always follow:
- Answer in short, simple sentences a child can read on their own.
- Use everyday examples from a Sri Lankan child's life (a roti, a school bus, a cricket ball).
- Stay on the lesson the student is working through. If they ask about something else, answer very briefly and bring them back.
- Never give away the answer to a question they are being marked on. Ask them what they think, or point at the part of the lesson that helps.
- Never ask for the student's name, school, address, or any other personal detail.
- If you do not know, say so plainly.
- Keep every reply under 120 words.`

func truncate(s string, max int) string {
	s = strings.TrimSpace(s)
	if len(s) <= max {
		return s
	}
	return s[:max] + "..."
}

// ask streams a plain tutoring answer for a student. No tools are offered to
// the model, so this endpoint cannot generate or mutate course content.
func (h *Handler) ask(w http.ResponseWriter, r *http.Request) {
	var req askRequest
	if err := h.decode(w, r, &req); err != nil {
		return
	}

	prompt := truncate(req.Prompt, maxAskPromptChars)
	if prompt == "" {
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

	messages := buildAskMessages(req, prompt)

	events, err := h.provider.Stream(r.Context(), messages, nil, provider.Options{
		Temperature: 0.4,
		MaxTokens:   400,
	})
	if err != nil {
		writeAskEvent(w, flusher, askEvent{Type: "error", Error: "the tutor is not available right now"})
		h.log.Warn("student ask stream failed to start", slog.Any("error", err))
		return
	}

	for ev := range events {
		switch ev.Type {
		case "text_delta":
			if ev.Delta != "" {
				writeAskEvent(w, flusher, askEvent{Type: "delta", Message: ev.Delta})
			}
		case "error":
			writeAskEvent(w, flusher, askEvent{Type: "error", Error: "the tutor could not finish that answer"})
			h.log.Warn("student ask stream error", slog.Any("error", ev.Error))
			return
		case "done":
			writeAskEvent(w, flusher, askEvent{Type: "done"})
			return
		}
	}
	writeAskEvent(w, flusher, askEvent{Type: "done"})
}

// buildAskMessages assembles the tutor conversation: system rules, the lesson
// the student is on, a bounded slice of recent turns, then the question.
func buildAskMessages(req askRequest, prompt string) []provider.Message {
	system := studentTutorSystem
	if grade := strings.TrimSpace(req.Grade); grade != "" {
		system += fmt.Sprintf("\n\nThe student is in grade %s. Pitch every explanation at that level.", grade)
	}
	if lang := strings.TrimSpace(req.Language); lang != "" && !strings.EqualFold(lang, "en") {
		system += fmt.Sprintf("\n\nReply in the student's preferred language: %s.", lang)
	}
	if ctx := truncate(req.WaveContext, maxAskContextChars); ctx != "" {
		system += "\n\nThis is the lesson the student is working through:\n" + ctx
	}

	messages := []provider.Message{{Role: "system", Content: system}}

	history := req.History
	if len(history) > maxAskHistoryTurns {
		history = history[len(history)-maxAskHistoryTurns:]
	}
	for _, turn := range history {
		if turn.Role != "user" && turn.Role != "assistant" {
			continue
		}
		content := truncate(turn.Content, maxAskPromptChars)
		if content == "" {
			continue
		}
		// Images and tool calls are dropped: a student turn is text only.
		messages = append(messages, provider.Message{Role: turn.Role, Content: content})
	}

	return append(messages, provider.Message{Role: "user", Content: prompt})
}

func writeAskEvent(w http.ResponseWriter, flusher http.Flusher, ev askEvent) {
	payload, err := json.Marshal(ev)
	if err != nil {
		return
	}
	if _, err := fmt.Fprintf(w, "data: %s\n\n", payload); err != nil {
		return
	}
	flusher.Flush()
}
