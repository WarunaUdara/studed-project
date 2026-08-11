package handler

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"

	"github.com/studed/api-gateway/internal/middleware"
)

// AIChatProxy streams the agentic AI assistant's responses from the
// ai-service to the wave editor chat panel.
//
// The ai-service exposes /v1/agent/stream (SSE: one "data: {event}" line per
// agent event: plan|tool_start|tool_end|delta|done|error). This handler
// authenticates the caller (educator-only), forwards the request verbatim,
// and pipes the SSE stream back to the browser without buffering.
//
// The frontend consumes it with a plain fetch() + ReadableStream reader, so
// no special SSE library or websocket is required on either side.
type AIChatProxy struct {
	aiServiceURL string
	client       *http.Client
}

func NewAIChatProxy(aiServiceURL string) *AIChatProxy {
	return &AIChatProxy{
		aiServiceURL: aiServiceURL,
		client: &http.Client{
			Timeout: 0, // no overall deadline: the stream ends when the agent ends
		},
	}
}

func (p *AIChatProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// The auth middleware attaches the user context but never blocks; enforce
	// educator-only access here, mirroring the GraphQL resolvers.
	userCtx, ok := middleware.UserFromContext(r.Context())
	if !ok || userCtx.UserID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}
	if !userCtx.IsEducator() {
		http.Error(w, `{"error":"forbidden: educator role required"}`, http.StatusForbidden)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(io.LimitReader(r.Body, 15<<20))
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

	upstream, err := http.NewRequestWithContext(r.Context(), http.MethodPost, p.aiServiceURL+"/v1/agent/stream", bytes.NewReader(body))
	if err != nil {
		http.Error(w, `{"error":"failed to build upstream request"}`, http.StatusInternalServerError)
		return
	}
	upstream.Header.Set("Content-Type", "application/json")

	resp, err := p.client.Do(upstream)
	if err != nil {
		http.Error(w, `{"error":"AI service unreachable: `+err.Error()+`"}`, http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		raw, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		http.Error(w, `{"error":"AI service error: `+string(raw)+`"}`, http.StatusBadGateway)
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
