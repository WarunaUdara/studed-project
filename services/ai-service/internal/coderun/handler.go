package coderun

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
)

// Handler exposes the runner over HTTP. It is registered independently of the
// LLM provider, so a deployment with no model key can still run the coding
// waves.
type Handler struct {
	runner *Runner
	log    *slog.Logger
	// maxBodyBytes bounds the request before it is parsed; the runner applies
	// its own limit to the program itself.
	maxBodyBytes int64
}

func NewHandler(runner *Runner, log *slog.Logger) *Handler {
	return &Handler{runner: runner, log: log, maxBodyBytes: 1 << 20}
}

func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("POST /v1/run-code", h.runCode)
}

func (h *Handler) runCode(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, h.maxBodyBytes)

	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "could not read the program"})
		return
	}
	if req.Code == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "there is no code to run"})
		return
	}

	result, err := h.runner.Run(r.Context(), req)
	switch {
	case errors.Is(err, ErrUnavailable):
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{
			"error": "running code is not available on this server yet",
		})
		return
	case errors.Is(err, ErrCodeTooLarge):
		writeJSON(w, http.StatusRequestEntityTooLarge, map[string]string{
			"error": "that program is too long to run here",
		})
		return
	case err != nil:
		h.log.Warn("code run failed", slog.Any("error", err))
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "the program could not be started",
		})
		return
	}

	writeJSON(w, http.StatusOK, result)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
