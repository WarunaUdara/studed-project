package events

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"

	"github.com/redis/go-redis/v9"
)

// Redis pub/sub channels; the xp and achievement channels are published by
// gamification-service, the rest by this gateway.
const (
	ChannelXp            = "studed:events:xp"
	ChannelAchievement   = "studed:events:achievement"
	ChannelWaveCompleted = "studed:events:wave_completed"
	ChannelLeaderboard   = "studed:events:leaderboard"
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

type WaveCompletedEvent struct {
	UserID          string `json:"user_id"`
	WaveID          string `json:"wave_id"`
	Score           int32  `json:"score"`
	CompletedAtUnix int64  `json:"completed_at_unix"`
}

type LeaderboardUpdatedEvent struct {
	Scope    string `json:"scope"`
	CourseID string `json:"course_id"`
	UserID   string `json:"user_id"`
	FullName string `json:"full_name"`
	TotalXp  int32  `json:"total_xp"`
	Rank     int32  `json:"rank"`
}

// Bus publishes and subscribes to real-time platform events over Redis
// pub/sub so subscriptions work across multiple gateway replicas.
type Bus struct {
	rdb *redis.Client
	log *slog.Logger
}

func NewBus(redisAddr string, log *slog.Logger) *Bus {
	return &Bus{
		rdb: redis.NewClient(&redis.Options{Addr: redisAddr}),
		log: log,
	}
}

func (b *Bus) Publish(ctx context.Context, channel string, payload any) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}
	if err := b.rdb.Publish(ctx, channel, data).Err(); err != nil {
		return fmt.Errorf("failed to publish event: %w", err)
	}
	return nil
}

// Subscribe streams raw event payloads from a Redis channel until ctx is
// cancelled (i.e. the GraphQL subscription is closed).
func (b *Bus) Subscribe(ctx context.Context, channel string) <-chan []byte {
	out := make(chan []byte, 8)
	pubsub := b.rdb.Subscribe(ctx, channel)

	go func() {
		defer close(out)
		defer pubsub.Close()
		ch := pubsub.Channel()
		for {
			select {
			case <-ctx.Done():
				return
			case msg, ok := <-ch:
				if !ok {
					return
				}
				select {
				case out <- []byte(msg.Payload):
				case <-ctx.Done():
					return
				}
			}
		}
	}()

	return out
}

// SubscribeJSON decodes events of type T from a channel, dropping payloads
// that fail to decode.
func SubscribeJSON[T any](ctx context.Context, b *Bus, channel string) <-chan T {
	out := make(chan T, 8)
	raw := b.Subscribe(ctx, channel)

	go func() {
		defer close(out)
		for payload := range raw {
			var event T
			if err := json.Unmarshal(payload, &event); err != nil {
				b.log.Warn("failed to decode event", slog.String("channel", channel), slog.Any("error", err))
				continue
			}
			select {
			case out <- event:
			case <-ctx.Done():
				return
			}
		}
	}()

	return out
}
