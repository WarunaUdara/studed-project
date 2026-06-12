---
title: "XP System"
description: "How Experience Points (XP) are earned, calculated, and displayed across the platform."
tags:
  - gamification
  - xp
  - points
  - rewards
  - studed
aliases:
  - "Experience Points"
  - "XP Rewards"
  - "Point System"
date: 2026-06-03
---

# XP System

> [!info] Purpose
> The **XP (Experience Points) System** is StudEd's core motivational mechanic. Students earn XP by completing Waves, which feeds into [[Leaderboards|leaderboards]], [[Proficiency System|proficiency badges]], and visual progress indicators.

## Earning XP

### Primary Sources

| Action | XP Reward | Notes |
|--------|-----------|-------|
| **Complete a Wave (first pass)** | Wave's `xp_reward` | Base reward set by educator |
| **Complete a Wave (reattempt, higher score)** | Delta XP | Only if new score > previous best |
| **Achieve Lesson Proficiency** | Bonus XP | e.g., +100 XP |
| **Complete a Course** | Bonus XP | e.g., +500 XP |
| **Daily Login Streak** | Streak XP | Scales with consecutive days |
| **Perfect Score (100%)** | Perfect Bonus | e.g., +10% of wave XP |

### No XP Actions

- Previewing a Wave without subscribing.
- Reviewing already-completed Waves (unless reattempt rules apply).
- Failing a Wave.

## XP Calculation Formula

```
XP_earned = base_xp * score_multiplier * perfect_bonus + streak_bonus

Where:
  base_xp = wave.xp_reward
  score_multiplier = (actual_score / 100) [optional, educator-configurable]
  perfect_bonus = 1.1 if score == 100 else 1.0
  streak_bonus = min(streak_days * 5, 50) [capped at 50]
```

> [!tip] Educator Control
> Educators set the `xp_reward` per Wave. Higher difficulty or longer Waves should award more XP.
> The platform suggests a default based on estimated duration.

## Reattempt XP Rules

See [[Reattempt Mechanics]] for full details. Summary:

- **First completion:** Full XP awarded.
- **Reattempt with higher score:** Only the **difference** in XP is awarded.
  - Example: First pass = 60% score → 30 XP. Reattempt = 80% → +10 XP (total 40).
- **Reattempt with same or lower score:** 0 XP.
- **Max reattempts:** Once cap is hit, no more XP can be earned from that Wave.

## XP Storage

| Table | Field | Purpose |
|-------|-------|---------|
| `ATTEMPT` | `xp_earned` | Per-attempt record |
| `PROGRESS` | `highest_score` | Used to calculate delta XP |
| `USER` | `total_xp` | Denormalized cache for fast lookup |
| `LEADERBOARD_ENTRY` | `total_xp` | Snapshot for leaderboard queries |

> [!warning] Denormalization
> `USER.total_xp` and `LEADERBOARD_ENTRY.total_xp` are cached sums. They must be recalculated or updated transactionally when a new high-score attempt is recorded.

## Student-Facing XP UI

### XP Bar

- Persistent bar at the top of the [[Student Dashboard]] or in the header.
- Shows current total XP and next "level" milestone (if level system is implemented).

### XP Toast

- Animated popup on Wave completion:
  - "+50 XP! 🎉"
  - "New high score! +20 bonus XP! 🌟"

### XP Breakdown

- In the profile/stats page, students see a breakdown:
  - Waves: 1,200 XP
  - Proficiency Bonuses: 400 XP
  - Streaks: 150 XP
  - Perfect Scores: 300 XP

## Anti-Gaming Measures

- **Time gates:** Minimum time per Wave to prevent rapid-fire botting.
- **IP/Device tracking:** Flag suspicious patterns (e.g., 50 completions in 10 minutes).
- **Reattempt caps:** Prevent infinite XP farming on easy Waves.
- **Score verification:** Server-side calculation; client cannot fake XP.

## Related Notes

- [[Leaderboards]] — Where XP translates to rank.
- [[Reattempt Mechanics]] — Rules for earning XP on retries.
- [[Proficiency System]] — Bonus XP for lesson mastery.
- [[Wave Interaction]] — Where XP is awarded during play.
- [[Gamification]] — Overview of all motivational features.
- [[Database Schema]] — XP data model.
