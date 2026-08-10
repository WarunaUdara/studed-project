# Master Autonomous Production-Readiness Prompt & Loop Protocol

This document defines the **Autonomous Production-Readiness Loop Protocol** for long-running AI agents working on the **StudEd** educational platform monorepo.

---

## 🎯 Primary Goal

Systematically scan, audit, score, and refactor the **StudEd** repository until every subsystem (Go Microservices, React Frontend, OpenTofu IaC, Kubernetes, Observability, and Security) achieves **100% Industry-Grade Production Readiness** while keeping the codebase **100% buildable and demonstrable at every single iteration**.

---

## 📋 Evaluation Vector (7 Core Dimensions)

Each dimension is scored on a scale of `0` to `10`. The loop terminates only when **all 7 dimensions score 10/10** and `make ci-local` passes 100%.

| Dimension | Scope & Criteria |
| :--- | :--- |
| **1. Security & Identity** | Zero hardcoded secrets, mandatory gRPC `grpcauth` tokens, JWT access/refresh rotation, Kyverno cluster policy compliance, non-root containers, OWASP top 10 protection. |
| **2. API & Contract Integrity** | GraphQL schema vs resolver parity, gRPC Protobuf strictness, Zod + go-playground/validator schema enforcement, unified error handling. |
| **3. Infrastructure & IaC** | OpenTofu module validation (`tofu plan`), zero resource drift, GKE autoscaling & 15s SIGTERM graceful drain, zero-downtime rolling updates. |
| **4. Data & Storage Resilience** | GORM/sqlc migrations idempotent, connection pooling configured, Redis fail-closed rate-limiting with local loopback bypass, zero orphan records. |
| **5. Observability & Telemetry** | Prometheus metrics scraped on `/metrics`, Grafana golden signal dashboards, health/liveness probes (`/health`, `/ready`), structured JSON logging (`slog`/`zap`). |
| **6. Build & CI/CD Pipeline** | `make ci-local` pre-flight checks pass 100%, zero `govulncheck` vulnerabilities, zero high/critical `bun audit` advisories, minimal Docker image layers. |
| **7. Frontend UX & Resilience** | React 19 error boundaries, Web Audio API sound fallback, OKLCH theme consistency, zero unhandled promise rejections or console errors. |

---

## 🔁 Autonomous Execution Loop (Strict 5-Step Protocol)

Execute work in strict, atomic cycles. Do not attempt to fix all dimensions simultaneously.

```
                  ┌───────────────────────────────┐
                  │ 1. SCAN                       │
                  │ Evaluate single dimension     │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │ 2. REPORT                     │
                  │ Update /.prod-readiness/      │
                  │ AUDIT_REPORT.md & SCORECARD   │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │ 3. TODO                       │
                  │ Create atomic TODO.md tasks   │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │ 4. FIX                        │
                  │ Refactor code incrementally   │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │ 5. VERIFY & SELF-GRADE        │
                  │ Execute `make ci-local`       │
                  │ Update SCORECARD.md           │
                  └──────────────┬────────────────┘
                                 │
             ┌───────────────────┴───────────────────┐
             │ All dimensions score 10/10 & green?   │
             └─────────┬───────────────────┬─────────┘
                    NO │                   │ YES
                       ▼                   ▼
                [Next Iteration]      [TERMINATE & REPORT]
```

---

## 📄 Master Prompt (Copy & Paste for Autonomous Agent / `/goal`)

```markdown
You are an Elite Principal AI Software Engineer, Solutions Architect, and Platform/SRE Specialist auditing the **StudEd** monorepo (`github.com/WarunaUdara/studed-project`).

### YOUR INSTRUCTIONS:
Execute the Autonomous Production-Readiness Loop Protocol defined in `/.prod-readiness/MASTER_PROMPT.md`:

1. **SCAN**: Select the lowest-scoring dimension in `/.prod-readiness/SCORECARD.md`. Scan the codebase using code search and static analysis tools.
2. **REPORT**: Document all findings, flaws, and security attack surfaces in `/.prod-readiness/AUDIT_REPORT.md`.
3. **TODO**: Break down necessary refactoring steps into atomic, actionable items in `/.prod-readiness/TODO.md`.
4. **FIX**: Implement the fixes sequentially. Ensure code is minimal, explicit, and follows rules in `AGENTS.md`. Maintain a Zero-Downtime Codebase (code must compile and pass tests after every single edit).
5. **VERIFY & GRADE**: Run `make ci-local` to verify zero regressions. Update `/.prod-readiness/SCORECARD.md` with the updated score.

Repeat this loop until ALL 7 evaluation dimensions reach 10/10 and `make ci-local` runs 100% green. Do not stop until all criteria are satisfied.
```
