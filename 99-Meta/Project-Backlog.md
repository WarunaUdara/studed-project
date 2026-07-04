---
title: "Project Backlog"
description: "Living backlog for the StudEd MVP/POC, maintained by all parallel agents."
date: 2026-07-05
tags:
  - meta
  - backlog
  - mvp
  - poc
---

# Project Backlog

> [!info] How to use this file
> This is the shared, authoritative backlog for the StudEd MVP. Each agent should:
> - Mark completed work under **Done**.
> - Add newly discovered tasks to **Newly Discovered**.
> - Move accepted tasks to **Priority Queue** with an owner recommendation.
> - Keep entries concrete and small enough for a single focused commit.

## Done

| Task | Owner | Commit / Note |
|------|-------|---------------|
| Fix educator course list scoping in API gateway | Agent A/C | `02d4c38` + `f72a0e9` — pass authenticated educator ID to `course-service` instead of exposing `educatorId` in public filter |
| Add local Docker Compose orchestration for auth/course/api-gateway | Agent A/C | `d2a636b` + uncommitted Dockerfiles / `docker-compose.yml` changes |
| Implement `updateCourse` GraphQL mutation end-to-end | Agent B | Added `UpdateCourse` proto RPC, course-service handler/service/repository, API gateway client, resolver |
| Add frontend edit course flow | Agent A | `120fdcc`, `e8e2d51`, `a3ac658` — update mutation, edit page, edit button |
| Verify local infrastructure (`postgres`, `redis`, `elasticsearch`) starts via `make dev-up` | Agent B | Docker Desktop must be running first |
| Verify educator happy-path: register, login, create course, update course, create lesson, create wave, publish course | Agent B | Tested end-to-end via GraphQL against Dockerized services |
| Verify frontend dev server and production build | Agent B | `bun run dev`, `bun run build`, `bun run lint`, `bun run typecheck` all pass |
| Verify Go services build and tests pass | Agent B | `make go-build`, `make go-test` pass |

## In Progress

| Task | Owner | Note |
|------|-------|------|
| Local dev orchestration polish (seed script, service `.env` files, README instructions) | Agent A/C | `scripts/dev.sh`, `scripts/dev-stop.sh`, service `.env.example` files, README updates committed; `scripts/seed.sh` and Docker Compose changes remain in working tree |

## Priority Queue (highest first)

| Priority | Title | Description | Dependencies | Risk | Est. Effort | Owner Rec. | Required For |
|----------|-------|-------------|--------------|------|-------------|------------|--------------|
| High | Student course catalog + enrollment | Add a `/courses` route that lists published courses for students and an `enrollInCourse` flow. | GraphQL `enrollInCourse` resolver is currently `not implemented`; needs `progress-service` or `course-service` enrollment table. | Medium | Medium | Agent A | Demo, MVP |
| High | Implement `submitWaveAnswers` resolver | Evaluate phase core logic: grade answers, compute score, award XP, enforce `maxReattempts`. | Needs `progress-service` or `course-service` to store attempts; needs `gamification-service` for XP. | High | Large | Agent C | Demo, MVP |
| High | Student dashboard + wave player | After enrollment, students need a dashboard and a wave page that renders `learnBlocks` and `evaluateBlocks`. | Requires course catalog and `wave(id)` query (already works). | Medium | Medium | Agent A | Demo, MVP |
| High | Seed/sample data for demos | Add a script or Makefile target that creates an educator, a published course with lessons/waves, and a student user. | Local infra must be running. | Low | Small | Agent B or any | Demo, POC |
| Medium | Implement `publishLesson` / `publishWave` GraphQL mutations | Educator portal can publish courses but not lessons/waves. | Needs GraphQL mutations + proto/service wiring (proto already has `PublishLesson`/`PublishWave`). | Low | Small | Agent B | MVP |
| Medium | Implement `updateLesson` / `updateWave` resolvers | Allow educators to edit lesson/wave metadata after creation. | Needs proto + service + repository updates. | Low | Small | Agent C | MVP |
| Medium | Lesson/wave ordering & validation | Auto-calculate `sequenceOrder`, prevent duplicates, validate educator ownership on read. | `course-service` repository layer. | Low | Medium | Agent C | MVP |
| Medium | Auth refresh token flow | Frontend does not refresh expired access tokens; long sessions will fail. | `refreshToken` mutation works, `AuthInitializer` needs retry logic. | Medium | Small | Agent A | MVP |
| Low | AI content generation resolvers | `generateLearnBlocks`, `generateEvaluateBlocks`, `translateContent` are stubs. | Needs `ai-service` scaffolding and LLM credentials. | High | Large | Agent C | MVP v2 |
| Low | Subscription & payment flow | `createSubscription`, `cancelSubscription`, payment webhooks are stubs. | Needs `payment-service` and PayHere/Stripe integration. | High | Large | Agent A or C | Production |
| Low | Leaderboards & achievements | `leaderboard`, `myRank`, `achievements`, subscriptions are stubs. | Needs `gamification-service`. | Medium | Large | Agent C | MVP v2 |
| Low | Initialize visualization submodules | `submodules/` are empty; math-to-manim, 3Dmol, tscircuit, matter-js not cloned. | Git submodule init/pin. | Low | Small | Any | Production |

## Newly Discovered

| Priority | Title | Reason | Dependencies | Risk | Est. Effort | Owner Rec. | Required For |
|----------|-------|--------|--------------|------|-------------|------------|--------------|
| High | `make dev-up` assumes Docker Desktop is already running | On macOS the command fails with "Cannot connect to the Docker daemon" if Docker Desktop is not started. | None | Low | Tiny | Agent B or any | POC |
| High | Running services manually is fragile | Services expect `.env` in their own directory or exported env vars; Docker Compose is the reliable path. | Docker Compose service definitions | Low | Small | Agent A/C | POC |
| Medium | `course(id)` and `lesson(id)` queries do not verify ownership or enrollment | Educators can read any course; students can read unpublished content. | RBAC middleware already extracts user context. | Medium | Small | Agent A or C | MVP |
| Medium | Frontend `Select` component uses native `<select>` but spreads `register` from react-hook-form | This may produce type/controlled warnings; verify on all forms. | None | Low | Small | Agent B or any | MVP |
| Low | ~~`shared/graphql-schema/schema.graphql` is out of sync with the gateway schema~~ | Fixed by Agent A in `f72a0e9`. | None | Low | Tiny | Agent A | Documentation |
| Low | TanStack Router warning about SWC | Vite logs a recommendation to switch from `@vitejs/plugin-react-swc`. | None | Low | Tiny | Any | Nice-to-have |

## Current Blockers

1. **Visualization submodules are empty.** `submodules/` only contains `.gitkeep`; any AI/visualization work is blocked until they are initialized.
2. **`progress-service`, `gamification-service`, `payment-service`, `ai-service` are stubs.** They compile but contain no business logic, blocking progress tracking, XP, payments, and AI features.
3. **No shared environment bootstrap.** Running services manually is error-prone because each service expects its own `.env` file or exported env vars.
4. **No seed data.** Every demo requires manually creating users/courses via GraphQL.

## Suggested Work for Agent A

**Student course catalog + enrollment (High, Demo/MVP)**
- Create `frontend/src/routes/courses.tsx` and `courses.$courseId.tsx` to list and view published courses.
- Implement the `enrollInCourse` GraphQL mutation resolver in `services/api-gateway/graph/schema.resolvers.go`.
- Add an enrollment table/record in `course-service` (or start `progress-service`).
- Reason: This is a self-contained vertical that unblocks the student demo path and does not overlap with educator content editing.

**Student dashboard + wave player (High, Demo/MVP)**
- After enrollment, build a student dashboard showing enrolled courses and progress.
- Render `learnBlocks` and a basic quiz UI for `evaluateBlocks`.
- Reason: Builds directly on the catalog work and uses the existing `wave(id)` query.

## Suggested Work for Agent C

**Implement `submitWaveAnswers` resolver (High, Demo/MVP)**
- Implement answer grading against `evaluateBlocks` stored in `course-service`.
- Store attempt history and compute remaining attempts.
- Reason: This is the core learning loop and the highest-value backend feature missing for an MVP demo.

**Implement `progress-service` MVP (High, Demo/MVP)**
- Create DB schema for enrollments, wave attempts, and lesson/course progress.
- Wire `progress-service` into the API gateway.
- Reason: `submitWaveAnswers`, leaderboards, and achievements all depend on progress data.
