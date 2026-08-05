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

// authenticatedUserID returns the caller identity as verified by the API
// gateway. Internal endpoints never trust a client-supplied user_id.
func authenticatedUserID(r *http.Request) string {
	return strings.TrimSpace(r.Header.Get("X-Authenticated-User-ID"))
}

func New(db *gorm.DB, ph payhere.Config, log *slog.Logger) *Handler {
	return &Handler{db: db, payhere: ph, log: log}
}

func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("POST /v1/subscriptions", h.createSubscription)
	mux.HandleFunc("POST /v1/subscriptions/cancel", h.cancelSubscription)
	mux.HandleFunc("GET /v1/subscriptions", h.getSubscription)
	mux.HandleFunc("POST /v1/payhere/notify", h.payhereNotify)
}

type createRequest struct {
	Tier string `json:"tier"`
}

type cancelRequest struct{}

func (h *Handler) createSubscription(w http.ResponseWriter, r *http.Request) {
	userID := authenticatedUserID(r)
	if userID == "" {
		writeError(w, http.StatusUnauthorized, "unauthenticated")
		return
	}

	var req createRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
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
		Where("user_id = ? AND status = ?", userID, model.SubscriptionStatusActive).
		Where("end_date > ?", time.Now()).
		First(&existing).Error
	if err == nil {
		writeJSON(w, http.StatusOK, existing)
		return
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		writeError(w, http.StatusInternalServerError, "failed to check existing subscription")
		return
	}

	// New subscriptions start PENDING; they are only activated once a verified
	// PayHere notification confirms the payment. This prevents a caller from
	// granting themselves premium access through the API.
	now := time.Now()
	sub := model.Subscription{
		ID:        uuid.New().String(),
		UserID:    userID,
		Tier:      req.Tier,
		Status:    model.SubscriptionStatusPending,
		Provider:  "payhere",
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
	userID := authenticatedUserID(r)
	if userID == "" {
		writeError(w, http.StatusUnauthorized, "unauthenticated")
		return
	}

	var sub model.Subscription
	err := h.db.WithContext(r.Context()).
		Where("user_id = ? AND status = ?", userID, model.SubscriptionStatusActive).
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
	userID := authenticatedUserID(r)
	if userID == "" {
		writeError(w, http.StatusUnauthorized, "unauthenticated")
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
// The endpoint is public but only a request carrying a valid PayHere
// signature (and matching merchant_id) can activate a subscription.
func (h *Handler) payhereNotify(w http.ResponseWriter, r *http.Request) {
	if !h.payhere.Enabled() {
		writeError(w, http.StatusServiceUnavailable, "payhere is not configured")
		return
	}
	if err := r.ParseForm(); err != nil {
		writeError(w, http.StatusBadRequest, "invalid form payload")
		return
	}

	merchantID := r.FormValue("merchant_id")
	if merchantID != h.payhere.MerchantID {
		writeError(w, http.StatusForbidden, "invalid merchant")
		return
	}

	if !h.payhere.VerifyNotification(
		merchantID,
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
		var sub model.Subscription
		err := h.db.WithContext(r.Context()).Where("id = ?", orderID).First(&sub).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			writeError(w, http.StatusNotFound, "unknown order")
			return
		}
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to load order")
			return
		}
		// Idempotent: a notification that already activated the order is a no-op.
		if sub.Status != model.SubscriptionStatusActive {
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
