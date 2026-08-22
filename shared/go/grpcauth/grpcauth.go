// Package grpcauth provides a small service-to-service token interceptor for
// gRPC servers and the matching client-side interceptor that injects the
// token into outgoing metadata. It also carries OpenTelemetry trace context
// across the wire so distributed traces span service boundaries.
package grpcauth

import (
	"context"
	"crypto/subtle"
	"strings"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/propagation"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/keepalive"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

// ClientKeepalive returns dial options that keep idle gRPC channels healthy.
// Without pings, a silently dropped TCP connection (Docker NAT, GKE LB idle
// timeout) is only noticed when the next RPC fails; grpc-go then pays its
// exponential reconnect backoff (1s, 1.6s, 2.6s, 4.1s...) on the first
// user-facing call, which showed up as 5-10s logins after idle. Pinging every
// 20s detects the dead connection and reconnects in the background instead.
func ClientKeepalive() []grpc.DialOption {
	return []grpc.DialOption{
		grpc.WithKeepaliveParams(keepalive.ClientParameters{
			Time:                20 * time.Second,
			Timeout:             3 * time.Second,
			PermitWithoutStream: true,
		}),
	}
}

// ServerKeepalive relaxes the server's ping enforcement so the client's idle
// keepalive pings above are accepted. grpc-go's server default (MinTime 5m,
// idle pings refused) would otherwise GOAWAY the channel as "too many pings".
func ServerKeepalive() []grpc.ServerOption {
	return []grpc.ServerOption{
		grpc.KeepaliveEnforcementPolicy(keepalive.EnforcementPolicy{
			MinTime:             10 * time.Second,
			PermitWithoutStream: true,
		}),
	}
}

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

// UnaryClientTimeoutInterceptor sets a maximum timeout on outbound RPCs if
// the context does not already have a deadline (or if its deadline exceeds defaultTimeout).
func UnaryClientTimeoutInterceptor(defaultTimeout time.Duration) grpc.UnaryClientInterceptor {
	return func(ctx context.Context, method string, req, reply any, cc *grpc.ClientConn, invoker grpc.UnaryInvoker, opts ...grpc.CallOption) error {
		if deadline, ok := ctx.Deadline(); !ok || time.Until(deadline) > defaultTimeout {
			var cancel context.CancelFunc
			ctx, cancel = context.WithTimeout(ctx, defaultTimeout)
			defer cancel()
			return invoker(ctx, method, req, reply, cc, opts...)
		}
		return invoker(ctx, method, req, reply, cc, opts...)
	}
}

// metadataCarrier adapts gRPC metadata to the OpenTelemetry TextMapCarrier
// interface so trace context can be injected and extracted in both directions.
type metadataCarrier struct {
	md metadata.MD
}

func (c *metadataCarrier) Get(key string) string {
	values := c.md.Get(key)
	if len(values) == 0 {
		return ""
	}
	return values[0]
}

func (c *metadataCarrier) Set(key, value string) {
	c.md.Set(key, value)
}

func (c *metadataCarrier) Keys() []string {
	out := make([]string, 0, len(c.md))
	for k := range c.md {
		out = append(out, k)
	}
	return out
}

// UnaryClientTraceInterceptor injects the current OpenTelemetry span context
// into outgoing gRPC metadata (traceparent / baggage). It should be placed
// early in the client interceptor chain so downstream interceptors and the
// actual call see the trace context.
func UnaryClientTraceInterceptor() grpc.UnaryClientInterceptor {
	return func(ctx context.Context, method string, req, reply any, cc *grpc.ClientConn, invoker grpc.UnaryInvoker, opts ...grpc.CallOption) error {
		md, ok := metadata.FromOutgoingContext(ctx)
		if !ok {
			md = metadata.MD{}
		} else {
			md = md.Copy()
		}
		otel.GetTextMapPropagator().Inject(ctx, &metadataCarrier{md: md})
		ctx = metadata.NewOutgoingContext(ctx, md)
		return invoker(ctx, method, req, reply, cc, opts...)
	}
}

// UnaryServerTraceInterceptor extracts OpenTelemetry trace context from
// incoming gRPC metadata so the server's spans continue the client's trace.
func UnaryServerTraceInterceptor() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		md, _ := metadata.FromIncomingContext(ctx)
		ctx = otel.GetTextMapPropagator().Extract(ctx, &metadataCarrier{md: md})
		return handler(ctx, req)
	}
}

var _ propagation.TextMapCarrier = (*metadataCarrier)(nil)
