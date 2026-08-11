package otel

import (
	"context"
	"os"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/exporters/stdout/stdouttrace"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.43.0"
)

// TracerProviderConfig holds options for initializing the global tracer provider.
type TracerProviderConfig struct {
	ServiceName    string
	Environment    string
	PrettyPrint    bool
	SampleFraction float64
}

// SetupTracerProvider installs the global OpenTelemetry tracer provider backed by
// a stdout exporter, so propagated spans are emitted to stderr for local and
// containerized log collection. Returns a shutdown func that flushes and stops
// the provider.
func SetupTracerProvider(cfg TracerProviderConfig) (func(context.Context) error, error) {
	var exporter sdktrace.SpanExporter
	var err error

	otlpEndpoint := os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
	if otlpEndpoint != "" {
		exporter, err = otlptracehttp.New(
			context.Background(),
			otlptracehttp.WithEndpointURL(otlpEndpoint),
			otlptracehttp.WithInsecure(),
		)
	} else {
		exporter, err = stdouttrace.New(
			stdouttrace.WithPrettyPrint(),
			stdouttrace.WithoutTimestamps(),
		)
	}
	if err != nil {
		return nil, err
	}

	res, err := resource.New(context.Background(),
		resource.WithAttributes(
			semconv.ServiceName(cfg.ServiceName),
			semconv.DeploymentEnvironmentNameKey.String(cfg.Environment),
		),
	)
	if err != nil {
		return nil, err
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
		sdktrace.WithSampler(sdktrace.ParentBased(sdktrace.TraceIDRatioBased(cfg.SampleFraction))),
	)
	otel.SetTracerProvider(tp)

	return tp.Shutdown, nil
}

// Env returns the value of the named environment variable, falling back to def.
func Env(name, def string) string {
	if v := os.Getenv(name); v != "" {
		return v
	}
	return def
}
