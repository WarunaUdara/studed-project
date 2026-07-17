---
title: "Problem Solving Experience"
description: "The interactive step-by-step problem canvas — StudEd's Brilliant.org moment."
tags:
  - ui-ux
  - screens
  - problem-solving
  - interactive
  - studed
aliases:
  - "Interactive Problem Solving"
  - "Problem Canvas"
date: 2026-07-17
---

# Problem Solving Experience

> [!info] Goal
> Make solving a hard problem feel like a guided conversation, not an exam. This is the signature Brilliant-inspired interaction: stepwise reasoning with instant, kind feedback.

## Layout

### Canvas composition
- Full parchment canvas. Problem number overline, prompt in serif italic display-md — e.g. *"A ball is thrown upward at 20 m/s. When does it return to your hand?"*
- **Step rail** (left, desktop only): vertical list of reasoning steps, each a checkpoint dot. Current step has a soft blue ring; completed steps show green ticks; future steps are muted.
- **Workspace** (center): the current step rendered as a focused card (24px radius, 32px padding). One decision per card — never a wall of inputs.
- **Simulation pane** (right or below, when relevant): Matter.js / tscircuit / 3Dmol interactive in a 16px-radius bordered frame. Manipulating the simulation informs the answer.

### Interaction loop (per step)
1. Step card presents a micro-question (MCQ, numeric input, drag, or manipulate-then-answer).
2. Student answers → 150ms settle animation → feedback inline:
   - **Correct**: green wash, one-line affirmation, step rail ticks, next card slides in (spring-gentle).
   - **Incorrect**: no red alarm — the card's border warms, a targeted nudge appears ("Check the sign of acceleration"), and the student retries in place.
3. `HintLadder` (violet) sits at the card's footer: each rung reveals progressively, from "Read the prompt again for…" down to a worked first line.

### Completion
- Final step resolves into a compact summary: the full worked solution typeset beautifully (KaTeX), XP earned, and a **One more like this** ghost button + **Continue** primary.
- `playSuccessSound()` on solve; error sound reserved for submission failures only, never wrong answers.

## States

| State | Design |
|-------|--------|
| Stuck (3 failed attempts) | Violet AI chip offers: "Walk through it with the AI tutor" → opens [[AI-Tutor-Interface]] with full problem context |
| Partial credit | Steps carry individual XP; rail shows per-step earnings |
| Timed mode (exam prep) | Slim amber timer pill appears top-right; everything else identical |

## Motion

- Card transitions: horizontal slide + fade, out 150ms / in 250ms.
- Step rail tick: ring draw 300ms.
- No auto-advance — pacing is always the student's.

## Mobile

- Step rail collapses to a "Step 2 of 5" pill. Simulation pane stacks below the card with a 16px gap. Hint ladder becomes a bottom sheet.

## Accessibility

- Every manipulation widget has a numeric-input alternative. Step announcements via `aria-live="polite"`. Focus moves to the new card on advance.
