package handler

import (
	"bytes"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/studed/payment-service/internal/model"
	"github.com/studed/payment-service/internal/payhere"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open in-memory sqlite db: %v", err)
	}

	createTableSQL := `CREATE TABLE IF NOT EXISTS subscriptions (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL,
		tier TEXT NOT NULL,
		status TEXT NOT NULL DEFAULT 'ACTIVE',
		provider TEXT NOT NULL DEFAULT 'manual',
		provider_external_id TEXT,
		start_date DATETIME NOT NULL,
		end_date DATETIME NOT NULL,
		created_at DATETIME,
		updated_at DATETIME
	);`
	if err := db.Exec(createTableSQL).Error; err != nil {
		t.Fatalf("failed to create sqlite subscriptions table: %v", err)
	}

	return db
}

func TestCreateSubscription_Success(t *testing.T) {
	db := setupTestDB(t)
	ph := payhere.Config{}
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	h := New(db, ph, logger)

	mux := http.NewServeMux()
	h.Register(mux)

	body, _ := json.Marshal(map[string]string{
		"user_id": "usr-123",
		"tier":    "STANDARD",
	})

	req := httptest.NewRequest(http.MethodPost, "/v1/subscriptions", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status 201, got %d", rec.Code)
	}

	var sub model.Subscription
	if err := json.NewDecoder(rec.Body).Decode(&sub); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if sub.UserID != "usr-123" || sub.Tier != "STANDARD" || sub.Status != model.SubscriptionStatusActive {
		t.Fatalf("unexpected subscription data: %+v", sub)
	}
}

func TestCreateSubscription_InvalidTier(t *testing.T) {
	db := setupTestDB(t)
	h := New(db, payhere.Config{}, slog.New(slog.NewTextHandler(io.Discard, nil)))

	mux := http.NewServeMux()
	h.Register(mux)

	body, _ := json.Marshal(map[string]string{
		"user_id": "usr-123",
		"tier":    "INVALID_TIER",
	})

	req := httptest.NewRequest(http.MethodPost, "/v1/subscriptions", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rec.Code)
	}
}

func TestCancelSubscription_Success(t *testing.T) {
	db := setupTestDB(t)
	h := New(db, payhere.Config{}, slog.New(slog.NewTextHandler(io.Discard, nil)))

	// Seed existing active subscription
	sub := model.Subscription{
		ID:     uuid.New().String(),
		UserID: "usr-456",
		Tier:   "PREMIUM",
		Status: model.SubscriptionStatusActive,
	}
	db.Create(&sub)

	mux := http.NewServeMux()
	h.Register(mux)

	body, _ := json.Marshal(map[string]string{
		"user_id": "usr-456",
	})

	req := httptest.NewRequest(http.MethodPost, "/v1/subscriptions/cancel", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	var res model.Subscription
	_ = json.NewDecoder(rec.Body).Decode(&res)
	if res.Status != model.SubscriptionStatusCanceled {
		t.Fatalf("expected status CANCELED, got %s", res.Status)
	}
}

func TestGetSubscription_NotFound(t *testing.T) {
	db := setupTestDB(t)
	h := New(db, payhere.Config{}, slog.New(slog.NewTextHandler(io.Discard, nil)))

	mux := http.NewServeMux()
	h.Register(mux)

	req := httptest.NewRequest(http.MethodGet, "/v1/subscriptions/non-existent-user", nil)
	rec := httptest.NewRecorder()

	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status 404, got %d", rec.Code)
	}
}

func TestPayhereNotify_Disabled(t *testing.T) {
	db := setupTestDB(t)
	h := New(db, payhere.Config{}, slog.New(slog.NewTextHandler(io.Discard, nil)))

	mux := http.NewServeMux()
	h.Register(mux)

	form := url.Values{}
	form.Set("merchant_id", "123")

	req := httptest.NewRequest(http.MethodPost, "/v1/payhere/notify", bytes.NewBufferString(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	rec := httptest.NewRecorder()

	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected status 503 when PayHere is disabled, got %d", rec.Code)
	}
}
