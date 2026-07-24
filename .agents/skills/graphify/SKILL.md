---
name: graphify
description: Custom Graph-Based Codebase Context & Token Minimization Skill for StudEd. Use when querying symbol dependencies, microservice call graphs, gRPC proto contracts, or reducing context window token bloat across frontend routes and Go services.
license: MIT
metadata:
  author: StudEd Engineering Team
  version: 1.0.0
---

# Graphify & Context Minimization Skill for StudEd

This skill optimizes context retrieval and token usage across the **StudEd** monorepo (11 Go microservices + React SPA + OpenTofu + Kubernetes).

## 🧠 Core Philosophy: Target-Scoped Context Retrieval

Instead of loading entire directories into the agent context window (which wastes thousands of tokens and introduces noise), agents use **Interface-First Subsystem Graph Queries**:

```
           ┌────────────────────────────────────────┐
           │      Target Question / Task Request    │
           └───────────────────┬────────────────────┘
                               │
                               ▼
           ┌────────────────────────────────────────┐
           │  Step 1: Inspect Interface Contract    │
           │  • shared/proto/*/*.proto (gRPC)       │
           │  • services/api-gateway/graph/*.graphql│
           └───────────────────┬────────────────────┘
                               │ (~1.2k tokens)
                               ▼
           ┌────────────────────────────────────────┐
           │  Step 2: Load Targeted Implementation  │
           │  • services/<service-name>/internal/*  │
           │  • frontend/src/components/            │
           └───────────────────┬────────────────────┘
                               │ (~2.5k tokens)
                               ▼
           ┌────────────────────────────────────────┐
           │  Step 3: Execute Local Verification    │
           │  • make ci-local / bun typecheck / test│
           └────────────────────────────────────────┘
```

---

## 🗺️ StudEd Microservices Dependency Graph

### 1. Authentication Subsystem (`auth-service`)
- **Proto Contract**: [`shared/proto/auth/auth.proto`](file:///Users/warunaudarasampath/Documents/projects/studed/studed-doc/shared/proto/auth/auth.proto)
- **Service Implementation**: [`services/auth-service/`](file:///Users/warunaudarasampath/Documents/projects/studed/studed-doc/services/auth-service)
- **Gateway Proxy**: [`services/api-gateway/internal/client/auth.go`](file:///Users/warunaudarasampath/Documents/projects/studed/studed-doc/services/api-gateway/internal/client/auth.go)
- **Frontend Store**: [`frontend/src/stores/auth.ts`](file:///Users/warunaudarasampath/Documents/projects/studed/studed-doc/frontend/src/stores/auth.ts)

### 2. Course & Curriculum Subsystem (`course-service`)
- **Proto Contract**: [`shared/proto/course/course.proto`](file:///Users/warunaudarasampath/Documents/projects/studed/studed-doc/shared/proto/course/course.proto)
- **Service Implementation**: [`services/course-service/`](file:///Users/warunaudarasampath/Documents/projects/studed/studed-doc/services/course-service)
- **Puck Builder**: [`frontend/src/components/puck-blocks/`](file:///Users/warunaudarasampath/Documents/projects/studed/studed-doc/frontend/src/components/puck-blocks)

### 3. Gamification & Focus Subsystem (`gamification-service`)
- **Proto Contract**: [`shared/proto/gamification/gamification.proto`](file:///Users/warunaudarasampath/Documents/projects/studed/studed-doc/shared/proto/gamification/gamification.proto)
- **Service Implementation**: [`services/gamification-service/`](file:///Users/warunaudarasampath/Documents/projects/studed/studed-doc/services/gamification-service)
- **Pomodoro Focus Store**: [`frontend/src/stores/pomodoro.ts`](file:///Users/warunaudarasampath/Documents/projects/studed/studed-doc/frontend/src/stores/pomodoro.ts)
- **UI Components**: [`frontend/src/components/gamification/FloatingPomodoro.tsx`](file:///Users/warunaudarasampath/Documents/projects/studed/studed-doc/frontend/src/components/gamification/FloatingPomodoro.tsx) & [`PomodoroTimer.tsx`](file:///Users/warunaudarasampath/Documents/projects/studed/studed-doc/frontend/src/components/gamification/PomodoroTimer.tsx)

---

## ⚡ Best Practices for Token Minimization

1. **Never load un-indexed raw directories**: Search symbols by full qualified name (`usePomodoroStore`, `AuthService`, `MY_ENROLLMENTS_QUERY`).
2. **Read Interface Contracts First**: Inspect `.proto` and `.graphqls` files before reading handler implementations.
3. **Verify Locally After Edits**: Run `make frontend-typecheck` or `make ci-local` to validate changes with zero token overhead.
