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
- [x] Add unit test coverage for `services/api-gateway/internal/middleware/auth.go` claims parsing.
- [x] Add OpenTelemetry trace propagation context across gRPC client interceptors in `shared/go/grpcauth`.
- [x] Enforce `grpcauth.UnaryServerInterceptor` on `auth-service` and `course-service` gRPC servers.
- [x] Add OpenTelemetry SDK initialization/export to service mains (`shared/go/otel`).
- [x] Document the gRPC trace propagation + token auth contract in `docs/ARCHITECTURE.md`.
- [x] Run `govulncheck` + `bun audit` and refresh dependency pins (Go 1.26.2, Bun overrides postcss ^8.5.26).
- [x] Add OTLP HTTP trace exporter (`otlptracehttp`) to `shared/go/otel` with automatic fallback to stdouttrace.
- [x] Provision Grafana Tempo distributed trace collector in `docker-compose.yml` (`http://tempo:3200`) and Grafana datasources (`tempo.yml`).
- [x] Add 3D high-resolution generated cover artwork for Course Catalog cards.

---

## 🟡 Open Backlog Tasks
*(None — All production readiness criteria satisfied)*
