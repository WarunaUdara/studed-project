# Takeover Developer Directive: StudEd Platform Engineering

You are taking over the development of **StudEd**, a production-grade, subscription-based educational platform for Sri Lankan schools (Grade 1-11, O/L, and A/L). This platform is modeled after **Brilliant.org**, focusing on interactive lesson blocks, real-time gamification feedback loops, dynamic grading, and AI-assisted content generation.

Your objective is to drive the platform to production readiness. The foundational architecture (Go microservices + React SPA) is stable, but critical features remain as unimplemented stubs. You must resolve architectural inconsistencies, integrate search engines, implement AI-driven generators, set up payment workflows, and ensure complete test compliance.

---

## 1. Codebase Architecture & Microservices

The repository is structured as a Go-based microservices backend combined with a React SPA frontend using a monorepo approach with Git submodules. 

### A. The Tech Stack
* **Frontend**: React 18, Vite 5, TypeScript, TanStack Router, TanStack Query, Zustand (global state), Tailwind CSS v4 (OKLCH color system), shadcn/ui. **Package Manager: Bun (strictly use `bun` commands, not `npm`/`yarn`)**.
* **Backend**: Go 1.22+, gqlgen (GraphQL), gRPC (inter-service), GORM (PostgreSQL access).
* **Infrastructure**: PostgreSQL, Redis, Elasticsearch (running via Docker Compose).

### B. The 5 Active Microservices (Docker Compose)
These services are wired and running in `docker-compose.yml`:
1. **API Gateway** (`services/api-gateway`, Port `8080`): Exposes the GraphQL endpoint (`/graphql`) via `gqlgen`. Proxies incoming queries/mutations to internal microservices via gRPC. 
2. **Auth Service** (`services/auth-service`, Port `8081` gRPC / `8085` HTTP): Manages JWT signing, user profiles, credentials, and authentication using GORM.
3. **Course Service** (`services/course-service`, Port `8083` gRPC / `8084` HTTP): Manages courses, lessons, and wave content using GORM.
4. **Progress Service** (`services/progress-service`, Port `8086` gRPC / `8087` HTTP): Handles course enrollment, logs student wave submissions, computes scores, and tracks lesson completion.
5. **Gamification Service** (`services/gamification-service`, Port `8088` gRPC / `8089` HTTP): Tracks streaks, awards XP, handles leaderboard storage (Redis-backed), and unlocks achievements.

*Note: Infrastructure ports are mapped externally as PostgreSQL (`5433:5432`), Redis (`6379:6379`), and Elasticsearch (`9200:9200`). Internal Docker networking uses standard ports (e.g., `postgres:5432`).*

### C. Unimplemented Services
These services are planned in the architecture but are **NOT YET** wired into Docker Compose or fully implemented:
- `services/payment-service`
- `services/ai-service`
- `services/notification-service`
- `services/upload-service`

---

## 2. Inconsistencies & Architectural Gaps (Your Tasks)

Through code analysis, several major gaps have been identified that require your immediate attention.

### A. The Elasticsearch Integration Gap (Phase 1)
* **Current State**: `docker-compose.yml` provisions an **Elasticsearch 8.14.0** container on port `9200`. However, **none** of the Go microservices (specifically `course-service`) have Elasticsearch client code or dependencies configured in their `go.mod`.
* **The gRPC Schema Break**: The API Gateway's GraphQL schema supports a `search` string filter inside `CourseFilter`. However, the internal `course-service` protobuf (`shared/proto/course/course.proto` -> `ListCoursesRequest`) does not define a search query field, causing the search intent to be lost entirely.
* **Implementation Plan**:
  1. Modify `shared/proto/course/course.proto` to add `string search_query = 4;` to `ListCoursesRequest`.
  2. Regenerate proto files by running `make proto-gen` at the repository root.
  3. Update `services/course-service/go.mod` to import the official client `github.com/elastic/go-elasticsearch/v8`.
  4. Implement repository indexers in `course-service`: When a course is created/updated/published, index it in Elasticsearch.
  5. Update `services/course-service/internal/repository/course.go` and `internal/service/course.go` to handle `search_query` using Elasticsearch full-text fuzzy matching, with a GORM SQL `LIKE` fallback if Elasticsearch is unreachable.
  6. **Sinhala Language Support**: Ensure Elasticsearch is configured with the `analysis-icu` plugin for proper Sinhala text tokenisation, as Sinhala is a critical requirement.

### B. AI & Payment Stub Resolvers
* **Current State**: If you look at `services/api-gateway/graph/schema.resolvers.go`, you will find multiple critical mutations returning `errors.New("not implemented")`:
  - `generateLearnBlocks`, `generateEvaluateBlocks`, `translateContent`
  - `createSubscription`, `cancelSubscription`
* **Implementation Plan**:
  1. For AI: Implement client calls in `api-gateway` to communicate with the `ai-service` (you may need to build out `ai-service` first) or call Gemini 3.5 Flash / Qwen 2.5 APIs directly. Map prompts to the visual Puck editor MDX JSON structure.
  2. For Payments: Wire up Stripe or PayHere checkout APIs for `createSubscription` and store access tiers (`BASIC`, `STANDARD`, `PREMIUM`) in the database.

### C. Real-Time GraphQL Subscriptions
* **Current State**: The GraphQL subscriptions (`leaderboardUpdated`, `xpGained`, `achievementUnlocked`, `waveCompleted`) all return `fmt.Errorf("not implemented")` in the API Gateway.
* **Implementation Plan**: Set up a Redis Pub/Sub client in `api-gateway/main.go` and implement the subscription resolvers to push real-time events to connected React clients via WebSockets.

### D. Advanced Grading & Math Parity
* **Current State**: In `services/progress-service/internal/service/progress.go`, the `scoreAnswers` function relies on a simple `normalizeAnswer()` string/float comparison. It fails on fractions (e.g., `1/2` vs `0.5`) and symbolic math.
* **Implementation Plan**: Implement symbolic math checking (e.g., leveraging algebraic comparison or KaTeX/LaTeX normalization) to strictly adhere to the "Almost Right is Catastrophically Wrong" principle.

---

## 3. Pedagogical Design: The "Brilliant.org" Standard

StudEd must evolve from a standard LMS into an interactive, high-revenue educational product. You must integrate "winning features" analyzed from Brilliant.org:

### The Core Principle: "Almost Right is Catastrophically Wrong"
As described in [Brilliant's AI Eval Blog Post](https://blog.brilliant.org/when-almost-right-is-catastrophically-wrong-evals-for-ai-learning-games/), educational platforms cannot afford false grading outcomes.
1. **Mathematical Equivalence**: A naive string match of `0.5` will reject correct answers like `.5` or `1/2`. You must implement robust normalization.
2. **AI Content Evals**: When using AI to generate lessons/questions, we must test the generator. Design automated evaluation tests (evals) that run mock responses against the AI service to check JSON schema validity, correctness of target answers, and pedagogical progression.
3. **Structured Interactive Playgrounds**: Utilize visual sandbox submodules (which exist in `submodules/`):
   - **Matter.js** for physics simulations (gravity, collisions).
   - **tscircuit** for interactive electronics schematic design.
   - **3Dmol.js** for biological and molecular structure rotation.
   - Ensure evaluate blocks can register precise student interactions (e.g., closing a circuit) rather than just multiple-choice clicks.

---

## 4. Current Platform Capabilities

To prevent rebuilding what already works, here is the verified state of the platform:

### Frontend Routes & UI Coverage
**Student Portal**: 
- Fully functional `/login`, `/register`, and `/dashboard` (featuring a draggable, hover-scaling Pomodoro timer with ADHD binaural beats, curriculum trackers, and tabbed Gamification Hub).
- `/courses` browsing, `/waves/$waveId` player, `/leaderboard`, and `/achievements`.
**Educator Portal** (`/educator/_layout/`):
- Full CRUD UI for Courses, Lessons, and Waves. Includes settings, leaderboards, and an achievements gallery view.
**Theming**: Dark mode is implemented and defaults to a light OKLCH theme.

### E2E Testing Suite (Playwright)
The `frontend/e2e/` directory contains 12 active test files ensuring zero regressions:
- Flow tests: `auth-flow.spec.ts`, `educator-flow.spec.ts`, `student-flow.spec.ts`
- Component tests: `educator-ux.spec.ts`, `student-ux.spec.ts`, `leaderboard.spec.ts`, `profile-pages.spec.ts`
- *Rule*: Never commit without running `make frontend-e2e`.

### Gamification Engine
- XP calculation and wave scoring are wired via gRPC between `progress-service` and `gamification-service`.
- **Gap**: `GetUserStreak()` exists, but daily-login streak persistence is not actively tracking chronologically.

---

## 5. Git & Team Collaboration Workflow (Strict)

Because multiple development agents work on this repository concurrently, you MUST follow the Trunk-Based workflow:

```bash
# 1. Start on main and fetch latest remote commits
git checkout main
git pull origin main

# 2. Develop your feature. Use GitHub CLI for issue tracking.
gh issue create --title "feat(course): implement elasticsearch indexing" --body "Sync GORM models with Elasticsearch" --label "priority:high,backend"

# 3. Commit modularly with Conventional Commits
git add services/course-service/
git commit -m "feat(course): integrate elasticsearch client and index courses on update"

# 4. Pull, resolve conflicts if any, Push changes, and close the issue
git pull origin main
git push origin main
gh issue close <issue-number>
```

### Commit Guidelines:
- **Keep commits small and focused.** Do not push monolithic commits containing frontend and backend refactors mixed together.
- **Never force push to `main`.** Always resolve conflicts locally.
- **Commit prefix types**: `feat` (new features), `fix` (bug fixes), `docs` (documentation), `test` (tests), `refactor` (code refactoring).
- **Use `bun`**: For frontend tasks, exclusively use `bun run`, `bun install`, etc.

---

## 6. Execution Instructions for the AI Agent

When you begin work, follow these strict execution rules:
1. **Brainstorm & Verify**: Outline your planned changes in a checklist. Review existing schemas, database connections, and types using tools like `codegraph explore`.
2. **Compile-check constantly**: Run `make frontend-typecheck` and `make go-build` to ensure you do not introduce compilation errors.
3. **Verify via Tests**: Run `make test` (runs Go unit tests) and `make frontend-e2e` for Playwright browser tests. All tests must be green before pushing.
4. **Iterative Issue Raising**: If a feature is too large, implement the base functionality, raise follow-up issues on GitHub (`gh issue create`), and document the remaining tasks for parallel agents.
5. **No Placeholders**: Never write placeholder comments (e.g., `// TODO: implement later`). Write complete, functional code.

Your first priority should be resolving **The Elasticsearch Integration Gap** to unblock course discovery. Good luck.
