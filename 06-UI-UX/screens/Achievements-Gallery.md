---
title: "Achievements Gallery"
description: "Achievement system screen — engraved medals, amber accents, quiet pride."
tags:
  - ui-ux
  - screens
  - achievements
  - gamification
  - studed
aliases:
  - "Achievements"
  - "Achievement System"
date: 2026-07-17
---

# Achievements Gallery

> [!info] Goal
> Make accomplishments feel earned and permanent — a personal honours wall, not a sticker book. Visual language: engraved medals, ink linework, amber reserved for the moment of unlock.

## Layout

### 1. Header
- Overline `ACHIEVEMENTS`, serif display-lg: "What you've earned."
- Summary line: "14 of 52 unlocked" + thin amber progress bar (6px).

### 2. Recently unlocked
- Top row of up to 3 `AchievementCard`s with the amber atmospheric glow, newest first. Each links to the wave or streak that earned it.

### 3. Category groups
Achievements grouped in collapsible sections, each with a small geometric category mark:
| Category | Examples | Accent |
|----------|----------|--------|
| Milestones | First wave, first course completed | Blue |
| Mastery | First Expert proficiency, 10 Expert topics | Amber |
| Consistency | 7/30/100-day streaks | Amber |
| Exploration | 5 subjects tried, cross-grade challenge | Blue |
| Community | Top-10 finish, helping a classmate | Violet |

### 4. Achievement cards
- Grid (4-col desktop, 2-col mobile) of `AchievementCard`s:
  - **Unlocked**: engraved medal SVG (ink linework + single accent fill), name (title-md), unlock date, one-line description.
  - **Locked**: same medal at 30% opacity in muted ink, name visible, and crucially a "How to unlock" line — every locked achievement is a goal, never a mystery.
- Rare/legendary tiers get a thin amber border even when locked.

### 5. Unlock moment (global, not just this screen)
- When an achievement unlocks anywhere in the app: `XPToast`-style glass toast with medal draw-in animation (stroke-dashoffset, 600ms) + `playLevelUpSound()`. Tapping it navigates here.
- Major achievements (100-day streak, Expert tier) escalate to the `LevelUpModal`: centered, amber gradient wash, medal large, single **Continue** button. One modal, never stacked.

## States

| State | Design |
|-------|--------|
| No achievements yet | Gallery shows all locked cards — an inviting map of goals, with the nearest-to-unlock card highlighted: "1 wave away" |
| Near unlock | Locked cards within 20% of completion show a thin progress ring around the medal |

## Motion

- Medal draw-in on first view of each newly unlocked card.
- Category sections expand with height animation, 250ms.
- Nothing loops; this is a hall of records, not an arcade.

## Mobile

- 2-column grid, recently-unlocked becomes a horizontal snap row, unlock toast renders full-width above the tab bar.

## Accessibility

- Medals are decorative SVGs with text equivalents; locked/unlocked state conveyed in text, not opacity alone. Unlock announcements via `aria-live` toast region.
