---
title: "Project Backlog"
description: "Living backlog for the StudEd MVP/POC, maintained by all parallel agents."
date: 2026-07-09
tags:
  - meta
  - backlog
  - mvp
  - poc
---

# Project Backlog

> [!info] How to use this file
> This is the shared, authoritative backlog for the StudEd MVP. Each agent should:
> - Mark work as **IN_PROGRESS** while developing and **DONE** after pushing.
> - Update the owner column before starting a task to avoid duplicate work.
> - Add newly discovered tasks to **Newly Discovered**.
> - Move accepted tasks to **Priority Queue** with an owner recommendation.
> - Keep entries concrete and small enough for a single focused commit.

> [!warning] Reconciled 2026-07-09 against live code (via CodeGraph)
> Several items previously listed as "not implemented" are actually **DONE**: `submitWaveAnswers`, `enrollInCourse`, `progress-service` (real persistence), `gamification-service` (real XP + Redis leaderboards), the student dashboard, the wave player, the basic leaderboard UI, and a `mock-data-loader` for seeding. The remaining high-value work is the **premium gamified student UI layer** plus a few small backend wiring gaps. Evidence: `services/api-gateway/graph/schema.resolvers.go:157,182`; `services/progress-service/internal/service/progress.go`; `services/gamification-service/internal/service/gamification.go`; commits `17cef33`, `a5de904`, `dfe7ac1`, `eab6f2a`.

## Done (verified in code)

| Task | Owner | Evidence |
|------|-------|----------|
| Auth: register/login/refresh/logout end-to-end | prior agents | `schema.resolvers.go:19-49`; `auth-service` |
| Course CRUD: create/update/publish + list/detail | prior agents | `schema.resolvers.go:79-105`; `course-service` |
| Lesson + Wave creation, Wave update | prior agents | `schema.resolvers.go:118-144` |
| `submitWaveAnswers` resolver (grading, score, maxReattempts, XP) | prior agents | `schema.resolvers.go:157` -> `progress-service` `RecordAttempt` |
| `enrollInCourse` resolver (idempotent enrollment + progress summary) | prior agents | `schema.resolvers.go:182` |
| `progress-service` real persistence (enrollments, wave_attempts, grading) | prior agents | `services/progress-service/internal/service/progress.go` (GORM AutoMigrate) |
| `gamification-service` real XP (user_xp, xp_history, tiered formula) + Redis leaderboards | prior agents | `services/gamification-service/internal/service/gamification.go`; `repository/leaderboard.go` |
| Student GraphQL queries: Me, Courses, Course, Lesson, Wave, Progress, WaveProgress, Leaderboard, MyRank, MyEnrollments | prior agents | `schema.resolvers.go` query resolvers |
| Frontend: auth flow, educator portal, student catalog, basic dashboard, basic wave player, basic leaderboard list | prior agents | `routes/dashboard.tsx`, `routes/waves.$waveId.tsx`, `routes/courses.*.tsx` |
| Demo seed script (idempotent mock-data-loader) | prior agents | commit `eab6f2a` |
| Docker Compose orchestration for all wired services | prior agents | `docker-compose.yml`; commits `60dd5c6`, `d2a636b` |

## In Progress

| Task | Owner | Note |
|------|-------|------|
| Premium gamified student UI layer | this session | Design tokens + fonts + UI primitives + gamification components + dashboard/wave-player rebuild |

## Priority Queue (highest first)

| Priority | Title | Description | Dependencies | Risk | Est. Effort | Owner Rec. | Required For |
|----------|-------|-------------|--------------|------|-------------|------------|--------------|
| High | Wire design tokens + fonts into Tailwind v4 theme | Add gamification colors (gold/purple/orange), success green, and Inter/Noto Sans Sinhala/JetBrains Mono to `styles/index.css`. | None | Low | Small | this session | Demo, MVP |
| High | Build missing UI primitives | `Tabs`, `Tooltip`, `Skeleton`, `ProgressRing` (circular), `CardDescription`/`CardFooter`, Button `success`/`danger` variants. Radix not installed -> lightweight custom. | Tokens | Low | Small | this session | Demo, MVP |
| High | Gamification components | `XPBar`, `XPToast` (framer-motion), `LeaderboardTable` (medals + scope toggle + "You are #X"), `StreakBadge`, `ProficiencyBadge`. `framer-motion` + `recharts` installed but unused. | Primitives | Medium | Medium | this session | Demo, MVP |
| High | Rebuild student dashboard (gamified) | Continue-Learning card, My Courses grid with progress rings, Leaderboard snapshot with scope toggle + rank callout, XP/level header, stats/badges section. | Gamification components | Medium | Medium | this session | Demo, MVP |
| High | Polish wave player (gamified) | Persistent XP bar + level, "Wave N of M", learn-gate (cannot skip to Evaluate), animated XP toast + confetti on pass, reattempt button + "Attempts X/Y", per-question state, proficiency badge on completion. | Gamification components | Medium | Medium | this session | Demo, MVP |
| High | Persistent XP bar in Navbar | Show level + XP progress; refresh `Me` after submit and update `useAuthStore`. | Gamification components | Low | Small | this session | Demo, MVP |
| High | Level / XP curve system | **Spec gap** — docs leave the level curve undefined. Needs product decision. | None | Low | Small | this session | Demo, MVP |
| Medium | Achievements / badges | **Spec gap** — no canonical list; backend achievements absent. Proposed: frontend-computed milestone badges from existing data. Needs product decision. | None | Medium | Medium | this session | MVP |
| Medium | Wire multi-scope leaderboard updates on submit | Resolver only updates GLOBAL scope on pass (`schema.resolvers.go:172`); course/grade scopes never written. Small resolver change to also update course + grade. | None | Low | Small | this session | MVP |
| Medium | `publishLesson` / `publishWave` mutations | Proto has `PublishLesson`/`PublishWave`; wire service + repository + resolver. | None | Low | Small | any | MVP |
| Medium | `updateLesson` resolver | Allow educators to edit lesson metadata. | Proto + service + repo | Low | Small | any | MVP |
| Medium | Wave gating (LOCKED status) | `GetWaveProgress` never returns LOCKED; no prerequisite enforcement. | course-service | Low | Medium | any | MVP |
| Medium | Auth refresh token flow (frontend) | Long sessions fail when access token expires; `AuthInitializer` needs retry/refresh. | None | Medium | Small | any | MVP |
| Low | AI content generation resolvers | `generateLearnBlocks`, `generateEvaluateBlocks`, `translateContent` are stubs (`schema.resolvers.go:208-219`). | `ai-service` + LLM creds | High | Large | any | MVP v2 |
| Low | Subscription & payment flow | `createSubscription`, `cancelSubscription`, webhooks are stubs (`schema.resolvers.go:223-229`). | `payment-service` + PayHere/Stripe | High | Large | any | Production |
| Low | Real-time subscriptions | `leaderboardUpdated`, `xpGained`, `achievementUnlocked`, `waveCompleted` are stubs (`schema.resolvers.go:380-396`). | WebSocket infra | Medium | Large | any | MVP v2 |
| Low | Initialize visualization submodules | `submodules/` empty; math-to-manim, 3Dmol, tscircuit, matter-js not cloned. | git submodule init | Low | Small | any | Production |

## Spec Gaps Requiring Product Decisions

1. **Level / XP curve** — `XP-System.md:84` says the level system is "not yet specified". Need a concrete XP->level curve before building the XP bar + level indicator.
2. **Badges / achievements canonical list** — no standalone doc; badges are scattered across dashboard/proficiency/leaderboard examples. Need an enumerated list with unlock criteria, or agree to synthesize from proficiency milestones + XP thresholds + streaks + perfect scores.
3. **Achievements backend** — entirely absent (no model/repo/proto/resolver). Decide: frontend-computed badges (fast) vs. full backend system (defer).

## Backend Gaps (small, non-blocking for demo)

- Leaderboard only auto-updates GLOBAL scope on submit; course/grade scopes are read-only today.
- No versioned SQL migrations (GORM `AutoMigrate` only) in progress/gamification services.
- `GetCourseProgress` has N+1 gRPC+DB calls; `CountPassedWavesInCourse`/`InLesson` repo methods exist but are unused.
- `GetMyRank` is naive (fetches top 10000 + linear scan); should use Redis `ZREVRANK`.
- `AwardXp` RPC implemented but never called (no manual XP grant surface).

## Stubs (deferred to MVP v2 / Production)

- AI: `GenerateLearnBlocks`, `GenerateEvaluateBlocks`, `TranslateContent` (`schema.resolvers.go:208-219`).
- Payments: `CreateSubscription`, `CancelSubscription` (`schema.resolvers.go:223-229`).
- Real-time: `LeaderboardUpdated`, `XpGained`, `AchievementUnlocked`, `WaveCompleted` (`schema.resolvers.go:380-396`).
- Achievements query returns empty slice (`schema.resolvers.go:376`).

## Current Blockers

1. **Visualization submodules are empty.** Blocks any AI/visualization work.
2. **Achievements backend absent.** Only blocks if badges must be server-awarded (frontend-computed badges unblock the demo).
3. **Design tokens for gamification (gold/purple/orange) + fonts not wired** into Tailwind v4 theme (being fixed this session).
4. **`framer-motion` and `recharts` installed but never imported** (being fixed this session).
