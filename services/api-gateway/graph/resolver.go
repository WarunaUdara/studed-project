package graph

import (
	"github.com/studed/api-gateway/internal/client"
	"github.com/studed/api-gateway/internal/events"
)

// Resolver serves as dependency injection for the GraphQL server.
type Resolver struct {
	AuthClient         *client.AuthClient
	CourseClient       *client.CourseClient
	ProgressClient     *client.ProgressClient
	GamificationClient *client.GamificationClient
	AIClient           *client.AIClient
	PaymentClient      *client.PaymentClient
	Events             *events.Bus
}
