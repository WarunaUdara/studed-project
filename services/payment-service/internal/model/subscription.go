package model

import "time"

type SubscriptionStatus string

const (
	SubscriptionStatusActive   SubscriptionStatus = "ACTIVE"
	SubscriptionStatusCanceled SubscriptionStatus = "CANCELED"
	SubscriptionStatusExpired  SubscriptionStatus = "EXPIRED"
)

type Subscription struct {
	ID     string             `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID string             `gorm:"not null;index" json:"user_id"`
	Tier   string             `gorm:"not null" json:"tier"`
	Status SubscriptionStatus `gorm:"not null;default:'ACTIVE'" json:"status"`

	// Provider fields for the future PayHere/Stripe integration; "manual"
	// until a real gateway is connected.
	Provider           string `gorm:"not null;default:'manual'" json:"provider"`
	ProviderExternalID string `json:"provider_external_id,omitempty"`

	StartDate time.Time `gorm:"not null" json:"start_date"`
	EndDate   time.Time `gorm:"not null" json:"end_date"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

func (Subscription) TableName() string {
	return "subscriptions"
}
