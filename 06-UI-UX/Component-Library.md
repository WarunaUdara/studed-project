---
title: "Component Library"
description: "Inventory and visual specifications of reusable UI components built on the Intelligent Learning Canvas design system."
tags:
  - ui-ux
  - components
  - react
  - shadcn
  - frontend
  - studed
aliases:
  - "UI Components"
  - "Component Inventory"
  - "React Components"
date: 2026-06-03
---

# Component Library

> [!info] Purpose
> A centralized inventory of all reusable UI components in StudEd, built on **shadcn/ui** + **Trophy UI Kit** primitives and styled to the [[Design-System|Intelligent Learning Canvas]] tokens. Every component inherits the system's 24px card radius, pill buttons, minimal shadows, and calm motion.

## Core Primitives

### Button

Pill-shaped (`radius-full`) in all variants. Height 40px default, 48px large, 32px small. Label style `label` (13px/500). Plays `playClickSound()` on press.

| Variant | Spec | Usage |
|---------|------|-------|
| **Primary** | `--primary` bg, white text; hover deepens 6% chroma | Main CTAs — Start Wave, Continue, Subscribe |
| **Secondary** | White bg, `--border` 1px, Ink text; hover border deepens | Alternative actions |
| **AI** | `--ai` bg, white text, subtle violet glow on hover | Ask AI Tutor, Generate with AI |
| **Success** | `--success` bg | Submit answer, mark complete |
| **Ghost** | Transparent, muted text; hover `--muted` bg | Tertiary nav actions |
| **Destructive** | `--destructive` bg | Delete, cancel subscription |

Hover: `y −1px`, 150ms `ease-soft`. Active: `scale(0.98)`. Focus: 2px ring + 2px offset.

### Card

The signature surface: **24px radius, 1px `--border`, white on parchment, no resting shadow, 24–32px padding.**

| Variant | Spec | Usage |
|---------|------|-------|
| **Standard** | White, border, hover raises (2px shadow + y −2) | Course cards, stat cards |
| **Interactive** | Standard + cursor pointer + arrow affordance on hover | Clickable waves, lessons |
| **Glass** | `.glass` recipe, 24px radius | Floating nav, AI panel, paywall highlights |
| **Atmospheric** | White card over a soft gradient wash | Hero panels, empty states |
| **Outlined** | Transparent bg, border only | Nested content inside cards |

### Input

- 8px radius, `--input` border, 44px height, parchment-tinted bg at rest → white on focus.
- Focus: 2px `--ring` with 2px offset. Error: destructive border + 13px message below.
- Labels above inputs (never placeholder-only), `label` style, muted.

### Progress

| Type | Spec | Usage |
|------|------|-------|
| **Linear** | 6px track (`--muted`), `--primary` fill, rounded-full, animated width 450ms | Course completion |
| **Ring** | SVG, 2.5px stroke, stroke-dashoffset draw-in | CourseCard progress, wave unlock |
| **Path** | Checkpoint dots connected by 2px line; completed = blue fill, current = pulsing ring, locked = muted | Wave map |

### Dialog / Sheet

- 24px radius, floating elevation, parchment scrim at 40% + backdrop blur 8px.
- Entry: fade + y 12→0 + scale 0.98→1, spring-gentle.
- Mobile: bottom sheet with 24px top radius and drag handle.

### Toast

Glass surface, 16px radius, top-center on mobile / bottom-right desktop. Variants: success (green leading icon), error, AI (violet), achievement (amber, with `playLevelUpSound()`).

## Layout Components

| Component | Description |
|-----------|-------------|
| `AppShell` | Sidebar + main canvas on parchment; sidebar 240px white with 1px right border |
| `TopNav` | Landing/marketing glass nav, sticky, blurs on scroll |
| `Header` | In-app top bar: search, streak, XP, notifications, avatar |
| `MobileTabBar` | Bottom 5-tab bar, glass, 64px, active tab = blue dot + label |
| `PageContainer` | Max-width wrapper + vertical rhythm (`space-16` sections) |

## Content Components

| Component | Description | Key specs |
|-----------|-------------|-----------|
| `CourseCard` | Cover area (atmospheric gradient or course art), title-md, progress ring, meta row | 24px radius, hover lift |
| `LessonRow` | Numbered row with title, wave count, completion state | 16px vertical padding, serif index numeral |
| `WaveNode` | Path checkpoint: 40px circle, state ring (done/current/locked) | Unlock animation: ring draw 450ms |
| `WavePlayer` | Full-canvas player shell: slim top bar (exit, progress, AI button), 720px reading column | Chrome fades after 3s of reading |
| `BlockRenderer` | Renders Learn/Evaluate blocks from JSON | Consistent 32px inter-block rhythm |

## Learn Blocks

| Component | Description |
|-----------|-------------|
| `TextBlock` | Serif-led rich text, `body-lg`, measure 66ch, drop-cap optional for wave intros |
| `ImageBlock` | 16px radius, caption in `body-sm` italic, click-to-zoom dialog |
| `GraphicBlock` | Manim/3Dmol/tscircuit/Matter.js iframe in a bordered 16px-radius frame |
| `AudioBlock` | Minimal player: pill progress, speed control, no waveform clutter |
| `CalloutBlock` | Tinted side-border card: blue = concept, green = tip, amber = remember, violet = AI insight |

## Evaluate Blocks

| Component | Description | Interaction |
|-----------|-------------|-------------|
| `MCQBlock` | Large selectable cards (16px radius), single/multi | Select → soft blue fill; submit → green/red state with explanation reveal |
| `FillInBlankBlock` | Inline pill inputs inside serif sentence | Auto-advance, inline validation |
| `DragDropBlock` | Rounded tokens → dashed drop zones | Spring drag; select-based fallback for a11y |
| `ProblemCanvas` | Interactive step-solver: prompt in serif italic, step rail on the left, workspace center, hint ladder | Step-by-step reveal, no full-solution dumps |
| `HintLadder` | Progressive hints, each "costs" nothing but reveals one rung at a time | AI-violet accent |
| `EvaluateResult` | Score hero: large serif numeral, XP earned, per-question breakdown accordion | Green atmospheric gradient on pass |

## Gamification Components

Restrained Duolingo: the feedback loop without the cartoons.

| Component | Description | Accent |
|-----------|-------------|--------|
| `XPBar` | Header pill: total XP, tabular numerals, +N chip animates in on gain | Blue |
| `XPToast` | Glass toast with count-up numerals | Blue |
| `StreakBadge` | Geometric flame mark + day count; subtle ember pulse (only animated loop in the system) | Amber |
| `ProficiencyBadge` | Engraved-medal SVG: Completed / Proficient / Expert tiers | Amber for Expert |
| `LeaderboardRow` | Rank numeral (serif), avatar, name, XP delta arrow; current user row = soft blue fill | Rank 1–3 accents |
| `AchievementCard` | Medal SVG, name, unlock date; locked state = 30% opacity + "How to unlock" hint | Amber |
| `LevelUpModal` | Centered, amber atmospheric gradient, medal draw-in animation | Amber |

## AI Components

| Component | Description |
|-----------|-------------|
| `AITutorPanel` | Right-side glass sheet (420px desktop / full-screen mobile). Violet gradient header, serif greeting, chat thread, suggestion chips |
| `AIMessage` | Violet-tinted bubble, 16px radius, streaming caret with violet shimmer |
| `AIThinkingDots` | Three-dot pulse at 40% opacity |
| `AISuggestChip` | Pill chips under input: "Explain this step", "Give me a hint", "Quiz me" |
| `AIGeneratedBadge` | Small violet sparkle + "Drafted by AI" label on educator content |

## Educator Components

| Component | Description |
|-----------|-------------|
| `BlockEditor` | Puck-based [[MDX-Editor]] canvas on parchment, white block cards, 12px radius |
| `BlockPalette` | Left rail of draggable block types, grouped Learn / Evaluate / Media |
| `AIPanel` | Prompt input + generated suggestion cards with one-click insert |
| `PreviewToggle` | Segmented pill: Edit / Student preview |
| `AnalyticsStat` | Large tabular numeral + sparkline, muted label |

## Feedback Components

| Component | Description |
|-----------|-------------|
| `EmptyState` | Atmospheric gradient wash, serif display-md line, single primary CTA |
| `Skeleton` | Parchment-toned shimmer blocks, 12px radius |
| `ErrorBoundary` | Centered calm error, ghost retry button |
| `LoadingSpinner` | 20px ring, `--primary`, used only for >400ms waits |

## Component Status

| Component | Status | Notes |
|-----------|--------|-------|
| `Button` / `Card` / `Input` | In Design | Token-ready specs above |
| `AppShell` | Planned | — |
| `CourseCard` | Planned | — |
| `WavePlayer` | Planned | Chrome auto-hide behavior spec'd |
| `ProblemCanvas` | In Design | Step-solver interaction critical |
| `AITutorPanel` | In Design | Streaming + suggestion chips |
| `DragDropBlock` | In Design | Touch + a11y fallback |
| `LevelUpModal` | Planned | Animation spec ready |
| `BlockEditor` | In Research | Depends on [[Puck-Research]] |

## Related Notes

- [[Design-System]] — Tokens, color, type, motion these components consume.
- [[Screen-Designs]] — Where each component appears.
- [[Frontend-Architecture]] — Component organization in code.
- [[Wave-Interaction]] — Wave player component behavior.
- [[Student-Dashboard]] / [[Educator-Dashboard]] — Portal-specific usage.
