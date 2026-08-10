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

---

## 🛡️ Attack Surface & Flaw Matrix

| Component | Category | Flaw / Vulnerability | Status | Remediation |
| :--- | :--- | :--- | :---: | :--- |
| `api-gateway` | Security | Unauthenticated GraphQL endpoints | ✅ FIXED | JWT middleware validates token claims and injects `userCtx`. |
| `shared/go/grpcauth` | Security | Empty `SERVICE_TOKEN` bypass | ✅ FIXED | Interceptor fails closed if `SERVICE_TOKEN` is unset. |
| `auth-service` | Security | Vulnerable `pgx` and `jwt` dependencies | ✅ FIXED | Upgraded to `pgx v5.10.0` and `golang-jwt v5.3.1`. |
| `infra/monitoring` | Observability | Invalid promtool rule syntax | ✅ FIXED | Corrected container entrypoint in `Makefile`. |
