package metrics

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"google.golang.org/grpc"
	"google.golang.org/grpc/status"
)

var (
	// HTTP RED Metrics
	HTTPRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "studed_http_requests_total",
			Help: "Total number of HTTP requests processed by service.",
		},
		[]string{"service", "handler", "status"},
	)

	HTTPRequestDurationSeconds = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "studed_http_request_duration_seconds",
			Help:    "HTTP request latency distribution in seconds.",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"service", "handler"},
	)

	// gRPC RED Metrics
	GRPCRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "studed_grpc_requests_total",
			Help: "Total number of gRPC requests processed by service.",
		},
		[]string{"service", "method", "code"},
	)

	GRPCRequestDurationSeconds = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "studed_grpc_request_duration_seconds",
			Help:    "gRPC request latency distribution in seconds.",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"service", "method"},
	)

	// Business Metrics (REL-01c)
	WaveSubmissionsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "studed_wave_submissions_total",
			Help: "Total number of wave quiz attempts submitted by students.",
		},
		[]string{"status"},
	)

	XpAwardedTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "studed_xp_awarded_total",
			Help: "Total XP points awarded across all completed waves.",
		},
		[]string{"reason"},
	)

	AiTokensTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "studed_ai_tokens_total",
			Help: "Total AI tokens consumed for block generation and translation.",
		},
		[]string{"model", "operation"},
	)
)

// Handler returns standard HTTP handler for /metrics endpoint.
func Handler() http.Handler {
	return promhttp.Handler()
}

// HTTPMiddleware creates HTTP middleware recording RED metrics.
func HTTPMiddleware(serviceName string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			ww := &statusResponseWriter{ResponseWriter: w, statusCode: http.StatusOK}
			next.ServeHTTP(ww, r)

			duration := time.Since(start).Seconds()
			handler := r.URL.Path
			statusStr := strconv.Itoa(ww.statusCode)

			HTTPRequestsTotal.WithLabelValues(serviceName, handler, statusStr).Inc()
			HTTPRequestDurationSeconds.WithLabelValues(serviceName, handler).Observe(duration)
		})
	}
}

// UnaryServerInterceptor creates gRPC server interceptor recording RED metrics.
func UnaryServerInterceptor(serviceName string) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		start := time.Now()
		resp, err := handler(ctx, req)
		duration := time.Since(start).Seconds()

		code := status.Code(err).String()
		GRPCRequestsTotal.WithLabelValues(serviceName, info.FullMethod, code).Inc()
		GRPCRequestDurationSeconds.WithLabelValues(serviceName, info.FullMethod).Observe(duration)

		return resp, err
	}
}

type statusResponseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (w *statusResponseWriter) WriteHeader(code int) {
	w.statusCode = code
	w.ResponseWriter.WriteHeader(code)
}
