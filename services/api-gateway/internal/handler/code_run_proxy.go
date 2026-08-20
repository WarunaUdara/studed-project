package handler

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"time"

	"github.com/studed/api-gateway/internal/middleware"
)

// maxCodeRunBytes bounds a submitted program at the gateway. The ai-service
// applies its own, smaller limit to the code itself.
const maxCodeRunBytes = 256 << 10

// CodeRunProxy forwards a student's program to the ai-service sandbox and
// returns whatever it printed.
//
// Execution happens server side rather than in the browser, so the runtime
// limits (deadline, memory, stripped environment, container isolation) are
// enforced somewhere a student cannot edit. Any signed-in learner may use it;
// the sandbox, not the role check, is what makes that safe.
type CodeRunProxy struct {
	aiServiceURL string
	client       *http.Client
}

func NewCodeRunProxy(aiServiceURL string) *CodeRunProxy {
	return &CodeRunProxy{
		aiServiceURL: aiServiceURL,
		// Comfortably longer than the sandbox deadline, so a timeout is
		// reported by the sandbox with its readable message rather than being
		// cut off here as a gateway error.
		client: &http.Client{Timeout: 30 * time.Second},
	}
}

func (p *CodeRunProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := middleware.UserFromContext(r.Context())
	if !ok || userCtx.UserID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(io.LimitReader(r.Body, maxCodeRunBytes))
	if err != nil {
		http.Error(w, `{"error":"failed to read request body"}`, http.StatusBadRequest)
		return
	}

	var probe struct {
		Code string `json:"code"`
	}
	if err := json.Unmarshal(body, &probe); err != nil || probe.Code == "" {
		http.Error(w, `{"error":"there is no code to run"}`, http.StatusBadRequest)
		return
	}

	upstream, err := http.NewRequestWithContext(r.Context(), http.MethodPost, p.aiServiceURL+"/v1/run-code", bytes.NewReader(body))
	if err != nil {
		http.Error(w, `{"error":"failed to build upstream request"}`, http.StatusInternalServerError)
		return
	}
	upstream.Header.Set("Content-Type", "application/json")

	resp, err := p.client.Do(upstream)
	if err != nil {
		http.Error(w, `{"error":"the code runner is unreachable right now"}`, http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// The sandbox's own status and body are passed through: a crashing program
	// is a 200 with a traceback, and the panel needs both parts verbatim.
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(w, io.LimitReader(resp.Body, maxCodeRunBytes))
}
