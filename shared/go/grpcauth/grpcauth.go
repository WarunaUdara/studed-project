// Package grpcauth provides a small service-to-service token interceptor for
// gRPC servers and the matching client-side interceptor that injects the
// token into outgoing metadata.
package grpcauth

import (
	"context"
	"crypto/subtle"
	"strings"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

// UnaryServerInterceptor rejects calls whose metadata does not carry the shared
// service token as "authorization: Bearer <token>". An empty expected token
// refuses all calls (fail closed).
func UnaryServerInterceptor(expectedToken string) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		if expectedToken == "" {
			return nil, status.Error(codes.Unavailable, "service token not configured")
		}
		md, ok := metadata.FromIncomingContext(ctx)
		if !ok {
			return nil, status.Error(codes.Unauthenticated, "missing service token")
		}
		for _, v := range md.Get("authorization") {
			const prefix = "Bearer "
			if strings.HasPrefix(v, prefix) &&
				subtle.ConstantTimeCompare([]byte(strings.TrimPrefix(v, prefix)), []byte(expectedToken)) == 1 {
				return handler(ctx, req)
			}
		}
		return nil, status.Error(codes.Unauthenticated, "invalid service token")
	}
}

// UnaryClientInterceptor injects the shared service token into outgoing calls.
// It is safe to use on clients even when the peer does not enforce auth.
func UnaryClientInterceptor(token string) grpc.UnaryClientInterceptor {
	return func(ctx context.Context, method string, req, reply any, cc *grpc.ClientConn, invoker grpc.UnaryInvoker, opts ...grpc.CallOption) error {
		ctx = metadata.AppendToOutgoingContext(ctx, "authorization", "Bearer "+token)
		return invoker(ctx, method, req, reply, cc, opts...)
	}
}
