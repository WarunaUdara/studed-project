package handler

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"

	"github.com/studed/api-gateway/internal/middleware"
)

// maxStudentAskBytes bounds a student question. The educator chat carries
// base64 images and needs megabytes; a student sends a sentence, so anything
// larger is either a mistake or an attempt to use the tutor as a file pipe.
const maxStudentAskBytes = 64 << 10

// StudentAskProxy streams lesson help from the ai-service to the student wave
// player.
//
// It is deliberately separate from AIChatProxy, which is educator-only and
// forwards to the agent loop with content-authoring tools attached. This one
// reaches /v1/ask, where no tools exist, so a student cannot drive block
// generation or mutate a course through the chat box.
type StudentAskProxy struct {
	aiServiceURL string
	client       *http.Client
}

func NewStudentAskProxy(aiServiceURL string) *StudentAskProxy {
	return &StudentAskProxy{
		aiServiceURL: aiServiceURL,
		client:       &http.Client{Timeout: 0},
	}
}

func (p *StudentAskProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := middleware.UserFromContext(r.Context())
	if !ok || userCtx.UserID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(io.LimitReader(r.Body, maxStudentAskBytes))
	if err != nil {
		http.Error(w, `{"error":"failed to read request body"}`, http.StatusBadRequest)
		return
	}

	var probe struct {
		Prompt string `json:"prompt"`
	}
	if err := json.Unmarshal(body, &probe); err != nil || probe.Prompt == "" {
		http.Error(w, `{"error":"prompt is required"}`, http.StatusBadRequest)
		return
	}

	upstream, err := http.NewRequestWithContext(r.Context(), http.MethodPost, p.aiServiceURL+"/v1/ask", bytes.NewReader(body))
	if err != nil {
		http.Error(w, `{"error":"failed to build upstream request"}`, http.StatusInternalServerError)
		return
	}
	upstream.Header.Set("Content-Type", "application/json")

	resp, err := p.client.Do(upstream)
	if err != nil {
		http.Error(w, `{"error":"the tutor is unreachable right now"}`, http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		// Upstream detail is logged by the ai-service; the student sees a
		// message they can act on rather than a provider error.
		http.Error(w, `{"error":"the tutor is not available right now"}`, http.StatusBadGateway)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
	w.WriteHeader(http.StatusOK)

	flusher, _ := w.(http.Flusher)
	buf := make([]byte, 32*1024)
	for {
		n, readErr := resp.Body.Read(buf)
		if n > 0 {
			if _, writeErr := w.Write(buf[:n]); writeErr != nil {
				return
			}
			if flusher != nil {
				flusher.Flush()
			}
		}
		if readErr != nil {
			return
		}
	}
}
