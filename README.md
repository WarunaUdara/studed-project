# StudEd

Premium, subscription-based e-learning platform for Sri Lankan schools.

## Core Concept

StudEd organizes learning content into a strict hierarchy:

- **Course** → **Lesson** → **Wave**
- Each **Wave** contains a **Learn** phase (multimedia blocks) and an **Evaluate** phase (quizzes/exercises).

## Tech Stack

- **Frontend:** Vite + React 18 + TypeScript + TanStack Router + Tailwind CSS + shadcn/ui
- **Backend:** Go 1.22+ microservices (GraphQL + REST + gRPC)
- **Data:** PostgreSQL 15+, Redis 7+, Elasticsearch 8+
- **Storage:** Cloudflare R2
- **AI:** Gemini 3.5 Flash, Qwen 2.5, DeepSeek-Coder
- **DevOps:** Docker Compose, GitHub Actions, Fly.io

## Repository Structure

```
/                    # monorepo root
├── AGENTS.md        # agent instructions (read first)
├── frontend/        # React SPA
├── services/        # Go microservices
├── shared/          # shared Go packages, proto, GraphQL schema
├── infra/           # k8s, terraform, docker
├── ai/              # prompts, manim pipeline, evals
└── submodules/      # visualization engine submodules
```

## Getting Started

1. Read `AGENTS.md` for the full development workflow.
2. Start local infrastructure:
   ```bash
   make dev-up
   ```
3. Install frontend dependencies:
   ```bash
   make frontend-install
   ```
4. Run the frontend dev server:
   ```bash
   make frontend-dev
   ```

## Documentation

Project documentation lives in the Obsidian folders at the repo root:

- `00-Project-Overview/`
- `01-Architecture/`
- `02-Content-Hierarchy/`
- `03-Educator-Portal/`
- `04-Student-Portal/`
- `05-Gamification/`
- `06-UI-UX/`
- `07-Technical-Specs/`
- `08-Research-&-References/`
- `99-Meta/`
# studed-project
