---
title: "Progress & Analytics Screen"
description: "Personal progress tracking — mastery made visible, calm and editorial."
tags:
  - ui-ux
  - screens
  - progress
  - analytics
  - student
  - studed
aliases:
  - "Progress Screen"
  - "Progress Tracking Screen"
date: 2026-07-17
---

# Progress & Analytics Screen

> [!info] Goal
> Turn [[Progress-Tracking]] data into self-knowledge: *what do I know, what needs work, am I improving?* Data-dense but never dashboard-cluttered — editorial charts, lots of air.

## Layout

### 1. Header
- Overline `PROGRESS`, serif display-lg: "Your learning, in focus."
- Range selector: segmented pill (Week / Month / Term / All).

### 2. Stat band
Four `AnalyticsStat` cards in a row (2×2 on mobile):
| Stat | Accent |
|------|--------|
| Total XP + delta vs. previous period | Blue |
| Waves completed | Blue |
| Current streak (days) | Amber |
| Average Evaluate score | Green |

Each card: large tabular numeral, muted label, tiny sparkline. No borders-on-borders — cards sit directly on parchment.

### 3. Mastery map
- The signature visualization: per-subject proficiency as a horizontal bar list — subject name (title-md), thin 6px bar, tier label from [[Proficiency-System]] (Completed / Proficient / Expert) with its engraved `ProficiencyBadge`.
- Expert tiers render in amber; everything else in blue. Green is reserved for improvement deltas (+8% this month).

### 4. Activity heatmap
- 16-week contribution-style grid, parchment-toned cells filling to blue at higher activity. Calmer than GitHub's: rounded 4px cells, 3px gaps, no harsh greens.
- Hover tooltip: "12 waves · 340 XP · Tue 14 July".

### 5. Topic breakdown (Recharts)
- Line chart of average Evaluate score over time, one line per subject, 1.5px strokes, no gridlines except a single baseline. Legend as inline pill chips.
- Charts use the brand hues only: blue, green, violet, amber, and a muted neutral — never a categorical rainbow.

### 6. Needs attention
- Violet-accented card list: topics where spaced repetition says knowledge is decaying — "Quadratic factorization — last practiced 9 days ago" + **Review now** ghost button. Feeds [[Reattempt-Mechanics]].

## States

| State | Design |
|-------|--------|
| New user (< 1 week data) | Heatmap and charts replaced by a single encouraging `EmptyState`: "A week of learning will draw your map." |
| Range change | Numbers cross-fade with count-up; charts animate 300ms |

## Motion

- Sections stagger in on load; chart lines draw once on first view, static afterward.
- Count-up numerals everywhere a number changes.

## Mobile

- Stats 2×2 grid, mastery map full width, heatmap scrolls horizontally with momentum, charts full-width with touch tooltips.
