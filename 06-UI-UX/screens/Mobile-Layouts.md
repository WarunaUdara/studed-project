---
title: "Mobile Layouts"
description: "Responsive rules and mobile-specific patterns applying the design system to small screens."
tags:
  - ui-ux
  - screens
  - mobile
  - responsive
  - studed
aliases:
  - "Responsive Design"
  - "Mobile Design"
date: 2026-07-17
---

# Mobile Layouts

> [!info] Goal
> Mobile-first for students (many Sri Lankan students learn primarily on phones), without shrinking the desktop experience — mobile is its own considered design, not a collapsed one.

## Breakpoints

| Token | Width | Target |
|-------|-------|--------|
| `sm` | 0–639px | Phones (primary student surface) |
| `md` | 640–1023px | Tablets, small laptops |
| `lg` | 1024px+ | Desktop, educator studio |

## Global Mobile Rules

1. **Navigation**: sidebar collapses to a 5-tab glass `MobileTabBar` (Home, Courses, Progress, Leaderboard, Profile). 64px tall, safe-area padded, active tab = blue dot + label.
2. **One column everywhere.** Multi-column grids become stacks or horizontal snap-scroll rows (courses, achievements).
3. **Typography scales down one step**: display-xl → display-md, display-lg → display-md, body-lg stays 18px for reading comfort.
4. **Touch targets**: minimum 44×44px; card padding reduces 32px → 20px; section rhythm 96px → 56px.
5. **Sheets over dialogs**: every modal becomes a bottom sheet with drag handle, swipe-to-dismiss, and 24px top radius.
6. **Glass is preserved**: tab bar and AI panel keep the blur treatment — it's part of the brand, and modern phones render it cheaply.

## Per-Screen Adaptations

| Screen | Key mobile changes |
|--------|--------------------|
| [[Landing-Page]] | Single column; hero mini-problem full-width; footer accordions |
| [[Student-Home]] | Continue card stacked; courses as snap-scroll row; AI nudge full-width |
| [[Course-Catalog]] | Filters in bottom sheet; single-column cards with larger covers |
| [[Lesson-Player]] | Chrome → progress bar only; AI as floating violet FAB; blocks full-bleed 16px gutters |
| [[Problem-Solving-Experience]] | Step rail → "Step n of m" pill; simulation stacks below; hints as bottom sheet |
| [[AI-Tutor-Interface]] | Full-screen sheet; composer sticky above keyboard; suggest chips horizontal scroll |
| [[Progress-Analytics]] | Stats 2×2; heatmap horizontal scroll; charts full-width touch tooltips |
| [[Leaderboard-Experience]] | Compact podium trio; own-row pinned above tab bar |
| [[Achievements-Gallery]] | 2-column grid; unlock toast above tab bar |
| [[Subscription-Page]] | Premium first; sticky billing toggle; full-screen checkout |
| [[Educator-Studio]] | Read-only overview/analytics; editing requires larger screen |

## Interaction Notes

- **Pull to refresh** on Home, Leaderboard, Progress — native-feeling, subtle spinner.
- **Haptics**: light impact on correct answers and achievement unlocks (progressive enhancement, respects system settings).
- **Offline-first reading**: Learn content caches per wave; Evaluate queues submissions — critical for variable connectivity.
- **Safe areas**: all fixed chrome (tab bar, FAB, toasts) respects iOS/Android safe-area insets.

## Performance Budgets (mobile)

- First contentful paint < 1.5s on 4G; route JS < 200KB gzip for student screens.
- Images: AVIF/WebP, `srcset` sized per breakpoint; atmospheric gradients are pure CSS (zero image cost).
- Serif/sans subsets: Latin + Sinhala + Tamil only, `font-display: swap`.

## Motion on Mobile

- Same durations, reduced travel distances (16px → 8px).
- Snap-scroll rows use scroll-snap, not JS carousels.
- `prefers-reduced-motion` disables gradient drift and tab transitions.
