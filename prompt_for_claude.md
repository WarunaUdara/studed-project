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
- `payment-service`
- `ai-service`
- `notification-service`
- `upload-service`

---

## 2. Inconsistencies & Architectural Gaps (Your Tasks)

Through code analysis, several major gaps have been identified that require your immediate attention.

### A. The Elasticsearch Integration Gap (Phase 1)
* **Current State**: `docker-compose.yml` provisions an **Elasticsearch 8.14.0** container on port `9200` (`xpack.security.enabled=false`, which is good for dev). However, **NO Go client exists in any service** (`course-service go.mod` only has GORM + Postgres + gRPC).
* **The gRPC Schema Break**: The API Gateway's GraphQL schema supports a `search` string filter inside `CourseFilter` (`grade`, `subject`, `search`, `isPublished`). However, the internal `course-service` protobuf (`ListCoursesRequest`) has `grade_level`, `published_only`, and `educator_id`, but is **Missing: `string search_query = 4;`**, causing the search intent to be lost entirely.
* **Implementation Plan**:
  1. Modify `shared/proto/course/course.proto` to add `string search_query = 4;` to `ListCoursesRequest`.
  2. Regenerate proto files by running `make proto-gen` at the repository root.
  3. Update `services/course-service/go.mod` to import the official client `github.com/elastic/go-elasticsearch/v8`.
  4. Implement repository indexers in `course-service`: When a course is created/updated/published, index it in Elasticsearch.
  5. Update `services/course-service/internal/repository/course.go` and `internal/service/course.go` to handle `search_query` using Elasticsearch full-text fuzzy matching, with a GORM SQL `LIKE` fallback if Elasticsearch is unreachable.
  6. **Sinhala Language Support**: The architecture doc specifies the `analysis-icu` plugin for proper Sinhala text tokenization. Ensure Elasticsearch is configured with this.

### B. GraphQL Resolver Implementation Status (`schema.resolvers.go`)
**IMPLEMENTED (real logic):**
- `register`, `login`, `refreshToken`, `logout`
- `createCourse`, `updateCourse`, `publishCourse`
- `createLesson`, `updateLesson`, `publishLesson`
- `createWave`, `updateWave`, `publishWave`
- `submitWaveAnswers` (with leaderboard update)
- `enrollInCourse` (with progress)
- `me`, `courses`, `myEnrollments`, `course`, `lesson`, `wave`
- `progress`, `waveProgress`
- `leaderboard`, `myRank`, `achievements`
- `updateMe`

**STUB (returns not implemented error):**
- `generateLearnBlocks` → `return nil, errors.New("not implemented")`
- `generateEvaluateBlocks` → `return nil, errors.New("not implemented")`
- `translateContent` → `return "", errors.New("not implemented")`
- `createSubscription` → `return nil, errors.New("not implemented")`
- `cancelSubscription` → `return nil, errors.New("not implemented")`
- `leaderboardUpdated` → `return nil, fmt.Errorf("not implemented")`
- `xpGained` → `return nil, fmt.Errorf("not implemented")`
- `achievementUnlocked` → `return nil, fmt.Errorf("not implemented")`
- `waveCompleted` → `return nil, fmt.Errorf("not implemented")`

**Your Task for Stubs**: 
- **AI**: Implement client calls to `ai-service` or call Gemini/Qwen APIs directly. 
- **Payments**: Wire up Stripe or PayHere. 
- **Subscriptions**: Set up a Redis Pub/Sub client in `api-gateway/main.go` and push real-time events to React clients via WebSockets.

### C. Advanced Grading & Gamification Parity
* **Grading State**: `scoreAnswers()` in `progress-service` normalizes answers via `normalizeAnswer()` which handles basic float/string comparison. **BUT**: There is no fraction handling (e.g., `1/2`), no LaTeX, and no symbolic math.
* **XP Formula**: The formula in `gamification-service` is `calculateXp(score, xpReward, passingThreshold)`. It scales by score tier.
* **Streak Tracking**: `GetUserStreak()` exists, but daily-login streak tracking is **NOT wired** yet.

---

## 3. Pedagogical Design: The "Brilliant.org" Standard

StudEd must evolve from a standard LMS into an interactive, high-revenue educational product. You must integrate these **Winning features from Brilliant.org analysis**:
- Interactive problem-solving (not just reading)
- Spaced repetition
- AI-guided learning paths
- Math rendering (KaTeX/MathJax)
- Interactive simulations
- Progress visualization
- Collaborative features

### The Core Principle: "Almost Right is Catastrophically Wrong"
1. **Mathematical Equivalence**: A naive string match of `0.5` will reject correct answers like `.5` or `1/2`. You must implement robust symbolic normalization.
2. **AI Content Evals**: When using AI to generate lessons, test the generator. Design automated evaluation tests that run mock responses against the AI service to check JSON schema validity and pedagogical progression.
3. **Structured Interactive Playgrounds**: Utilize visual sandbox submodules (`Matter.js` for physics, `tscircuit` for electronics, `3Dmol.js` for molecular structures). Ensure evaluate blocks can register precise student interactions.

---

## 4. Current Platform Capabilities

To prevent rebuilding what already works, here is the verified state of the platform:

### Frontend Routes Coverage
**Student Portal**:
- `/index.tsx` (landing)
- `/login.tsx`
- `/register.tsx`
- `/dashboard.tsx` (with Pomodoro, curriculum tracker, gamification hub)
- `/courses/index.tsx` (course browse)
- `/courses/$courseId.tsx`
- `/waves/$waveId.tsx` (wave player)
- `/leaderboard.tsx`
- `/achievements.tsx`
- `/settings.tsx`

**Educator Portal** (under `/educator/_layout/`):
- `index.tsx` (educator dashboard)
- `courses.index.tsx`
- `courses.new.tsx`
- `courses.$courseId.index.tsx`
- `courses.$courseId.edit.tsx`
- `courses.$courseId.lessons.$lessonId.index.tsx`
- `courses.$courseId.lessons.$lessonId.waves.$waveId.tsx`
- `leaderboard.tsx`
- `achievements.tsx`
- `settings.tsx`

### E2E Testing Suite (Playwright)
There are exactly 12 active test files ensuring zero regressions:
- `auth-flow.spec.ts`
- `educator-flow.spec.ts`
- `educator-ux.spec.ts`
- `global-setup.ts` (seed)
- `leaderboard.spec.ts`
- `login.spec.ts`
- `profile-pages.spec.ts`
- `register.spec.ts`
- `student-complete-wave.spec.ts`
- `student-enrollment.spec.ts`
- `student-flow.spec.ts`
- `student-ux.spec.ts`

---

## 5. Git & Team Collaboration Workflow (Strict)

### Recent Git History Context (Last 30 Commits)
- `667746f`: docs - prompt update
- `f2aad9e`: docs - prompt add
- `41b3c5e`: feat(frontend) - pomodoro timer with drag, binaural sounds, admin config
- `28a04f4`: fix(gateway) - relax enrollment grade check
- `b072e3d`: feat(seed) - Python course addition
- `f12c02f`: fix(progress) - normalize numeric answers
- `d385889`: feat(backend) - UpdateUser/updateMe mutation
- `9e51b82`: fix(frontend) - restore quality checks
- `7f718cc-d3ab439`: educator portal pages
- `9770f62`: feat(frontend) - default light theme
- `b93894d`: feat(frontend) - dark mode switcher

### Workflow Rules:
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

---

## 6. Execution Instructions for the AI Agent

When you begin work, follow these strict execution rules:
1. **Brainstorm & Verify**: Outline your planned changes in a checklist. Review existing schemas, database connections, and types using tools like `codegraph explore`.
2. **Compile-check constantly**: Run `make frontend-typecheck` and `make go-build` to ensure you do not introduce compilation errors.
3. **Verify via Tests**: Run `make test` (runs Go unit tests) and `make frontend-e2e` for Playwright browser tests. All tests must be green before pushing.
4. **Iterative Issue Raising**: If a feature is too large, implement the base functionality, raise follow-up issues on GitHub (`gh issue create`), and document the remaining tasks for parallel agents.
5. **No Placeholders**: Never write placeholder comments (e.g., `// TODO: implement later`). Write complete, functional code.

Your first priority should be resolving **The Elasticsearch Integration Gap** to unblock course discovery. Good luck.
