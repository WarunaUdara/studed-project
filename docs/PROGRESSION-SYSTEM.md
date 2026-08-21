# Progression System — Canonical Plan

Status: authoritative. Supersedes any conflicting behaviour in code.

Every motivational signal in StudEd — XP, level, streak, achievements, rank,
progress — is defined once here. When an agent or contributor adds a surface
that shows one of these signals, it reads it from the owner named below. It
does not recompute it.

This document exists because six leaderboard renderings, three name-masking
implementations, two badge rule sets and two reattempt policies were built
independently and disagreed with each other. The rule is now: **one signal,
one owner, one implementation, one canonical UI home.**

---

## 1. Ownership

| Signal | Owner | Storage | Never computed by |
|---|---|---|---|
| XP total, XP history | gamification-service | Postgres `user_xp`, `xp_history` | frontend, progress-service |
| Achievements | gamification-service | Postgres `user_achievements` + static catalog | frontend |
| Streak | gamification-service | Postgres `user_streaks` | frontend |
| Rank, leaderboards | gamification-service | Redis ZSET (derived index) | frontend |
| Wave / lesson / course progress | progress-service | Postgres `wave_attempts`, `enrollments` | frontend, gamification-service |
| Level, proficiency label, rank glyph | frontend `lib/gamification.ts` | derived, pure | backend |

Level and proficiency are pure presentational functions of values the backend
owns (`totalXp`, `highestScore`). They live in exactly one frontend module and
are unit tested. Nothing else may re-derive them.

---

## 2. XP

Server-side only. The client can never assert an XP amount.

**Sources**

| Source | Amount | Award-once key |
|---|---|---|
| Wave passed | tiered on score (below) | `(user, "wave_completed", waveID)` |
| `lesson_complete` | +20 | `(user, achievement)` |
| `lesson_proficient` | +100 | `(user, achievement)` |
| `first_course` | +200 | `(user, achievement)` |
| Daily streak | `min(streak * 5, 50)` | one per calendar day |

**Wave tiers** (`calculateXp`, gamification-service):

| Score | Award |
|---|---|
| 100 | `xpReward` |
| 80–99 | 80% |
| 60–79 | 60% |
| threshold–59 | 40% |
| below threshold | 0 |

Re-passing an already-completed wave awards nothing. This is deliberate and
supersedes the delta-XP-on-improvement rule sketched in
`05-Gamification/XP-System.md`: delta XP requires a per-wave high-water mark in
the award path that does not exist, and award-once is the behaviour the
reattempt cap and the achievement bonuses were built against.

---

## 3. Level

Triangular curve, frontend-derived, single implementation in
`lib/gamification.ts`:

```
cumulative XP to reach level L = 100 * (L-1) * L / 2
L1@0  L2@100  L3@300  L4@600  L5@1000  L6@1500  L7@2100
```

Canonical home: the navbar XP bar. Any other surface showing a level renders
`<XPBar />` rather than recomputing.

---

## 4. Streak

A streak counts **consecutive days on which the student learned**, not days on
which they loaded a page.

- Advanced only by real activity: a recorded wave attempt.
- `me.streak` is a pure read and must never mutate.
- Same calendar day (UTC): no change. Yesterday: +1. Older: reset to 1.
- Longest streak is retained.

---

## 5. Achievements

The catalog is server-owned. The API returns **every** achievement with an
`unlocked` flag and `unlockedAt` when unlocked, so the UI can show locked ones
without knowing the rules.

| ID | Unlocked when |
|---|---|
| `first_wave` | first wave passed |
| `perfect_score` | any wave scored 100 |
| `lesson_complete` | every wave in a lesson passed |
| `lesson_proficient` | lesson complete and mean highest score ≥ 80 |
| `first_course` | every wave in a course passed |
| `rising_star` | 500 XP |
| `scholar` | 2,000 XP |
| `master` | 5,000 XP |

The frontend does not evaluate these conditions.

---

## 6. Leaderboards

**Scopes.** `GLOBAL`, `GRADE`, `COURSE`, `WEEKLY`. `FRIENDS` is not shipped —
there is no friends model — and is absent from the schema until one exists.

**Weekly** is a genuine ISO-week bucket (`leaderboard:weekly:<isoYear>-W<week>`)
carrying the XP earned inside that week, with a 15-day TTL. It rolls over at
Monday 00:00 UTC with no job to run.

**Ordering.** Composite Redis score, so ties are resolved by who reached the
total first, per `05-Gamification/Leaderboards.md`:

```
score = totalXp * 2^29 + (2^29 - 1 - secondsSince(2026-01-01))
```

Exact in float64 for totals up to 16.7M XP and for ~17 years of timestamps.

**Rank numbers** use competition standard: equal XP shares a rank, the next
distinct total skips. `myRank` is `ZCOUNT(minScoreFor(xp+1), +inf) + 1` —
O(log N), no scan. An unranked user gets rank `0`, never an error.

**Identity.** The ZSET member is the bare user ID. Display names live in
Postgres (`user_xp.display_name`) so a Redis flush cannot lose them, and are
attached at read time. Masking to "First L." happens once, at the gateway, on
the way out — never at write time, so the rule can change without rewriting
Redis and educators can later be granted unmasked cohort views.

**Durability.** Redis is a derived index. On boot the service rebuilds every
board from Postgres, names included.

**Failure policy.** A leaderboard write is a side effect of a submission. It is
retried and logged, and it never fails the student's submission — the attempt
and the XP are already durable in Postgres.

---

## 7. Progress

progress-service owns it. `WaveProgress.status` is one of `LOCKED`,
`AVAILABLE`, `STARTED`, `COMPLETED`.

- A wave unlocks when the previous wave in course order is passed, or its
  reattempt cap is exhausted.
- `highestScore` is the max across attempts; `completedAt` is the **first**
  passing attempt.
- `CourseProgress.completedAt` is set when completed waves equal total waves.

**Reattempts.** One policy: the cap is `wave.maxReattempts`, and
`maxReattempts <= 0` means unlimited. `remainingAttempts` is `-1` when
unlimited and otherwise `max(0, cap - used)` — reported identically on the
first submission and on an idempotent replay.

**Proficiency** (frontend label over backend scores): not started / in progress
/ completed / proficient (mean ≥ 80) / expert (mean = 100).

---

## 8. Canonical UI homes

One home per signal. A surface that is not the canonical home either links to
it or renders the shared component.

| Signal | Canonical home | Shared component |
|---|---|---|
| XP + level | navbar | `XPBar` |
| Streak | dashboard streak widget | `DashboardStreakWidget` |
| Standing (compact) | dashboard league widget | `DashboardLeagueWidget` |
| Standing (full) | `/leaderboard` | `LeaderboardRow` |
| Achievements | `/achievements` | — |
| Course progress | `/courses/$courseId` and dashboard "continue" | `Progress` |
| Cohort rankings | `/educator/leaderboard` | `LeaderboardRankings` |

**Every leaderboard row in the product renders `LeaderboardRow`.** The student
board, the dashboard widget, the daily-spark screen and the marketing preview
all use it. This is what stops the six-renderings problem returning.

---

## 9. Rules for contributors and agents

1. **No invented data.** A surface shows a real value or an empty state. Mock
   names, hardcoded ranks, and derived-from-`rank % 3` trend arrows are defects,
   not placeholders. The one exception is the marketing landing page, whose
   demo widgets must be visibly labelled as illustrative.
2. **No second implementation.** Before adding a leaderboard row, a level
   calculation, or a name mask, use the one in the table above.
3. **No client-side authority.** If the client can compute it and the server
   also computes it, the server wins and the client stops.
4. **A signal that has no backend does not ship.** League tiers and promotion
   were shipped as copy with no implementation behind them. Build it or omit it.
