# StudEd Agent Instructions

This file contains persistent instructions for all development agents working on the StudEd platform. Read this file at the start of every session.

## Project Overview

**StudEd** is a premium, subscription-based educational platform for Sri Lankan schools. It serves students from Grade 1-11, O/L, and A/L.

Core concepts:
- **Course -> Lesson -> Wave** content hierarchy.
- A **Wave** is the atomic learning unit containing a **Learn** phase and an **Evaluate** phase.
- Educators build content with a visual **Puck-based MDX Editor** with AI assistance.
- Students earn **XP**, climb **leaderboards**, and achieve proficiency as they progress.

Reference documentation lives in the Obsidian folders at the repo root:
- `00-Project-Overview/` - value proposition, target audience, monetization.
- `01-Architecture/` - system, backend, frontend, database designs.
- `02-Content-Hierarchy/` - Course/Lesson/Wave structure, Learn/Evaluate blocks.
- `03-Educator-Portal/` - editor, AI features, educator dashboard.
- `04-Student-Portal/` - student dashboard, wave interaction, progress tracking.
- `05-Gamification/` - XP, leaderboards, proficiency, reattempts.
- `06-UI-UX/` - design system, component library, user journeys.
- `07-Technical-Specs/` - tech stack, API specs, auth, payments.
- `08-Research-&-References/` - Puck, Math-To-Manim, 3Dmol, tscircuit, Matter.js.
- `99-Meta/` - development plan, glossary.

## Tech Stack

### Frontend
- Vite 5+
- React 18+
- TypeScript 5.x
- TanStack Router (file-based routing)
- TanStack Query (server state)
- Zustand (client state)
- Tailwind CSS v4 (CSS-first config, no tailwind.config.js)
- shadcn/ui + Base UI (@base-ui/react) + Radix UI
- Trophy UI Kit (gamification components: streaks, achievements, leaderboards, points)
- urql (GraphQL client)
- Framer Motion (animations)
- Recharts (charts)
- React Hook Form + Zod
- Puck editor
- Web Audio API (synthesized UI sounds — no audio files)

### Backend
- Go 1.22+
- gqlgen (GraphQL)
- Gin / Echo / chi (REST handlers)
- gRPC + protobuf (inter-service)
- GORM / sqlc (database)
- go-playground/validator
- golang-jwt / casbin (auth/RBAC)
- Asynq / Watermill + Redis (background jobs)
- gorilla/websocket (real-time)

### Data & Infrastructure
- PostgreSQL 15+
- Redis 7+
- Elasticsearch 8+
- Cloudflare R2 (object storage)
- Cloudflare CDN
- Docker + Docker Compose
- GitHub Actions
- Fly.io / Cloudflare Pages (deployment targets)

### AI Models
- **Gemini 3.5 Flash** - Sinhala OCR, text generation, translation.
- **Qwen 2.5 (72B)** - general pedagogy, curriculum planning.
- **DeepSeek-V3 / DeepSeek-Coder** - Manim, 3Dmol, tscircuit, Matter.js code generation.

## Monorepo Structure

```
/
├── AGENTS.md                    # this file
├── README.md
├── Makefile
├── docker-compose.yml
├── .gitmodules
├── .github/workflows/
│   └── ci.yml
├── frontend/                    # React SPA
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── src/
├── services/                    # Go microservices
│   ├── api-gateway/
│   ├── auth-service/
│   ├── user-service/
│   ├── course-service/
│   ├── content-service/
│   ├── progress-service/
│   ├── gamification-service/
│   ├── payment-service/
│   ├── ai-service/
│   ├── notification-service/
│   └── upload-service/
├── shared/
│   ├── go/                      # shared Go packages
│   ├── proto/                   # protobuf definitions
│   └── graphql-schema/          # shared GraphQL fragments
├── infra/
│   ├── docker/                  # base Docker images
│   ├── k8s/                     # Kubernetes manifests
│   └── terraform/               # cloud resources
├── ai/
│   ├── prompts/                 # system prompts
│   ├── manim-pipeline/          # Math-To-Manim integration
│   └── evals/                   # model evaluation suites
└── submodules/                  # Git submodules (pinned)
    ├── math-to-manim/
    ├── 3dmol-js/
    ├── tscircuit/
    └── matter-js/
```

## Git Workflow (Workflow A - Trunk-Based)

All development agents must follow this exact workflow:

```bash
# 1. Start on main and pull latest changes
git checkout main
git pull origin main

# 2. Make your changes
# ... edit files ...

# 3. Stage and commit
git add <files>
git commit -m "type(scope): description"

# 4. Pull again and resolve any conflicts before pushing
git pull origin main
# resolve conflicts if any
git push origin main
```

### Rules
- Work directly on `main` unless explicitly asked to use a feature branch.
- Always `git pull origin main` before starting work and again before pushing.
- Resolve merge conflicts locally. Never force-push to `main`.
- Keep commits small and focused.
- Delete any temporary branches you create after use.

## Commit Message Convention

Use Conventional Commits:

```
type(scope): description

[optional body]

[optional footer]
```

Allowed types:

| Type | Use for |
|------|---------|
| `feat` | New features |
| `fix` | Bug fixes |
| `docs` | Documentation changes |
| `style` | Formatting, missing semicolons, etc. |
| `refactor` | Code refactoring |
| `perf` | Performance improvements |
| `test` | Adding or fixing tests |
| `chore` | Build, tooling, dependency updates |
| `ci` | CI/CD changes |

Examples:
- `feat(auth): add JWT refresh token endpoint`
- `fix(frontend): resolve Puck drag-and-drop state reset`
- `docs(api): update GraphQL course mutations`
- `chore(deps): bump gqlgen to v0.17.x`
- `test(progress): add attempt scoring unit tests`

## Development Agent Rules

1. **Read first.** Review `AGENTS.md`, the relevant docs folders, and existing code before making changes.
2. **Match the stack.** Do not introduce new languages or major frameworks without explicit approval.
3. **Use Bun.** Package manager is Bun. Use `bun install`, `bun run`, and `bunx` instead of `npm`/`yarn`/`npx`.
4. **No hardcoded secrets.** Use environment variables. For Flutter/mobile use `flutter_secure_storage`; for backend use env vars or a secrets manager.
5. **No emojis** in code, comments, or commit messages unless explicitly requested.
6. **Prefer explicit types** over `var`/`dynamic` in Dart and be explicit in TypeScript.
7. **Prefer early returns** over deep nesting.
8. **Write minimal changes.** Do not over-engineer. Build only what is asked for.
9. **Test what you build.** Run relevant tests, type checks, and builds before committing.
10. **Update docs.** If you change architecture, tech choices, or workflow, update the relevant markdown docs and this `AGENTS.md`.

## Service Conventions

Each Go microservice under `services/` is an independent module:

```
services/<name>/
├── go.mod                       # module github.com/studed/<name>
├── main.go
├── internal/
│   ├── handler/                 # HTTP/gRPC handlers
│   ├── service/                 # business logic
│   ├── repository/              # database access
│   └── model/                   # domain models
├── migrations/                  # database migrations
├── Dockerfile
└── Makefile
```

## Frontend Conventions

```
frontend/src/
├── routes/                      # TanStack Router file-based routes
├── components/
│   ├── ui/                      # shadcn/ui + Trophy UI primitives
│   ├── puck-blocks/             # Puck custom blocks
│   ├── learn/                   # Learn phase renderers
│   ├── evaluate/                # Evaluate phase renderers
│   └── gamification/            # Custom gamification wrappers (XPBar, XPToast, Confetti, ProficiencyBadge)
├── graphql/                     # queries, mutations, subscriptions
├── hooks/
├── stores/                      # Zustand stores
├── lib/                         # utilities, constants, types, sounds, errors, gamification
└── styles/                      # global CSS (Tailwind v4 CSS-first config)
```

## Color System — OKLCH

All color tokens in the StudEd frontend use **OKLCH** (`oklch(L C H)`), the modern color space with perceptual uniformity, wide-gamut (P3) support, and consistent lightness across hues. This aligns with Tailwind v4, shadcn/ui v4, and Trophy UI Kit conventions.

### Rules
1. **Always use OKLCH** for new CSS custom properties. Never use HSL, RGB hex, or named colors for theme tokens.
2. **Token format**: `oklch(lightness chroma hue)` where lightness is 0-1, chroma is 0-0.4+, hue is 0-360.
3. **Every foreground token must have a matching `-foreground` variant** for accessibility/contrast control.
4. **Dark mode** overrides live in `.dark { }` and use the same OKLCH format with adjusted lightness/chroma.
5. **Tailwind v4 `@theme inline`** maps tokens directly — no `hsl()` wrapper needed (unlike the old HSL system).

### Token groups
| Group | Tokens | Usage |
|-------|--------|-------|
| Core surface | `--background`, `--foreground`, `--card`, `--popover`, `--border`, `--input`, `--ring` | App shell, cards, inputs |
| Action | `--primary`, `--secondary`, `--accent`, `--destructive` | Buttons, links, focus |
| Feedback | `--success`, `--warning`, `--info` | Success states, warnings, info badges |
| Gamification | `--gold`, `--purple`, `--orange`, `--achievement`, `--rank-1/2/3` | XP, badges, leaderboards, streaks |

### Example
```css
:root {
  --primary: oklch(0.55 0.22 264);
  --primary-foreground: oklch(0.985 0 0);
  --success: oklch(0.64 0.18 145);
  --gold: oklch(0.76 0.18 75);
}
```

### Adding a new color token
1. Add the `--name` and `--name-foreground` OKLCH values to `:root` in `src/styles/index.css`.
2. Add dark-mode overrides in `.dark { }`.
3. Register the Tailwind utility in `@theme inline` as `--color-name: var(--name)`.
4. Use in components as `bg-name`, `text-name`, `border-name`, etc.

## UI Sound System

The frontend uses the **Web Audio API** (no audio files) for subtle UI sounds:
- `lib/sounds.ts` — `playClickSound()`, `playSuccessSound()`, `playErrorSound()`, `playLevelUpSound()`.
- Button clicks automatically play `playClickSound()` via the shadcn `Button` component.
- All sounds respect `prefers-reduced-motion` (silenced when reduced motion is preferred).
- Do NOT add audio file assets — synthesize all sounds via oscillators.

## Environment Notes

- Dev device: Google Pixel 7 Pro (ADB ID `36121FDH3001MJ`) for any mobile/Flutter work.
- Editor: VSCode.
- Platform: macOS arm64 (Apple Silicon).
- All commands must work on macOS arm64.

## Questions?

If something is unclear, ask before implementing. Prefer clarification over assumption.

<!-- CODEGRAPH_START -->
## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tool** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them, including dynamic-dispatch hops grep can't follow. Name a file or symbol in the query to read its current line-numbered source. If it's listed but deferred, load it by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` prints the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
<!-- CODEGRAPH_END -->
