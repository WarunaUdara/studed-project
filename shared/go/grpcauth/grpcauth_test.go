package grpcauth

import (
	"context"
	"testing"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/propagation"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/trace"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

// sampledTracer returns a tracer from an AlwaysSample provider so spans are
// valid and propagatable regardless of any ambient sampling config.
func sampledTracer() trace.Tracer {
	otel.SetTracerProvider(sdktrace.NewTracerProvider(sdktrace.WithSampler(sdktrace.AlwaysSample())))
	return otel.Tracer("test")
}

func TestClientTraceInterceptor_PropagatesSpanContext(t *testing.T) {
	otel.SetTextMapPropagator(propagation.TraceContext{})

	// Create a parent span so a span context exists to propagate.
	tracer := sampledTracer()
	ctx, span := tracer.Start(context.Background(), "test-span")
	defer span.End()

	var sentTraceID trace.TraceID
	var sentSpanID trace.SpanID

	interceptor := UnaryClientTraceInterceptor()
	err := interceptor(ctx, "/test.Method", nil, nil, nil,
		func(ctx context.Context, method string, req, reply any, cc *grpc.ClientConn, opts ...grpc.CallOption) error {
			md, _ := metadata.FromOutgoingContext(ctx)
			traceparent := md.Get("traceparent")
			if len(traceparent) == 0 {
				t.Fatal("expected traceparent in outgoing metadata")
			}

			extracted := propagation.TraceContext{}
			carrier := propagation.MapCarrier{}
			carrier.Set("traceparent", traceparent[0])
			extractedCtx := extracted.Extract(context.Background(), carrier)
			sc := trace.SpanContextFromContext(extractedCtx)

			if !sc.IsValid() {
				t.Fatal("expected a valid extracted span context")
			}
			sentTraceID = sc.TraceID()
			sentSpanID = sc.SpanID()
			return nil
		},
	)
	if err != nil {
		t.Fatalf("interceptor failed: %v", err)
	}

	if sentTraceID != span.SpanContext().TraceID() {
		t.Fatalf("expected trace id %s, got %s", span.SpanContext().TraceID(), sentTraceID)
	}
	if sentSpanID != span.SpanContext().SpanID() {
		t.Fatalf("expected span id %s, got %s", span.SpanContext().SpanID(), sentSpanID)
	}
}

func TestServerTraceInterceptor_ExtractsSpanContext(t *testing.T) {
	otel.SetTextMapPropagator(propagation.TraceContext{})

	tracer := sampledTracer()
	ctx, parent := tracer.Start(context.Background(), "test-parent")
	defer parent.End()

	// Inject into a carrier the way the client interceptor would.
	carrier := propagation.MapCarrier{}
	propagation.TraceContext{}.Inject(ctx, carrier)

	md := metadata.New(map[string]string{"traceparent": carrier.Get("traceparent")})
	incoming := metadata.NewIncomingContext(context.Background(), md)

	var got trace.SpanContext
	interceptor := UnaryServerTraceInterceptor()
	_, err := interceptor(incoming, nil, &grpc.UnaryServerInfo{},
		func(ctx context.Context, req any) (any, error) {
			got = trace.SpanContextFromContext(ctx)
			return nil, nil
		},
	)
	if err != nil {
		t.Fatalf("interceptor failed: %v", err)
	}

	if !got.IsValid() {
		t.Fatal("expected a valid span context in the server handler")
	}
	if got.TraceID() != parent.SpanContext().TraceID() {
		t.Fatalf("expected trace id %s, got %s", parent.SpanContext().TraceID(), got.TraceID())
	}
}

func TestMetadataCarrier_GetSetKeys(t *testing.T) {
	md := metadata.MD{}
	c := &metadataCarrier{md: md}

	c.Set("traceparent", "00-abc-xyz-01")
	if c.Get("traceparent") != "00-abc-xyz-01" {
		t.Fatalf("expected traceparent value, got %q", c.Get("traceparent"))
	}

	keys := c.Keys()
	if len(keys) != 1 || keys[0] != "traceparent" {
		t.Fatalf("expected keys to contain traceparent, got %v", keys)
	}

	if c.Get("missing") != "" {
		t.Fatal("expected empty string for a missing key")
	}
}
