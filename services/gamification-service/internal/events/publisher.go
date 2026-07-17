package events

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/redis/go-redis/v9"
)

// Redis pub/sub channels shared with the api-gateway subscription resolvers.
const (
	ChannelXp          = "studed:events:xp"
	ChannelAchievement = "studed:events:achievement"
)

type XpAwardedEvent struct {
	UserID   string `json:"user_id"`
	SourceID string `json:"source_id"`
	Amount   int32  `json:"amount"`
	TotalXp  int32  `json:"total_xp"`
	Reason   string `json:"reason"`
}

type AchievementUnlockedEvent struct {
	UserID         string `json:"user_id"`
	ID             string `json:"id"`
	Name           string `json:"name"`
	Description    string `json:"description"`
	IconURL        string `json:"icon_url"`
	UnlockedAtUnix int64  `json:"unlocked_at_unix"`
}

type Publisher struct {
	rdb *redis.Client
}

func NewPublisher(rdb *redis.Client) *Publisher {
	return &Publisher{rdb: rdb}
}

func (p *Publisher) publish(ctx context.Context, channel string, payload any) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}
	if err := p.rdb.Publish(ctx, channel, data).Err(); err != nil {
		return fmt.Errorf("failed to publish event: %w", err)
	}
	return nil
}

func (p *Publisher) PublishXpAwarded(ctx context.Context, e XpAwardedEvent) error {
	return p.publish(ctx, ChannelXp, e)
}

func (p *Publisher) PublishAchievementUnlocked(ctx context.Context, e AchievementUnlockedEvent) error {
	return p.publish(ctx, ChannelAchievement, e)
}
