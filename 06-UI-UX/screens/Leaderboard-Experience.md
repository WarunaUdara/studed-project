---
title: "Leaderboard Screen"
description: "Competitive rankings rendered with restraint — motivation without noise."
tags:
  - ui-ux
  - screens
  - leaderboard
  - gamification
  - studed
aliases:
  - "Leaderboard"
date: 2026-07-17
---

# Leaderboard Screen

> [!info] Goal
> Deliver the competitive spark of [[Leaderboards]] in a calm register — ranked tables that feel like academic honours lists, not arcade scoreboards.

## Layout

### 1. Header
- Overline `RANKINGS`, serif display-lg: "Where you stand."
- Scope segmented pill: **My School** / **Island-wide** / **Global** · Period pill: **This Week** / **All Time**.

### 2. Podium
- Top 3 rendered as an editorial podium, not a cartoon one: three cards on rising baselines (rank 1 tallest, subtle amber atmospheric gradient; rank 2 silver neutral; rank 3 warm bronze tint).
- Each: avatar (56px, serif initial fallback), name, school, XP total in tabular numerals. Rank numeral set large in serif.

### 3. The table
- `LeaderboardRow` list, ranks 4–50: rank numeral (serif, muted), avatar 32px, name + school, weekly XP, rank delta arrow (↑ green / ↓ muted red / — neutral).
- Rows are 56px, separated by 1px borders — no zebra striping.
- **Current user's row is always visible**: if outside the top 50, it's pinned above the table's foot with a soft blue fill and "You" chip.

### 4. League context
- Below the table, a quiet explainer card: "Top 10 this week advance to the Gold league." — the promotion mechanic stated plainly, no badges-of-honor clutter.

## States

| State | Design |
|-------|--------|
| User in top 3 | Their podium card gets a thin amber ring; a single toast on entry: "You're on the podium this week." |
| Weekly reset (Monday 00:00) | Previous week's final standings archived; table shows "Week starting…" with faint positions |
| Live updates | `leaderboardUpdated` subscription: rows reorder with 300ms layout animation, delta arrows flash once |
| Empty (new school) | `EmptyState`: "Be the first on your school's board." |

## Motion

- Row reorder via Framer Motion `layout` — the only animated element; everything else stills.
- Podium cards rise-in once on load, staggered 60ms.

## Mobile

- Podium becomes a horizontal trio of compact cards; table rows compress to 48px; scope pills scroll horizontally. User's pinned row sticks above the tab bar.

## Accessibility

- Table is a real `<table>` with `scope` headers for screen readers. Rank changes announced via `aria-live` summary ("You moved up 2 places"), not per-row chatter.
