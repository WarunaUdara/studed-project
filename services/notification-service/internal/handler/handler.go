package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"

	"github.com/studed/notification-service/internal/model"
	"gorm.io/gorm"
)

// Handler serves in-app notifications. Email/SMS channels are intentionally
// absent until budget allows; adding one means implementing a sender that
// consumes the same notification records.
type Handler struct {
	db  *gorm.DB
	log *slog.Logger
}

func New(db *gorm.DB, log *slog.Logger) *Handler {
	return &Handler{db: db, log: log}
}

func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("POST /v1/notifications", h.create)
	mux.HandleFunc("GET /v1/notifications/{userID}", h.list)
	mux.HandleFunc("POST /v1/notifications/read", h.markRead)
}

type createRequest struct {
	UserID string `json:"user_id"`
	Type   string `json:"type"`
	Title  string `json:"title"`
	Body   string `json:"body"`
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	var req createRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.UserID == "" || strings.TrimSpace(req.Title) == "" {
		writeError(w, http.StatusBadRequest, "user_id and title are required")
		return
	}

	notificationType := model.NotificationType(strings.ToUpper(req.Type))
	switch notificationType {
	case model.NotificationTypeSystem, model.NotificationTypeAchievement, model.NotificationTypeCourse, model.NotificationTypeStreak:
	default:
		notificationType = model.NotificationTypeSystem
	}

	notification := model.Notification{
		UserID: req.UserID,
		Type:   notificationType,
		Title:  strings.TrimSpace(req.Title),
		Body:   strings.TrimSpace(req.Body),
	}
	if err := h.db.WithContext(r.Context()).Create(&notification).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create notification")
		return
	}
	writeJSON(w, http.StatusCreated, notification)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("userID")
	if userID == "" {
		writeError(w, http.StatusBadRequest, "user id is required")
		return
	}

	query := h.db.WithContext(r.Context()).Where("user_id = ?", userID)
	if r.URL.Query().Get("unread") == "true" {
		query = query.Where("is_read = false")
	}

	var notifications []model.Notification
	if err := query.Order("created_at DESC").Limit(100).Find(&notifications).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list notifications")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"notifications": notifications})
}

type markReadRequest struct {
	UserID         string `json:"user_id"`
	NotificationID string `json:"notification_id"`
}

func (h *Handler) markRead(w http.ResponseWriter, r *http.Request) {
	var req markReadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.UserID == "" {
		writeError(w, http.StatusBadRequest, "user_id is required")
		return
	}

	query := h.db.WithContext(r.Context()).
		Model(&model.Notification{}).
		Where("user_id = ?", req.UserID)
	if req.NotificationID != "" {
		query = query.Where("id = ?", req.NotificationID)
	}
	if err := query.Update("is_read", true).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "failed to mark notifications read")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
