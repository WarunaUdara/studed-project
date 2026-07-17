---
title: "Educator Studio (Dashboard)"
description: "Educator dashboard and content workspace — a professional authoring environment."
tags:
  - ui-ux
  - screens
  - educator
  - dashboard
  - authoring
  - studed
aliases:
  - "Educator Dashboard Screen"
  - "Educator Workspace"
date: 2026-07-17
---

# Educator Studio (Dashboard)

> [!info] Goal
> Give educators a tool that feels like a professional studio — Linear's precision applied to course authoring. Implements [[Educator-Dashboard]] and supports the [[Wave-Creation-Workflow]].

## Layout

Wider canvas than the student portal (1440px max), denser but never cluttered — educators trade whitespace for capability.

### 1. Sidebar
- Studio nav: Overview, My Courses, Editor, Analytics, Students, Settings. Muted icons + labels; active section gets a blue left rail.

### 2. Overview page
- Greeting row: serif display-md "Studio" + date, with **New course** primary pill right-aligned.
- Stat band (4 `AnalyticsStat` cards): Active students, Waves published, Avg. completion rate, AI generations this week (violet accent on the last).
- **Needs attention** list (top priority, amber left border): "Wave 4 of Differentiation — avg score 41%, 3 flags from students." One-click jump to edit.
- Recent activity feed: enrollments, wave completions, student questions — 8 items, muted timestamps.

### 3. My Courses
- Table-cards hybrid: each course a wide row-card with cover thumb, title, lesson/wave counts, enrolled students, status pill (Draft / Published / Review), and a "..." menu.
- Published rows show a tiny completion sparkline.

### 4. Editor (the [[MDX-Editor]] workspace)
Three-pane studio layout:
- **Left rail** (280px): course structure tree — lessons → waves, drag to reorder, + buttons per level. Selected wave highlighted.
- **Center canvas**: the Puck editor on parchment; each block a white 12px-radius card with drag handle and block-type chip. `PreviewToggle` (Edit / Student preview) in the canvas toolbar.
- **Right rail** (320px): `AIPanel` — violet-accented. Prompt input, quick actions ("Draft a Learn section", "Generate 5 MCQs", "Simplify language", "Translate to Sinhala"), and suggestion cards with **Insert** / **Regenerate** / dismiss.

### 5. Analytics page
- Per-course funnel: enrollment → wave 1 → completion, rendered as a clean horizontal funnel (blue family only).
- Wave difficulty heatlist: waves ranked by average score, worst 5 flagged with the amber "needs attention" treatment linking straight into the editor.
- Per [[User-Journeys]] Journey 4, the loop is: spot weak wave → edit → republish. This page is built around that loop.

## States

| State | Design |
|-------|--------|
| First login (no courses) | Overview becomes a guided start: serif "Create your first course." + template cards (O/L Maths, A/L Physics, blank) |
| AI generating | Suggestion cards show violet shimmer skeletons; insert disabled until valid (per AI validation rules) |
| Unpublished changes | Dot on course row + "Publish" pill appears in editor toolbar |

## Motion

- Pane transitions are instant (tool, not toy); only toasts, AI streaming, and hover states animate.
- Drag reorder uses subtle lift + shadow, spring settle.

## Mobile

The studio is **desktop-first**; on mobile it degrades to a read-only Overview and Analytics with a notice: "Editing opens on larger screens."

## Accessibility

- Full keyboard authoring: block palette, reorder, and AI panel reachable without a mouse.
- Tree and table use proper ARIA roles; AI generation status announced politely.
