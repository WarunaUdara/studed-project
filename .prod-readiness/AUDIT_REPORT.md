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

---

## 🛡️ Attack Surface & Flaw Matrix

| Component | Category | Flaw / Vulnerability | Status | Remediation |
| :--- | :--- | :--- | :---: | :--- |
| `api-gateway` | Security | Unauthenticated GraphQL endpoints | ✅ FIXED | JWT middleware validates token claims and injects `userCtx`. |
| `shared/go/grpcauth` | Security | Empty `SERVICE_TOKEN` bypass | ✅ FIXED | Interceptor fails closed if `SERVICE_TOKEN` is unset. |
| `auth-service` | Security | Vulnerable `pgx` and `jwt` dependencies | ✅ FIXED | Upgraded to `pgx v5.10.0` and `golang-jwt v5.3.1`. |
| `infra/monitoring` | Observability | Invalid promtool rule syntax | ✅ FIXED | Corrected container entrypoint in `Makefile`. |
