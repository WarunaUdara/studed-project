---
title: "Component Library"
description: "Inventory of reusable React/shadcn UI components used across StudEd."
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
> A centralized inventory of all reusable UI components in StudEd, built on **shadcn/ui** primitives and extended for platform-specific needs.

## Base Components (shadcn/ui)

| Component | Source | Usage |
|-----------|--------|-------|
| `Button` | shadcn | All CTAs, form submissions |
| `Card` | shadcn | Course cards, stat cards, Wave cards |
| `Dialog` | shadcn | Modals for confirmations, previews |
| `Input` | shadcn | Forms, search, editor inputs |
| `Select` | shadcn | Filters, dropdowns |
| `Tabs` | shadcn | Learn/Evaluate toggle, dashboard sections |
| `Toast` | shadcn | XP notifications, success messages |
| `Tooltip` | shadcn | Hints, info icons |
| `Progress` | shadcn | Course completion bars |
| `Skeleton` | shadcn | Loading states |

## Custom Components

### Layout

| Component | Description |
|-----------|-------------|
| `AppShell` | Main layout wrapper (header + sidebar + main) |
| `Sidebar` | Collapsible nav for student/educator portals |
| `Header` | Top bar with search, notifications, XP, profile |
| `MobileNav` | Bottom tab bar for mobile |

### Content

| Component | Description |
|-----------|-------------|
| `CourseCard` | Card showing course image, title, progress ring |
| `LessonCard` | Accordion or list item with wave count and status |
| `WaveCard` | Path node or list item with lock/complete icon |
| `WavePlayer` | Full-screen wrapper for Learn + Evaluate phases |
| `BlockRenderer` | Dynamically renders Learn/Evaluate blocks from JSON |

### Learn Blocks

| Component | Description |
|-----------|-------------|
| `TextBlock` | Rich text renderer with markdown/HTML support |
| `ImageBlock` | Responsive image with zoom, caption, alt text |
| `GraphicBlock` | SVG/chart renderer or iframe for complex graphics |
| `AudioBlock` | Custom audio player with play/pause and speed |

### Evaluate Blocks

| Component | Description |
|-----------|-------------|
| `MCQBlock` | Radio or checkbox group with instant feedback |
| `FillInBlankBlock` | Inline inputs within a sentence |
| `DragDropBlock` | Touch-friendly drag-and-drop zones |
| `EvaluateResult` | Score display with correct/incorrect breakdown |

### Gamification

| Component | Description |
|-----------|-------------|
| `XPBar` | Persistent XP display in header |
| `XPToast` | Animated popup for XP gains |
| `LeaderboardTable` | Ranked list with medals and rank changes |
| `StreakBadge` | Flame icon with day count |
| `ProficiencyBadge` | Badge showing Completed/Proficient/Expert |
| `ProgressRing` | Circular SVG progress indicator |

### Editor

| Component | Description |
|-----------|-------------|
| `BlockEditor` | The [[MDX Editor]] wrapper |
| `BlockPalette` | Sidebar draggable block types |
| `AIPanel` | Prompt input and AI suggestion cards |
| `PreviewToggle` | Switch between edit and student preview |

### Feedback

| Component | Description |
|-----------|-------------|
| `EmptyState` | Illustration + text for empty lists |
| `ErrorBoundary` | Fallback UI for crashes |
| `LoadingSpinner` | Branded loader |

## Component Status

| Component | Status | Notes |
|-----------|--------|-------|
| `AppShell` | Planned | — |
| `CourseCard` | Planned | — |
| `WavePlayer` | Planned | — |
| `BlockRenderer` | In Design | Complex dynamic rendering |
| `MCQBlock` | Planned | — |
| `DragDropBlock` | In Design | Touch interaction critical |
| `XPToast` | Planned | Animation spec needed |
| `BlockEditor` | In Research | Depends on [[MDX Editor]] choice |

## Related Notes

- [[Design System]] — Colors, typography, and spacing tokens.
- [[Frontend Architecture]] — How components are organized in code.
- [[MDX Editor]] — Editor-specific component design.
- [[Wave Interaction]] — Components used in the Wave player.
- [[Student Dashboard]] — Components used in the student UI.
- [[Educator Dashboard]] — Components used in the educator UI.
