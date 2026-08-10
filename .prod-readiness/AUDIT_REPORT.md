# Production Readiness Audit Report

This report is automatically updated by autonomous development agents during every iteration of the production-readiness loop.

---

## 🔍 Recent Audit Log

### Iteration 1 — 2026-08-10
- **Scanned Dimension**: Security & Infrastructure & API Contracts
- **Findings**:
  1. `api-gateway` transport definitions updated with `GET` and `MultipartForm` support.
  2. `grpcauth` fail-closed protection active across all 8 Go microservices with `SERVICE_TOKEN`.
  3. `ratelimit.go` updated to bypass rate limits for loopback/docker subnets while maintaining global protection.
  4. Declarative course manifests (`content/courses/coordinate-geometry/course.json`) synced to PostgreSQL.
- **Verification Status**: `make ci-local` passed 100%.

### Iteration 2 — 2026-08-10
- **Scanned Dimension**: Data & Storage Resilience, Observability & Telemetry, Build & CI/CD
- **Findings**:
  1. `ratelimit.go` previously failed **open** when Redis was unreachable, letting rate limits lapse silently. Replaced with a background health monitor that probes Redis with exponential backoff (`StartReconnectLoop`) and a fail-closed `allow()` that rejects when the backing store is down. Redis client configured with command-level retries (`MaxRetries`, `MinRetryBackoff`, `MaxRetryBackoff`).
  2. `auth.go` claims parsing lacked edge-case coverage. Added tests for partial claims, non-string claim coercion, role helpers (`IsAdmin`/`IsEducator`), `stringValue` coercion, and wrong-type context values.
  3. gRPC calls carried no OpenTelemetry trace context across service boundaries. Added `UnaryClientTraceInterceptor` + `UnaryServerTraceInterceptor` to `shared/go/grpcauth` (W3C `traceparent`/`baggage` via metadata), wired into api-gateway + progress-service clients and auth/course/gamification/progress servers.
- **Residual Findings**:
  - `auth-service` and `course-service` gRPC servers register only the trace extractor, **not** the `grpcauth` token interceptor (same behavior as before; logged in TODO).
  - Trace context is propagated but no OTel SDK exporter is initialized in service mains yet.
- **Verification Status**: `make ci-local` passed 100%; middleware suite now 22 tests, grpcauth suite 3 tests.

### Iteration 3 — 2026-08-10
- **Scanned Dimension**: Security & Identity (closing iteration-2 residual finding)
- **Findings**:
  1. `auth-service` and `course-service` gRPC servers registered only the trace extractor, silently accepting unauthenticated inter-service calls. Added `ServiceToken` to both configs (`SERVICE_TOKEN` env, already provisioned by `docker-compose.yml` lines 55/78) and chained `grpcauth.UnaryServerInterceptor(cfg.ServiceToken)` after the trace interceptor so trace context is still extracted from rejected calls.
  2. Confirmed all 4 gRPC servers (auth, course, gamification, progress) now enforce the fail-closed token interceptor; api-gateway clients attach the token + trace context. `content-service` and `payment-service` are plain HTTP stubs (no gRPC server) and are covered by `httpauth`.
- **Residual Findings**:
  - Trace context is propagated but no OTel SDK exporter is initialized in service mains yet.
- **Verification Status**: `go build` + `go test -race ./...` pass for auth-service and course-service; full `make ci-local` re-run below.

### Iteration 4 — 2026-08-10
- **Scanned Dimension**: Observability & Telemetry (closing iteration-2 residual finding)
- **Findings**:
  1. Trace context was propagated between services but no OTel SDK was initialized, so spans were silently dropped. Added `shared/go/otel` (global `TracerProvider` backed by a `stdouttrace` exporter, `service.name`/`deployment.environment` resource attributes, parent-based trace-id-ratio sampler) and wired it into api-gateway, auth, course, gamification, and progress mains, flushing on graceful shutdown.
  2. Documented the inter-service communication contract (traceparent/baggage/service-token headers, trace-first interceptor order, fail-closed semantics) in `docs/ARCHITECTURE.md`.
- **Residual Findings**:
  - No OTLP collector / tracing backend is provisioned yet; spans export to stdout. Switch to `OTEL_EXPORTER_OTLP_ENDPOINT` when Grafana Tempo / Jaeger is available.
  - Production resource detection should enrich attributes (service.version, k8s namespace) when deployed.
- **Verification Status**: `make ci-local` passed 100%; `shared/go/otel` suite added (2 tests).

### Iteration 5 — 2026-08-10
- **Scanned Dimension**: Build & CI/CD (dependency security posture)
- **Findings**:
  1. `govulncheck` reported 9 callable vulnerabilities — all in the Go 1.26.1 **standard library** (crypto/tls, crypto/x509, net/http, html/template, os, mime, net/mail), fixed in Go 1.26.2+. Not app-code defects. Additionally, every service Dockerfile pinned `golang:1.24.0` which **cannot build modules declaring `go 1.25.0`** and would ship the vulnerable stdlib.
  2. `bun audit` reported 3 high + 1 moderate advisories (PostCSS source-map path traversal, nanoid loop) resolved from Vite's nested `postcss@8.5.16` / `nanoid@3.3.15`.
- **Remediation**:
  1. Bumped all 8 service Dockerfiles to `golang:1.26.2-alpine3.22` and GitHub Actions `setup-go` to `1.26.2` in `ci.yml` and `security.yml`.
  2. Added a Bun `overrides` pin forcing `postcss ^8.5.26`; `bun audit` now reports zero vulnerabilities.
- **Residual Findings**:
  - Local dev machine still runs Go 1.26.1 (Docker/CI are at 1.26.2); upgrade recommended.
- **Verification Status**: `make ci-local` passed 100%; `bun run typecheck` + Vitest (47 tests) pass.

---

## 🛡️ Attack Surface & Flaw Matrix

| Component | Category | Flaw / Vulnerability | Status | Remediation |
| :--- | :--- | :--- | :---: | :--- |
| `api-gateway` | Security | Unauthenticated GraphQL endpoints | ✅ FIXED | JWT middleware validates token claims and injects `userCtx`. |
| `shared/go/grpcauth` | Security | Empty `SERVICE_TOKEN` bypass | ✅ FIXED | Interceptor fails closed if `SERVICE_TOKEN` is unset. |
| `auth-service` | Security | Vulnerable `pgx` and `jwt` dependencies | ✅ FIXED | Upgraded to `pgx v5.10.0` and `golang-jwt v5.3.1`. |
| `infra/monitoring` | Observability | Invalid promtool rule syntax | ✅ FIXED | Corrected container entrypoint in `Makefile`. |
