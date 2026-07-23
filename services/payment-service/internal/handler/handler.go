package handler

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/studed/payment-service/internal/model"
	"github.com/studed/payment-service/internal/payhere"
	"gorm.io/gorm"
)

var validTiers = map[string]bool{
	"BASIC":    true,
	"STANDARD": true,
	"PREMIUM":  true,
	"SCHOOL":   true,
}

type Handler struct {
	db      *gorm.DB
	payhere payhere.Config
	log     *slog.Logger
}

func New(db *gorm.DB, ph payhere.Config, log *slog.Logger) *Handler {
	return &Handler{db: db, payhere: ph, log: log}
}

func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("POST /v1/subscriptions", h.createSubscription)
	mux.HandleFunc("POST /v1/subscriptions/cancel", h.cancelSubscription)
	mux.HandleFunc("GET /v1/subscriptions/{userID}", h.getSubscription)
	mux.HandleFunc("POST /v1/payhere/notify", h.payhereNotify)
}

type createRequest struct {
	UserID string `json:"user_id"`
	Tier   string `json:"tier"`
}

type cancelRequest struct {
	UserID string `json:"user_id"`
}

func (h *Handler) createSubscription(w http.ResponseWriter, r *http.Request) {
	var req createRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.UserID == "" {
		writeError(w, http.StatusBadRequest, "user_id is required")
		return
	}
	req.Tier = strings.ToUpper(strings.TrimSpace(req.Tier))
	if !validTiers[req.Tier] {
		writeError(w, http.StatusBadRequest, "invalid tier")
		return
	}

	// Reuse an active subscription instead of stacking duplicates.
	var existing model.Subscription
	err := h.db.WithContext(r.Context()).
		Where("user_id = ? AND status = ?", req.UserID, model.SubscriptionStatusActive).
		Where("end_date > ?", time.Now()).
		First(&existing).Error
	if err == nil {
		if existing.Tier == req.Tier {
			writeJSON(w, http.StatusOK, existing)
			return
		}
		// Tier change: cancel the old subscription, then create the new one.
		existing.Status = model.SubscriptionStatusCanceled
		if err := h.db.WithContext(r.Context()).Save(&existing).Error; err != nil {
			writeError(w, http.StatusInternalServerError, "failed to replace subscription")
			return
		}
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		writeError(w, http.StatusInternalServerError, "failed to check existing subscription")
		return
	}

	now := time.Now()
	sub := model.Subscription{
		ID:        uuid.New().String(),
		UserID:    req.UserID,
		Tier:      req.Tier,
		Status:    model.SubscriptionStatusActive,
		Provider:  "manual",
		StartDate: now,
		EndDate:   now.AddDate(0, 1, 0),
	}
	if err := h.db.WithContext(r.Context()).Create(&sub).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create subscription")
		return
	}
	writeJSON(w, http.StatusCreated, sub)
}

func (h *Handler) cancelSubscription(w http.ResponseWriter, r *http.Request) {
	var req cancelRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.UserID == "" {
		writeError(w, http.StatusBadRequest, "user_id is required")
		return
	}

	var sub model.Subscription
	err := h.db.WithContext(r.Context()).
		Where("user_id = ? AND status = ?", req.UserID, model.SubscriptionStatusActive).
		Order("created_at DESC").
		First(&sub).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		writeError(w, http.StatusNotFound, "no active subscription")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load subscription")
		return
	}

	sub.Status = model.SubscriptionStatusCanceled
	if err := h.db.WithContext(r.Context()).Save(&sub).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "failed to cancel subscription")
		return
	}
	writeJSON(w, http.StatusOK, sub)
}

func (h *Handler) getSubscription(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("userID")
	if userID == "" {
		writeError(w, http.StatusBadRequest, "user id is required")
		return
	}

	var sub model.Subscription
	err := h.db.WithContext(r.Context()).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		First(&sub).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		writeError(w, http.StatusNotFound, "no subscription")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load subscription")
		return
	}

	// Reflect expiry lazily on read.
	if sub.Status == model.SubscriptionStatusActive && sub.EndDate.Before(time.Now()) {
		sub.Status = model.SubscriptionStatusExpired
		_ = h.db.WithContext(r.Context()).Save(&sub).Error
	}
	writeJSON(w, http.StatusOK, sub)
}

// payhereNotify handles PayHere's server-to-server payment notification.
// Until merchant credentials are configured this endpoint rejects requests,
// but the signature verification flow is production-ready.
func (h *Handler) payhereNotify(w http.ResponseWriter, r *http.Request) {
	if !h.payhere.Enabled() {
		writeError(w, http.StatusServiceUnavailable, "payhere is not configured")
		return
	}
	if err := r.ParseForm(); err != nil {
		writeError(w, http.StatusBadRequest, "invalid form payload")
		return
	}

	if !h.payhere.VerifyNotification(
		r.FormValue("merchant_id"),
		r.FormValue("order_id"),
		r.FormValue("payhere_amount"),
		r.FormValue("payhere_currency"),
		r.FormValue("status_code"),
		r.FormValue("md5sig"),
	) {
		writeError(w, http.StatusForbidden, "invalid signature")
		return
	}

	// status_code 2 means a successful PayHere payment.
	if r.FormValue("status_code") == "2" {
		orderID := r.FormValue("order_id")
		if err := h.db.WithContext(r.Context()).
			Model(&model.Subscription{}).
			Where("id = ?", orderID).
			Updates(map[string]any{
				"provider":             "payhere",
				"provider_external_id": r.FormValue("payment_id"),
				"status":               model.SubscriptionStatusActive,
			}).Error; err != nil {
			h.log.Error("failed to activate payhere subscription", slog.String("order_id", orderID), slog.Any("error", err))
			writeError(w, http.StatusInternalServerError, "failed to activate subscription")
			return
		}
	}
	w.WriteHeader(http.StatusOK)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
