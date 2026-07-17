package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/studed/api-gateway/graph/model"
)

// PaymentClient talks to the payment-service over HTTP/JSON.
type PaymentClient struct {
	baseURL string
	http    *http.Client
}

func NewPaymentClient(baseURL string) *PaymentClient {
	return &PaymentClient{
		baseURL: baseURL,
		http:    &http.Client{Timeout: 15 * time.Second},
	}
}

type subscriptionResponse struct {
	ID        string    `json:"id"`
	Tier      string    `json:"tier"`
	Status    string    `json:"status"`
	StartDate time.Time `json:"start_date"`
	EndDate   time.Time `json:"end_date"`
	Error     string    `json:"error"`
}

func (c *PaymentClient) request(ctx context.Context, method, path string, reqBody any) (*model.UserSubscription, error) {
	var body *bytes.Reader
	if reqBody != nil {
		payload, err := json.Marshal(reqBody)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal payment request: %w", err)
		}
		body = bytes.NewReader(payload)
	} else {
		body = bytes.NewReader(nil)
	}

	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, body)
	if err != nil {
		return nil, fmt.Errorf("failed to build payment request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("payment service unreachable: %w", err)
	}
	defer resp.Body.Close()

	var parsed subscriptionResponse
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return nil, fmt.Errorf("failed to decode payment response: %w", err)
	}
	if resp.StatusCode >= 400 {
		if parsed.Error != "" {
			return nil, fmt.Errorf("payment service error: %s", parsed.Error)
		}
		return nil, fmt.Errorf("payment service returned status %d", resp.StatusCode)
	}

	return &model.UserSubscription{
		ID:        parsed.ID,
		Tier:      model.Tier(parsed.Tier),
		Status:    model.SubscriptionStatus(parsed.Status),
		StartDate: parsed.StartDate,
		EndDate:   parsed.EndDate,
	}, nil
}

func (c *PaymentClient) CreateSubscription(ctx context.Context, userID string, tier model.Tier) (*model.UserSubscription, error) {
	return c.request(ctx, http.MethodPost, "/v1/subscriptions", map[string]string{
		"user_id": userID,
		"tier":    string(tier),
	})
}

func (c *PaymentClient) CancelSubscription(ctx context.Context, userID string) (*model.UserSubscription, error) {
	return c.request(ctx, http.MethodPost, "/v1/subscriptions/cancel", map[string]string{
		"user_id": userID,
	})
}

func (c *PaymentClient) GetSubscription(ctx context.Context, userID string) (*model.UserSubscription, error) {
	return c.request(ctx, http.MethodGet, "/v1/subscriptions/"+userID, nil)
}
