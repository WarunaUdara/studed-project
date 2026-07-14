---
title: "Project Backlog"
description: "Living backlog for the StudEd MVP/POC, maintained by all parallel agents."
date: 2026-07-14
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

> [!warning] Reconciled 2026-07-14 against live code (build/vet/test run for every service, full route + resolver audit)
> Almost everything previously listed as an open gap in the 2026-07-09 revision of this file is now **DONE**: wave-lock gating, achievements + streaks (backend and frontend), versioned SQL migrations, `ZREVRANK`-based rank lookup, multi-scope leaderboard updates, gamification design tokens/UI. The MVP scope has also been explicitly narrowed: **AI content generation, payments/subscriptions, real-time GraphQL subscriptions, and the 6 skeleton services (user, content, payment, ai, notification, upload) are out of scope for this demo by decision**, not oversights — they remain honest "not implemented" stubs for a v2 pass.

## Done (verified in code, 2026-07-14)

| Task | Evidence |
|------|----------|
| Auth: register/login/refresh/logout, token refresh (frontend + gateway) | `schema.resolvers.go:19-63`; `AuthInitializer.tsx`; `graphql.ts` urql authExchange |
| Course/Lesson/Wave CRUD + publish (create/update/publish for all three tiers) | `schema.resolvers.go:93-197`; `course-service` |
| Enrollment (idempotent, grade-checked) + wave attempt grading (`submitWaveAnswers`) | `schema.resolvers.go:210,253`; `progress-service/internal/service/progress.go` |
| Wave sequential-unlock gating (LOCKED status, prerequisite enforcement) | `progress-service/internal/service/progress.go:99-100,306-322` |
| XP system: tiered scoring formula, cross-attempt accumulation, manual `AwardXp` | `gamification-service/internal/service/gamification.go:44-144`; unit-tested in `gamification_test.go` |
| Achievements + streaks, fully wired into the attempt flow (not just query-only) | `progress.go:174,198,220` calling `UnlockAchievement`; `gamification.go:227-321` |
| Leaderboard: Redis-backed, multi-scope (global/course/grade), `ZREVRANK`-based `MyRank` (grade now correctly resolved) | `repository/leaderboard.go`; `schema.resolvers.go:585-613` |
| Versioned SQL migrations (not just GORM AutoMigrate) for all 5 real services | `services/*/migrations/*.up.sql` |
| Frontend: full auth flow, educator portal (course/lesson/wave CRUD, Puck editor, publish), student portal (dashboard, catalog, enrollment, wave player, progress, leaderboard, achievements, streaks) | 15/21 routes fully wired to real GraphQL; see route audit below |
| Gamification design system: OKLCH tokens, XPBar, XPToast, LeaderboardRow, RankBadge, ProficiencyBadge, StreakFlame, Confetti | `styles/index.css`; `components/gamification/*` |
| Demo seed scripts (idempotent, TS + bash) | `scripts/mock-data-loader.ts`, `scripts/mock-data-loader.sh` |
| Docker Compose orchestration for the 5 real services | `docker-compose.yml` |
| Leaderboard no longer fabricates fake data on empty results (was showing fake bot names/ranks with no indicator) | `frontend/src/routes/leaderboard.tsx` — real empty state instead |
| Repo hygiene: stopped tracking compiled Go binaries; fixed a `.gitignore` rule that was silently shadowing `internal/service` packages | `.gitignore`; commits `ad68676`, `dc011cc` |
| Backend unit tests: XP tiers/achievements/streaks (gamification), grading/reattempts/wave-lock (progress) | `gamification_test.go`, `progress_test.go` |
| Frontend unit tests: level/XP curve, proficiency, badges, rank glyphs | `lib/gamification.test.ts` |
| Biome lint clean (0 errors, was 8 cosmetic formatting/import-order issues) | `style(frontend)` commit |

## Route Audit (frontend/src/routes, 2026-07-14)

21 route files: 15 fully wired to real GraphQL, 4 are pathless layout/outlet wrappers (no content expected), 2 partial by design (`index.tsx` uses demo data only for the public pre-login marketing preview; `leaderboard.tsx` now shows a genuine empty state instead of fake data).

## Explicitly Out of Scope for This MVP (by decision, not oversight)

| Area | Status | Why deferred |
|------|--------|---------------|
| AI content generation (`generateLearnBlocks`, `generateEvaluateBlocks`, `translateContent`) | Stub, returns "not implemented" | `ai-service` is a bare `/health` skeleton; needs LLM integration work sized for a dedicated pass, not this week's hardening sprint |
| Payments/subscriptions (`createSubscription`, `cancelSubscription`) | Stub | `payment-service` skeleton; needs a payment provider integration (PayHere/Stripe) |
| Real-time GraphQL subscriptions (`leaderboardUpdated`, `xpGained`, `achievementUnlocked`, `waveCompleted`) | Stub | No websocket/pub-sub infra wired yet despite gorilla/websocket being in the stack |
| `user-service`, `content-service`, `notification-service`, `upload-service` | Bare `/health` skeletons, not in docker-compose | Their responsibilities are currently handled inline by auth-service (user data) and course-service (wave content); no functional gap for the demo |
| Visualization submodules (Math-To-Manim, 3Dmol, tscircuit, matter-js) rendered in the Learn phase | `LearnBlockRenderer.tsx` only handles heading/text/image/video/formula; other types render a placeholder | Submodules are cloned (`feat(infra): initialize and add visualization submodules`) but not yet wired into any Learn-phase renderer |

## Small Non-Blocking Cleanup Opportunities

- `frontend/dist` main JS chunk is 1.2MB unsplit (perf smell, not a functional blocker — consider dynamic `import()` for the Puck editor and chart libraries post-demo).
- `GetCourseProgress` still has some N+1 gRPC+DB calls (`progress-service/internal/service/progress.go:398-418`); not a correctness issue at demo scale.

## Spec Gaps Resolved Since Last Reconciliation

Both spec gaps noted on 2026-07-09 (level/XP curve undefined; no canonical achievements list) have been resolved in code: `frontend/src/lib/gamification.ts` implements a triangular cumulative level curve (`cumulativeXpForLevel`/`levelFromXp`, unit-tested), and `BADGE_DEFS`/`computeBadges` define an 8-badge canonical list matched by a real backend achievements system (`gamification-service` achievement repo + `progress-service` unlock triggers).
