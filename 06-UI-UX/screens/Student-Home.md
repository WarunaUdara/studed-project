---
title: "Student Home (Dashboard)"
description: "The student's daily landing — resume learning instantly, see momentum at a glance."
tags:
  - ui-ux
  - screens
  - dashboard
  - student
  - studed
aliases:
  - "Student Dashboard Screen"
date: 2026-07-17
---

# Student Home (Dashboard)

> [!info] Goal
> Answer three questions in one glance: *Where was I? What should I do next? How am I doing?* The screen implements [[Student-Dashboard]] behavior in the [[Design-System|Intelligent Learning Canvas]] style.

## Layout

App shell: 240px sidebar (Home, Courses, Progress, Leaderboard, Achievements), header with search, `StreakBadge`, `XPBar`, notifications, avatar.

### 1. Greeting band
- Dawn gradient wash, no card border.
- Serif display-md: "Good evening, Nethuli." + muted sub-line: "You're 40 XP from Level 7."
- Right side: `StreakBadge` (amber flame, 12 days) and weekly XP sparkline.

### 2. Continue Learning — the hero card
- One large 24px-radius card spanning full width. Left: course name (muted overline), lesson title (title-lg), wave name, one-line "where you stopped" note. Right: large **Continue** primary pill + progress ring (62%).
- This card is the visual anchor — biggest type, most padding (32px).

### 3. Up Next row
- "Up next for you" — horizontal row of 3 `WaveNode`-style cards: next wave in current course, a recommended revision wave (spaced repetition), one new course suggestion.
- Revision card carries a small violet "AI suggested" chip.

### 4. My Courses grid
- 3-column `CourseCard` grid (cover gradient, title, progress ring, last-accessed meta). Max 6 shown, "View all" link.

### 5. This Week strip
- Two half-width cards side by side:
  - **Weekly activity**: 7-dot row (Mon–Sun), completed days in blue, today pulsing.
  - **Leaderboard peek**: top 3 + user's own row pinned, "View leaderboard" ghost link.

### 6. AI nudge (conditional)
- Slim glass card with violet left border: *"You stumbled on quadratic factorization twice this week. Want a 5-minute refresher?"* — **Review with AI** (AI variant button) + dismiss.

## States

| State | Design |
|-------|--------|
| New user (no courses) | Continue card becomes `EmptyState`: serif line "Your first lesson is waiting" + browse CTA |
| Streak at risk (after 8pm) | StreakBadge gains gentle ember pulse + tooltip "Complete one wave to keep your streak" |
| Loading | Skeleton cards matching exact layout geometry |

## Motion

- Page load: greeting → continue card → rows, 40ms stagger rise.
- XP changes animate the header `XPBar` count-up wherever the user is.

## Mobile

- Sidebar → bottom `MobileTabBar`. Greeting compresses to one line. Continue card full-width with stacked CTA. Course grid becomes 2-up horizontal snap scroll.
