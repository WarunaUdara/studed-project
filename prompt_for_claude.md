# Takeover Developer Directive: StudEd Platform Engineering

You are taking over the development of **StudEd**, a production-grade, subscription-based educational platform for Sri Lankan schools (Grade 1-11, O/L, and A/L). This platform is modeled after **Brilliant.org**, focusing on interactive lesson blocks, real-time gamification feedback loops, dynamic grading, and AI-assisted content generation.

Your objective is to drive the platform to production readiness. The foundational architecture and all major integrations (Elasticsearch, AI generation, real-time WebSockets, robust math grading) are now completely wired. Your focus is now on stability testing, pedagogical interactive module implementation (Matter.js/tscircuit), and deployment prep.

---

## 1. Codebase Architecture & Microservices

The repository is structured as a Go-based microservices backend combined with a React SPA frontend using a monorepo approach with Git submodules. 

### A. The Tech Stack
* **Frontend**: React 18, Vite 5, TypeScript, TanStack Router, TanStack Query, Zustand, Tailwind CSS v4 (OKLCH). **Package Manager: Bun**.
* **Backend**: Go 1.22+, gqlgen (GraphQL), gRPC, GORM (PostgreSQL access).
* **Infrastructure**: PostgreSQL, Redis, Elasticsearch (running via Docker Compose).

### B. The 11 Microservices
The backend consists of 11 fully compiling services:
- `api-gateway` (Port 8080)
- `auth-service`
- `course-service`
- `progress-service`
- `gamification-service`
- `payment-service`
- `ai-service`
- `notification-service`
- `upload-service`
*(Note: External infra ports: PostgreSQL is 5433:5432, Redis 6379, Elasticsearch 9200).*

---

## 2. Recently Completed Architecture Upgrades (Do NOT Rebuild These)

A previous agent has already resolved the massive architectural stubs. **The following features are now live and fully implemented:**

### A. Elasticsearch Integration
- **Status**: Complete.
- **Details**: `ListCoursesRequest` proto includes `search_query = 4`. The `course-service` has an `internal/search` package using `go-elasticsearch/v8` that indexes on create/update/publish asynchronously. The search handles fuzziness and falls back to GORM ILIKE if ES is down. The ES index backfills itself on service start automatically.
- **Sinhala Support**: A custom Dockerfile (`infra/docker/elasticsearch/Dockerfile`) installs `analysis-icu` for proper Sinhala text tokenization.

### B. GraphQL Subscriptions & Event Bus
- **Status**: Complete.
- **Details**: A Redis pub/sub event bus is active. All four subscriptions (`xpGained`, `achievementUnlocked`, `waveCompleted`, `leaderboardUpdated`) stream over a WebSocket transport, filtered per-user/scope.

### C. AI Generation & Validations
- **Status**: Complete (`ai-service` is functional).
- **Details**: Backed by Gemini (requires `GEMINI_API_KEY` in `.env`). It validates JSON outputs against the visual Puck editor MDX structure (e.g., MCQ answers must be among options) and retries on failure. Resolvers like `generateLearnBlocks` are fully wired.

### D. Advanced Math Grading & Gamification Parity
- **Status**: Complete.
- **Details**: `scoreAnswers` inside `progress-service` now correctly processes mathematically equivalent answers via a tolerance-based float comparison (e.g., `1/2` ≡ `0.5` ≡ `.5`, mixed numbers, percentages, `\frac{1}{2}`, and comma-separated thousands).
- **Streaks**: Daily-login streaks now advance correctly on the `login` mutation.

### E. Payments & Notifications
- **Status**: Complete.
- **Details**: `payment-service` stores subscriptions in Postgres. PayHere checkout-hash and notify-signature verification is ready (awaiting merchant credentials). `notification-service` handles in-app notifications.

---

## 3. Your Tasks & Next Steps (Phase 2)

### A. Verification & E2E Testing (Priority 1)
The previous agent could not run the frontend tests because Docker Desktop was offline on their environment.
- **Your Task**: Start Docker Desktop, boot the stack, seed the database, and run the Playwright test suite to ensure the new integrations haven't broken the frontend.
```bash
make dev-up
make seed
make frontend-e2e
```

### B. Pedagogical Design: The "Brilliant.org" Standard
With the infrastructure stable, StudEd must evolve from a standard LMS into a highly interactive product. You must integrate these missing **Winning features from Brilliant.org**:
- **Interactive simulations**: Utilize visual sandbox submodules (`Matter.js` for physics, `tscircuit` for electronics, `3Dmol.js` for molecular structures).
- **Spaced repetition algorithms**: Implement logic to resurface wave evaluations.
- **Collaborative features**.

---

## 4. Current Platform Capabilities (Frontend)

### Frontend Routes Coverage
**Student Portal**: `/index.tsx` (landing), `/login.tsx`, `/register.tsx`, `/dashboard.tsx` (with Pomodoro & gamification hub), `/courses/index.tsx`, `/courses/$courseId.tsx`, `/waves/$waveId.tsx`, `/leaderboard.tsx`, `/achievements.tsx`, `/settings.tsx`.

**Educator Portal** (under `/educator/_layout/`): `index.tsx`, `courses.index.tsx`, `courses.new.tsx`, `courses.$courseId.index.tsx`, `courses.$courseId.edit.tsx`, `courses.$courseId.lessons.$lessonId.index.tsx`, `courses.$courseId.lessons.$lessonId.waves.$waveId.tsx`, `leaderboard.tsx`, `achievements.tsx`, `settings.tsx`.

### E2E Testing Suite (Playwright)
There are exactly 12 active test files ensuring zero regressions:
`auth-flow.spec.ts`, `educator-flow.spec.ts`, `educator-ux.spec.ts`, `global-setup.ts`, `leaderboard.spec.ts`, `login.spec.ts`, `profile-pages.spec.ts`, `register.spec.ts`, `student-complete-wave.spec.ts`, `student-enrollment.spec.ts`, `student-flow.spec.ts`, `student-ux.spec.ts`.

---

## 5. Git & Team Collaboration Workflow (Strict)

Because multiple development agents work on this repository concurrently, you MUST follow the Trunk-Based workflow:

```bash
# 1. Start on main and fetch latest remote commits
git checkout main
git pull origin main

# 2. Develop your feature. Use GitHub CLI for issue tracking.
gh issue create --title "feat(course): implement spaced repetition" --body "Add SR tracking" --label "priority:high,backend"

# 3. Commit modularly with Conventional Commits
git add services/progress-service/
git commit -m "feat(progress): integrate spaced repetition algorithm"

# 4. Pull, resolve conflicts if any, Push changes, and close the issue
git pull origin main
git push origin main
gh issue close <issue-number>
```

### Commit Guidelines:
- **Keep commits small and focused.** Do not push monolithic commits.
- **Never force push to `main`.** Always resolve conflicts locally.
- **Commit prefix types**: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`.
- **Use `bun`**: For frontend tasks, exclusively use `bun run`, `bun install`, etc.

---

## 6. Execution Instructions for the AI Agent

When you begin work, follow these strict execution rules:
1. **Brainstorm & Verify**: Outline your planned changes in a checklist. Review existing schemas using `codegraph explore`.
2. **Compile-check constantly**: Run `make frontend-typecheck` and `make go-build`.
3. **Verify via Tests**: Run `make test` and `make frontend-e2e`. All tests must be green before pushing.
4. **Iterative Issue Raising**: If a feature is too large, implement the base functionality, raise follow-up issues on GitHub, and document the remaining tasks for parallel agents.
5. **No Placeholders**: Never write placeholder comments (e.g., `// TODO: implement later`). Write complete, functional code.

**Your absolute first priority is to run `make dev-up && make seed && make frontend-e2e` to verify the stability of the recent backend rewrites.**
