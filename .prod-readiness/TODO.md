# Autonomous Production Readiness TODO List

This TODO list is maintained dynamically by long-running agents during autonomous audit & refactoring cycles.

---

## 🟢 Completed Tasks
- [x] Integrate `grpcauth` fail-closed inter-service authentication across all microservices.
- [x] Configure `api-gateway` GraphQL transports (`GET`, `POST`, `MultipartForm`).
- [x] Resolve `govulncheck` vulnerabilities in `auth-service` and `api-gateway`.
- [x] Add zero-cost `floci-gcp` local emulator configuration in OpenTofu IaC.
- [x] Author declarative `coordinate-geometry` course manifest and sync engine.
- [x] Build interactive 2D `CoordinatePlaneBlock.tsx` visual discovery component.
- [x] Add Redis connection retry/reconnect exponential backoff logic in `services/api-gateway/internal/middleware/ratelimit.go` (background health monitor + fail-closed `allow()`).
- [x] Add unit test coverage for `services/api-gateway/internal/middleware/auth.go` claims parsing (partial/non-string claims, role helpers, coercion, context typing).
- [x] Add OpenTelemetry trace propagation context across gRPC client interceptors in `shared/go/grpcauth` (client + server trace interceptors wired into api-gateway, auth, course, gamification, progress).
- [x] Enforce `grpcauth.UnaryServerInterceptor` on `auth-service` and `course-service` gRPC servers (token interceptor chained after trace extractor; `SERVICE_TOKEN` added to configs).
- [x] Add a shared `go-test` target to `Makefile` that runs every Go microservice test suite in one command (already present; iterates `services/*` with `go.mod`, verified working).
- [x] Add OpenTelemetry SDK initialization/export to service mains so propagated spans are exported (new `shared/go/otel` package with stdout exporter, wired into api-gateway, auth, course, gamification, progress).
- [x] Document the gRPC trace propagation + token auth contract in `docs/ARCHITECTURE.md` (traceparent header, interceptor order, SERVICE_TOKEN requirement).
- [x] Run `govulncheck` + `bun audit` and refresh dependency pins (Go toolchain 1.24→1.26.2 in Docker/CI, Bun overrides pin postcss ^8.5.26).

---

## 🟡 Open Backlog Tasks
- [ ] Add an OTLP collector or switch the stdout exporter to `OTEL_EXPORTER_OTLP_ENDPOINT` when the tracing backend is provisioned (Grafana Tempo / Jaeger).
- [ ] Ensure all OTel resource attributes (service.version, host, k8s namespace) are populated in production resource detection.
- [ ] Upgrade the local dev Go toolchain to 1.26.2+ (govulncheck flags the 1.26.1 stdlib; Docker/CI already pinned to 1.26.2).
