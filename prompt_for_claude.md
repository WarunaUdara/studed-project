# Takeover Developer Directive: StudEd Platform Engineering

You are taking over the development of **StudEd**, a production-grade, subscription-based educational platform for Sri Lankan schools (Grade 1-11, O/L, and A/L). This platform is modeled after **Brilliant.org**, focusing on interactive lesson blocks, real-time gamification feedback loops, dynamic grading, and AI-assisted content generation.

Your objective is to drive the platform to production readiness, resolve architectural inconsistencies, integrate search engines, implement AI-driven generators, set up payment workflows, and ensure complete test compliance.

---

## 1. Codebase Directory Mapping & Microservices

The StudEd repository is structured as a Go-based microservices backend combined with a React SPA frontend:

```
/
├── AGENTS.md                    # Persistent agent rules and guidelines
├── Makefile                     # Root build and testing scripts
├── docker-compose.yml           # Database, cache, search, and Go services stack
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── routes/              # TanStack Router file-based routes
│   │   ├── components/          # UI primitives and gamification elements
│   │   ├── stores/              # Zustand global client stores
│   │   ├── lib/                 # Audio synthesis, formatting utilities
│   │   └── styles/              # Tailwind v4 OKLCH theme configuration
│   └── e2e/                     # Playwright end-to-end tests
├── services/                    # Go Microservices
│   ├── api-gateway/             # GraphQL entrypoint (gqlgen) proxies gRPC
│   ├── auth-service/            # User authentication and credentials (GORM)
│   ├── course-service/          # Course, lesson, wave metadata (GORM)
│   ├── progress-service/        # Enrollment, wave attempts, scoring logic
│   └── gamification-service/    # XP tracking, streaks, leaderboards
├── shared/
│   ├── go/                      # Shared logger, telemetry packages
│   ├── proto/                   # Protobuf schemas (shared interface definition)
│   └── graphql-schema/          # Schema fragments
└── scripts/                     # Helper installation scripts
```

### Microservices Communication Map:
- **API Gateway (`services/api-gateway`, Port `8080`)**: Exposes the GraphQL endpoint (`/graphql`) using `gqlgen`. Proxies incoming queries/mutations to internal microservices via gRPC.
- **Auth Service (`services/auth-service`, Port `8081` gRPC / `8085` HTTP)**: Manages JWT signing, user profiles, credentials, and authentication using GORM.
- **Course Service (`services/course-service`, Port `8083` gRPC / `8084` HTTP)**: Manages courses, lessons, and wave content.
- **Progress Service (`services/progress-service`, Port `8086` gRPC / `8087` HTTP)**: Handles course enrollment, logs student wave submissions, computes scores, and tracks lesson completion.
- **Gamification Service (`services/gamification-service`, Port `8088` gRPC / `8089` HTTP)**: Tracks streaks, awards XP, handles leaderboard storage (Redis-backed), and unlocks achievements.

---

## 2. Inconsistencies & Architectural Gaps

You must research the codebase, identify, and address the following structural gaps:

### A. The Elasticsearch Search Inconsistency
* **Current State**: `docker-compose.yml` provisions an **Elasticsearch 8.14.0** container on port `9200`. However, **none** of the Go microservices (specifically `course-service`) have Elasticsearch client code or dependencies configured in their `go.mod`. 
* **The gRPC Schema Break**: The GraphQL gateway schema supports a `search` string filter inside `CourseFilter`. The API Gateway parses it, but the internal `course-service` protobuf (`ListCoursesRequest` in `course.proto`) does not define a search query field, causing the search query to be dropped.
* **The Task**:
  1. Modify `shared/proto/course/course.proto` to add `string search_query = 4;` to `ListCoursesRequest`.
  2. Regenerate proto files by running `make proto-gen` at the repository root.
  3. Update `services/course-service/go.mod` to import the official client `github.com/elastic/go-elasticsearch/v8`.
  4. Implement repository indexers: When a course is created or updated, index it in Elasticsearch.
  5. Update `course-service/internal/repository/course.go` and `internal/service/course.go` to handle `search_query`. Implement full-text fuzzy matching via Elasticsearch, with a GORM SQL `LIKE` fallback if Elasticsearch is unreachable.
  6. **Sinhala Language Support**: Configure Elasticsearch to tokenise Sinhala text properly (the architecture specifies the `analysis-icu` plugin).

### B. AI-Driven Resolvers (Stub State)
* **Current State**: The GraphQL gateway schema defines mutations like `generateLearnBlocks`, `generateEvaluateBlocks`, and `translateContent` to assist educators. Currently, these return static mock data.
* **The Task**:
  1. Implement client calls in `api-gateway` to communicate with the `ai-service` or call Gemini 3.5 Flash / Qwen 2.5 directly.
  2. Map incoming prompts (e.g. syllabus notes) to structured JSON learning blocks (matching the visual Puck editor MDX structure).
  3. Implement automatic Sinhala translation resolvers using Gemini 3.5 Flash.

### C. Real-Time GraphQL Subscriptions
* **Current State**: The schema outlines subscription fields (`leaderboardUpdated`, `xpGained`, `achievementUnlocked`) but the gateway does not implement the websocket or Redis Pub/Sub adapter to push real-time events.
* **The Task**:
  1. Set up Redis Pub/Sub client connection in `api-gateway/main.go`.
  2. Implement resolvers that subscribe to Redis channels and push messages to connected React clients via WebSockets.

### D. Payments & Subscriptions (Stub State)
* **Current State**: The user billing mutations (`createSubscription`, `cancelSubscription`) are mocked.
* **The Task**:
  1. Connect `payment-service` or the API Gateway to Stripe or PayHere checkout APIs.
  2. Store user account levels (`BASIC`, `STANDARD`, `PREMIUM`) in GORM PostgreSQL and enforce access limits in the API Gateway.

---

## 3. Pedagogical Design: Lessons from Brilliant.org

StudEd is modeled on the active-learning principles of **Brilliant.org**. Read and align with the following design guidelines:

### The Core Principle: "Almost Right is Catastrophically Wrong"
As described in [Brilliant's AI Eval Blog Post](https://blog.brilliant.org/when-almost-right-is-catastrophically-wrong-evals-for-ai-learning-games/), educational platforms cannot afford false grading outcomes.
1. **Mathematical Equivalence**: A naive string match of `0.5` will reject correct answers like `.5` or `1/2`.
   - **Action**: Implement symbolic math checking (e.g. leveraging algebraic comparison or float tolerance normalization) in the `progress-service` grading engine.
2. **AI Content Evals**: When using AI to generate lessons/questions, we must test the generator. 
   - **Action**: Design automated evaluation tests (evals) that run mock responses against the AI service to check JSON schema validity, correctness of target answers, and pedagogical progression before content is published.
3. **Structured Interactive Playgrounds**: Make use of visual sandbox submodules:
   - **Matter.js** for physics simulations (e.g., gravity, collisions).
   - **tscircuit** for interactive electronics schematic design.
   - **3Dmol.js** for biological and molecular structure rotation.
   - Ensure the evaluation block registers precise student interactions (e.g. measuring velocity, closing a circuit) and parses achievements.

---

## 4. Git & Team Collaboration Workflow

Because multiple development agents may work on the repository concurrently, you must follow the strict trunk-based workflow:

```bash
# 1. Start on main and fetch latest remote commits
git checkout main
git pull origin main

# 2. Develop your feature, ensuring code compiles at all times
# 3. Create a GitHub issue using the GitHub CLI to track your task
gh issue create --title "feat(course): implement elasticsearch indexing" --body "Sync GORM models with Elasticsearch" --label "priority:high,backend"

# 4. Commit modularly with Conventional Commits
git add services/course-service/
git commit -m "feat(course): integrate elasticsearch client and index courses on update"

# 5. Push changes and close the issue
git pull origin main
git push origin main
gh issue close <issue-number>
```

### Commit Guidelines:
- **Keep commits small and focused.** Do not push monolithic commits containing frontend and backend refactors mixed together.
- **Never force push to `main`.** Always resolve conflicts locally.
- **Commit prefix types**: `feat` (new features), `fix` (bug fixes), `docs` (documentation), `test` (tests), `refactor` (code refactoring).

---

## 5. Tooling: Skills SDK & CodeGraph

You have access to specialized tool extensions to accelerate your development workflow.

### A. Skills SDK
You can install and use custom development skills using the Skills CLI:
```bash
# Verify installation
skills --version

# Search for skills (e.g., Playwright E2E helpers, linting, git)
npx skills search "playwright"

# List all active/installed skills
npx skills --list

# Install a skill locally to the workspace
npx skills add username/repo-name
```
*Note: Locate your configuration directory (typically `~/.claude/skills/` or `~/.gemini/`) and place downloaded skills in the corresponding folders to activate them.*

### B. CodeGraph Exploration
Before performing file edits or searching files via regex, use the `codegraph` CLI to find symbols and trace dependency trees:
```bash
# Explore symbol relationships or get definitions
codegraph explore "CourseRepository"
```
This is the most efficient way to map Go gRPC handlers to service layers without guessing imports.

---

## 6. Execution Instructions for Claude Code

When you begin work, follow these strict execution rules:
1. **Brainstorm & Verify**: Before making code changes, outline your planned changes in a checklist. Review the existing schemas, database connections, and types.
2. **Compile-check constantly**: Run `make frontend-typecheck` and service builds to ensure you do not introduce compilation errors.
3. **Verify via Tests**: Run `make test` for backend unit tests, and `make frontend-e2e` for Playwright end-to-end browser tests. All tests must be green before pushing.
4. **Iterative Issue Raising**: If a feature is too large to fit in a single prompt context or run, implement the base functionality, raise follow-up issues on GitHub (`gh issue create`), and outline the remaining tasks for parallel agents.
5. **No Placeholders**: Never write placeholder comments (e.g., `// TODO: implement later`). Write complete, functional code.
