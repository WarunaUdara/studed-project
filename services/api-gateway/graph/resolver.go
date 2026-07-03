package graph

import (
	"github.com/studed/api-gateway/internal/client"
)

// Resolver serves as dependency injection for the GraphQL server.
type Resolver struct {
	AuthClient *client.AuthClient
}
