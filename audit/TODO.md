# StudEd — Consolidated Action Checklist

**78 items** · Ordered by phase, then severity. Each links to its full analysis.

Legend: 🔴 Critical · 🟠 High · 🟡 Medium · 🔵 Low
Effort: `XS` <30min · `S` <2h · `M` <1d · `L` 1-3d

---

## ⚡ Phase 0 — Do these first (≈3 hours, 4 blockers removed)

- [x] 🟠 `XS` **FLOW-02** — Fix `make go-test` exit status; add `-race`. *Until this is done, no test result in this repo means anything.* → [04](04-CORRECTNESS-FLOWS.md#-flow-02--ci-silently-ignores-go-test-failures)
- [x] 🔴 `S` **SEC-02** — Reorder Cloud Armor: throttle at priority 900, remove the blanket `/graphql` allow, use preconfigured-expression exclusions instead. → [01](01-SECURITY.md#-sec-02--cloud-armor-allows-graphql-past-every-waf-rule-and-the-rate-limit)
- [x] 🔴 `S` **FLOW-01 / SEC-07** — Add NetworkPolicy edges: progress→course:8083, progress→gamification:8088 (egress + matching ingress). → [04](04-CORRECTNESS-FLOWS.md#-flow-01--networkpolicies-break-wave-submission-in-the-cluster)
- [x] 🟠 `S` **FLOW-03** — Add `scripts/provision-educator.sh`; call it from the seed so the educator demo works. → [04](04-CORRECTNESS-FLOWS.md#-flow-03--the-demo-seed-cannot-create-an-educator)
- [x] 🟡 `S` **FLOW-09** — Delete `user-service`, `content-service`, `upload-service` stubs; correct the README architecture diagram. → [04](04-CORRECTNESS-FLOWS.md#-flow-09--three-services-exist-in-the-architecture-diagram-but-not-in-the-system)

---

## 🔒 Phase 1 — Make it correct (~1 week)

### Security
- [x] 🔴 `S` **SEC-01** — Split `EvaluateBlock` into student-facing and `AuthoredEvaluateBlock`; never return `correctAnswer` to students. → [01](01-SECURITY.md#-sec-01--quiz-answers-are-readable-by-any-enrolled-student)
- [x] 🔴 `M` **SEC-03** — Redis-backed rate limiting at the gateway: login 5/min/IP, register 3/h/IP, AI 10/h/user, global per-user cap.
- [x] 🟠 `M` **SEC-04** — Add `jti`; Redis token denylist; refresh-token rotation with reuse detection; make logout revoke.
- [x] 🟠 `M` **SEC-06** — Verify `payhere_amount`/currency against a server-side price table; `processed_webhooks` ledger keyed on `payment_id`; only `PENDING → ACTIVE`.
- [x] 🟠 `S` **SEC-08** — Add `frontend/public/_headers` with CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy.
- [x] 🟡 `S` **SEC-09 / SEC-23** — Replace `handler.NewDefaultServer` with explicit composition; makes introspection genuinely conditional, drops the unused GET + MultipartForm transports, and activates the WebSocket origin allowlist that is currently dead code.
- [x] 🟡 `S` **SEC-23b** — Verify all four GraphQL subscriptions end to end in the deployed environment; add a Playwright test asserting a subscription delivers a message.
- [x] 🟡 `S` **SEC-10** — Add a gqlgen `ErrorPresenter` with a `PublicError` taxonomy and request IDs.
- [x] 🟡 `XS` **SEC-11** — Constant-time login: always run bcrypt against a dummy hash when the user is absent.
- [x] 🟡 `S` **SEC-12** — Password policy: min 12 chars, HIBP k-anonymity check, bcrypt cost 12, email validation, progressive lockout.
- [x] 🟡 `S` **SEC-13** — Add `iss`/`aud`/`jti`/`nbf`; validate all at the gateway; assert `type == "access"`.
- [x] 🟡 `XS` **SEC-14** — Remove `sslmode=disable` defaults from payment/notification; fail fast on missing `DATABASE_URL`.
- [x] 🟡 `S` **SEC-16** — Require auth on `leaderboard`; show display names not legal names; begin the consent/data-rights model.
- [x] 🔵 `XS` **SEC-19** — Use `subtle.ConstantTimeCompare` for the PayHere signature.
- [x] 🔵 `XS` **SEC-20** — Bind compose ports to `127.0.0.1`; add a local-only banner.
- [x] 🔵 `XS` **SEC-21** — `http.MaxBytesReader` at 1MB on the gateway.
- [x] 🔵 `XS` **SEC-22 / FLOW-12** — Remove the ignored `role` field from `RegisterInput`.

### Correctness
- [x] 🟠 `M` **FLOW-04** — Make `RecordAttempt` transactional and idempotent on a `submissionId`; record the attempt before awarding XP; add a concurrency test.
- [x] 🟠 `S` **FLOW-05** — Reveal `correctAnswer`/`explanation` only when passed or no attempts remain.
- [x] 🟡 `M` **FLOW-06** — Subscription reconciliation job; extend `end_date` on renewal; implement or remove the entitlement model.
- [x] 🟡 `M` **FLOW-07** — Implement `ADMIN`/`HEAD_EDUCATOR` overrides with an audit log, or delete the unused roles.
- [x] 🟡 `XS` **FLOW-08** — Round the score instead of truncating; warn authors when the threshold is unreachable.
- [x] 🟡 `M` **FLOW-10** — Standardise on `golang-migrate`; remove GORM `AutoMigrate`; run migrations as an ArgoCD `PreSync` Job.
- [x] 🔵 `S` **FLOW-11** — Money as integer minor units, not `float64`.
- [x] 🟡 `M` **COST-02** — Pages proxy: forward a signed `x-studed-client-ip`; move `API_ORIGIN` to an env binding; add a fetch timeout and 502 handling.

### Demo readiness
- [x] 🟠 `S` **DEMO** — Write `scripts/verify-demo.sh` asserting the full journey from `docker compose down -v`; run it nightly in CI. → [04](04-CORRECTNESS-FLOWS.md#demo-readiness-gate)

---

## 📊 Phase 2 — Make it observable (~1 week)

- [x] 🔴 `M` **REL-01a** — Create `shared/go/metrics` with RED metrics + middleware; expose `/metrics` in all 8 services. → [02](02-RELIABILITY-SRE.md#-rel-01--zero-application-metrics-the-entire-monitoring-stack-is-non-functional)
- [x] 🔴 `S` **REL-01b** — Remove every `metrics_path: "/health"` from `prometheus.yml`.
- [x] 🔴 `S` **REL-01c** — Add business metrics: `studed_wave_submissions_total`, `studed_xp_awarded_total`, `studed_ai_tokens_total`.
- [x] 🔴 `S` **REL-01d** — Verify the three Grafana dashboards render real data; fix panel queries.
- [ ] 🟠 `M` **REL-04** — OpenTelemetry across HTTP, gRPC, GraphQL, and SQL; export to Cloud Trace (prod) and Jaeger (local).
- [x] 🟠 `S` **REL-03** — Real readiness probes checking DB, Redis, and gRPC connection state; keep liveness dependency-free.
- [x] 🟠 `M` **REL-05a** — Add Alertmanager with routing for `severity=critical`.
- [x] 🟠 `S` **REL-05b** — Define SLOs in `docs/SLO.md`; convert alerts to multi-window burn-rate rules.
- [x] 🟠 `S` **REL-05c** — Write three runbooks; link them via `runbook_url` annotations.
- [x] 🟡 `S` **REL-12** — Replace chi's `Logger` with structured `slog` JSON; add `RequestID` propagated over gRPC; add `trace_id` to logs.
- [x] 🟡 `S` **OPS-04c** — Run `make promtool-check` in CI.

---

## 🛡️ Phase 3 — Make it resilient & fast (~1 week)

### Availability
- [x] 🔴 `M` **REL-02** — `replicas: 2` + PDB + HPA + `topologySpreadConstraints` on request-path services; document any deliberate exception.
- [x] 🟠 `S` **REL-09** — `preStop` sleep + `terminationGracePeriodSeconds: 45`.
- [ ] 🟡 `M` **REL-10** — Self-healing rebuild for Redis leaderboards and the ES index on start (or drop ES per COST-03).
- [x] 🟡 `M` **REL-11** — `docs/DR.md` with RTO/RPO; perform and record one real restore drill.
- [ ] 🟡 `M` **REL-13** — Retry with backoff (idempotent reads only), circuit breakers, documented degradation.
- [x] 🔵 `XS` **REL-14** — Add `startupProbe` to every deployment.

### Performance
- [ ] 🔴 `L` **PERF-01a** — Add `GetWaveProgressBatch` RPC with one course-graph fetch and one grouped attempts query.
- [ ] 🔴 `M` **PERF-01b** — DataLoader on `Wave.myProgress` at the gateway.
- [ ] 🟠 `M` **PERF-02** — Redis cache-aside for course/lesson/wave/leaderboard with publish-triggered invalidation.
- [ ] 🟠 `S` **PERF-03** — Migration adding partial indexes on `wave_attempts(user_id, course_id/lesson_id) WHERE passed`; verify with `EXPLAIN ANALYZE`.
- [ ] 🟡 `S` **PERF-04** — Raise memory requests/limits; set `GOMEMLIMIT` and `GOMAXPROCS` from the container limits.
- [ ] 🟡 `S` **PERF-05** — Server-enforced pagination caps on all list fields; cursor pagination for the leaderboard.
- [ ] 🟡 `M` **PERF-06** — Partition `wave_attempts` by month; `answers_json` as `JSONB`; define a retention policy.
- [ ] 🟡 `M` **PERF-07** — Bundle visualizer, lazy-load Puck, CI size budget (250 KB gzipped), Lighthouse CI.
- [ ] 🔵 `S` **PERF-08** — Per-field GraphQL complexity costs, depth limit, per-operation timeout.
- [ ] 🟡 `S` **REL-08** — Connection pool limits + Neon pooled endpoint + `ConnMaxLifetime`.

### Workload hardening
- [x] 🟠 `M` **SEC-05a** — Distroless non-root base images across all services.
- [ ] 🟠 `S` **SEC-05b** — `securityContext` on every pod; `automountServiceAccountToken: false`; per-service ServiceAccounts.
- [ ] 攻 `XS` **SEC-05c** — Label the namespace `pod-security.kubernetes.io/enforce: restricted`.
- [ ] 🟡 `S` **SEC-15** — Reduce node oauth scopes; add a `authorized_cidrs` validation rejecting `0.0.0.0/0`.
- [ ] 🟡 `M` **SEC-17** — Scope `allow-external-egress` per workload; FQDN egress policy for Gemini; Private Service Connect for Neon.

---

## 🚀 Phase 4 — Make it automated (~1 week)

### Pipeline
- [ ] 🟠 `XS` **OPS-02** — Remove the `|| bun install` fallback.
- [ ] 🟠 `M` **OPS-03a** — Add `.github/workflows/security.yml`: gitleaks, golangci-lint, govulncheck, trivy, tfsec, checkov, kubeconform, bun audit.
- [ ] 🟠 `S` **OPS-03b** — SBOM (syft) + keyless image signing (cosign + OIDC).
- [ ] 🟡 `S` **OPS-03c** — Enable Binary Authorization on GKE to require signed images.
- [ ] 🟠 `S` **OPS-04a** — Playwright e2e job in CI against the compose stack, with report artifacts.
- [ ] 🟠 `S` **OPS-04b** — Coverage via `-coverprofile`, upload to Codecov, ratchet + 70% floor on `internal/service/**`.
- [ ] 🟡 `S` **OPS-08** — Scope `packages: write` to the publish job only; pin all actions to commit SHAs.

### Delivery
- [ ] 🟠 `L` **OPS-01 / REL-06 / REL-07** — Kustomize base+overlays, digest-pinned images, correct registry namespace, CD job writing digests, staging→approval→production with ArgoCD.
- [ ] 🟡 `M` **OPS-10** — Delete the Helm chart (or complete it); validate the real manifests with `kubectl kustomize | kubeconform`.
- [ ] 🟡 `S` **OPS-05** — `iac-plan` must run `tofu plan -out`; `iac-apply` applies the reviewed plan; PR plan comments.
- [ ] 🟡 `S` **OPS-06 / REL-15** — GCS Terraform backend with locking and versioning; scheduled drift detection.
- [ ] 🟡 `M` **OPS-07** — Distroless, digest-pinned base, OCI labels, `-trimpath`, align Go 1.25 between CI and Dockerfiles; expose version/commit on `/health`.
- [ ] 🔵 `S` **OPS-11** — Renovate, CODEOWNERS, branch protection, PR template, release-please changelog.

### Cost
- [ ] 🟠 `S` **COST-01a** — `maxOutputTokens: 2048` + input length cap in the Gemini client.
- [ ] 🟠 `XS` **COST-01b** — Gate `translateContent` on `requireEducator`.
- [ ] 🟠 `M` **COST-01c** — Per-user AI quotas in Redis + a global daily token budget breaker + AI spend metrics.
- [ ] 🟠 `XS` **COST-01d** — Set a hard quota on the Gemini API key in the Google Cloud console.
- [ ] 🟡 `M` **COST-03** — Replace Elasticsearch with Postgres full-text search; record as ADR-001.
- [ ] 🟡 `M` **COST-04** — `google_billing_budget` with thresholds → Pub/Sub → auto scale-to-zero at 120%.
- [ ] 🔵 `M` **COST-05** — BigQuery billing export + per-service cost view; right-size from real metrics.

---

## 🎨 Experience & quality (ongoing)

- [ ] 🟠 `M` **UX-01a** — `@axe-core/playwright` on main routes; zero serious/critical violations.
- [ ] 🟠 `S` **UX-01b** — KaTeX `output: "htmlAndMathml"` + `aria-label`.
- [ ] 🟠 `S` **UX-01c** — `prefers-reduced-motion` support; consent + safety note before binaural audio.
- [ ] 🟡 `M` **UX-02** — Frontend error-code mapping, retry affordances, offline banner, per-route error boundaries.
- [ ] 🟡 `L` **UX-03** — `i18next` with en/si catalogues; translate authored content once at authoring time; self-host Noto Sans Sinhala.
- [ ] 🟡 `S` **UX-04** — Return `lockReason` and `unlockedBy` with wave progress; surface `remainingAttempts` before submission.
- [ ] 🟡 `S` **DX-01** — `make doctor`, `mise.toml`, devcontainer, verified `QUICKSTART.md`.
- [ ] 🟡 `M` **DX-02** — Consolidate documentation into one hierarchy; delete empty stubs; fix `.gitignore` gaps.
- [ ] 🟡 `XS` **OPS-09 / DX-03** — Remove hardcoded absolute paths from the Makefile; `git rm --cached .DS_Store`; resolve the untracked submodule.
- [ ] 🟠 `L` **TEST-01** — Unit-test `answersEquivalent`/`scoreAnswers`, the reattempt race, and the role×mutation authorization matrix.
- [ ] 🟡 `M` **TEST-03** — `buf lint` + `buf breaking`; assert generated proto and gqlgen code are current; GraphQL Codegen on the frontend.
- [ ] 🟡 `L` **TEST-04** — k6 load scripts with SLO thresholds, run nightly against staging.
- [ ] 🔵 `M` **TEST-06** — Chaos scenarios (Redis/DB down) + OWASP ZAP baseline DAST.

### Documentation
- [ ] 🟡 `M` **ADR** — Write the ten ADRs listed in [09](09-ARCHITECTURE-TARGET.md#architectural-decisions-to-record), including the deliberate exclusions.

---

## Progress tracker

| Phase | Items | Done |
| :--- | ---: | ---: |
| 0 — Blockers | 5 | 5 |
| 1 — Correct | 27 | 27 |
| 2 — Observable | 11 | 10 |
| 3 — Resilient & fast | 20 | 5 |
| 4 — Automated | 17 | 0 |
| Experience & quality | 14 | 0 |
| **Total** | **78** (some span phases) | **47** |
