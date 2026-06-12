---
title: "Leaderboards"
description: "Platform-wide and course-specific leaderboards driven by XP."
tags:
  - gamification
  - leaderboard
  - competition
  - ranking
  - studed
aliases:
  - "Leaderboard"
  - "Rankings"
  - "High Scores"
date: 2026-06-03
---

# Leaderboards

> [!info] Purpose
> **Leaderboards** create healthy competition by ranking students based on their accumulated [[XP-System|XP]]. They are a key visibility mechanism for the [[Gamification]] system.

## Leaderboard Types

| Type | Scope | Purpose |
|------|-------|---------|
| **Global Leaderboard** | All students on platform | Overall top performers |
| **Course Leaderboard** | Students enrolled in a specific Course | Subject competition |
| **Grade Leaderboard** | Students in the same grade (G1–G11, O/L, A/L) | Peer-level competition |
| **Weekly Leaderboard** | All students, reset every Monday | Short-term engagement |
| **Friends Leaderboard** | Custom group (future) | Social competition |

## Ranking Logic

- **Primary sort:** Total XP (descending).
- **Tiebreaker:** Earliest achievement of that XP total (first to reach ranks higher).
- **Alternative tiebreaker:** Higher average score across all Waves.

## Data Refresh Strategy

| Leaderboard | Refresh Frequency | Implementation |
|-------------|-------------------|----------------|
| **Global / Course** | Every 5 minutes | Cached aggregation query |
| **Weekly** | Real-time (event-driven) | Redis sorted set (ZADD) |
| **Grade** | Every 15 minutes | Cached per grade |

> [!tip] Performance
> For large user bases, use **Redis Sorted Sets (ZSET)** for O(log N) rank lookups.
> Background job recalculates PostgreSQL → Redis every 5 minutes.

## Student Leaderboard UI

```
┌─────────────────────────────────────────────────────────┐
│  🏆 Leaderboard                    [Global ▼] [This Week] │
├─────────────────────────────────────────────────────────┤
│  #1  🥇  Kumara S.        12,450 XP    [You are #42]     │
│  #2  🥈  Nadeesha R.     11,890 XP                      │
│  #3  🥉  Pasindu M.       11,200 XP                      │
│  ...                                                     │
│  #40      Sanjaya T.       8,100 XP                      │
│  #41      Anjali P.        7,950 XP                      │
│  #42  👤  You              7,820 XP    ← Your rank       │
│  #43      Ruwan K.         7,800 XP                      │
│  ...                                                     │
│  [View Full Top 100]                                     │
└─────────────────────────────────────────────────────────┘
```

## Features

### Rank Badges

- Top 3: 🥇 🥈 🥉
- Top 10: Star icon ⭐
- Top 1%: Crown icon 👑
- Top 10%: Diamond icon 💎

### Rank Change Notifications

- Push/email notification when overtaken or when overtaking someone.
- "You climbed from #45 to #42! 🎉"

### Filtering

- Toggle between Global, Course, Grade, Weekly.
- Search for a specific student (by username).

## Privacy & Safety

- Only **first name + initial** or **username** displayed (configurable in settings).
- No PII (email, full name) exposed.
- Option to hide from leaderboards (opt-out in settings).
- Anti-bullying: No comment or direct messaging via leaderboard.

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Tie for #1 | Both show #1, next shows #3 (competition standard) |
| Inactive user | Still appears if XP is high, but grayed out |
| New student | Starts at bottom, climbs as they earn XP |
| Cheating detected | Admin can zero out XP and remove from leaderboard |

## Educator & Admin Views

- See leaderboard for their own Courses.
- Export leaderboard as CSV.
- Identify top performers for rewards/scholarships.

## Related Notes

- [[XP-System]] — How points are earned.
- [[Gamification]] — Overview of all competitive features.
- [[Student Dashboard]] — Where leaderboard snapshot appears.
- [[Progress Tracking]] — Data source for rankings.
- [[Backend Architecture]] — Leaderboard service module.
