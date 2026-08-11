package otel

import (
	"context"
	"testing"

	"go.opentelemetry.io/otel"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
)

func TestSetupTracerProviderRegistersGlobalProvider(t *testing.T) {
	shutdown, err := SetupTracerProvider(TracerProviderConfig{
		ServiceName:    "test-service",
		Environment:    "test",
		SampleFraction: 1.0,
	})
	if err != nil {
		t.Fatalf("SetupTracerProvider() error = %v", err)
	}
	defer func() {
		if err := shutdown(context.Background()); err != nil {
			t.Fatalf("shutdown() error = %v", err)
		}
	}()

	tp := otel.GetTracerProvider()
	if tp == nil {
		t.Fatal("TracerProvider() = nil, want a registered provider")
	}
	if _, ok := tp.(*sdktrace.TracerProvider); !ok {
		t.Fatalf("TracerProvider() type = %T, want *sdktrace.TracerProvider", tp)
	}
}

func TestEnvFallback(t *testing.T) {
	if got := Env("STUDED_UNSET_ENV_VAR", "fallback"); got != "fallback" {
		t.Fatalf("Env() = %q, want %q", got, "fallback")
	}
}
