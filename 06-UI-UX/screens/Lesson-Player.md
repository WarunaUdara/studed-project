---
title: "Lesson Player (Wave Experience)"
description: "The immersive Learn + Evaluate player — where StudEd's pedagogy lives."
tags:
  - ui-ux
  - screens
  - lesson
  - wave
  - player
  - studed
aliases:
  - "Wave Player"
  - "Lesson Screen"
date: 2026-07-17
---

# Lesson Player (Wave Experience)

> [!info] Goal
> Total focus. The player renders a [[Wave-Anatomy|Wave]]'s **Learn** and **Evaluate** phases on a distraction-free canvas. See [[Wave-Interaction]] for behavior.

## Layout

### Chrome (minimal, auto-hiding)
- Slim top bar (56px): exit ×, wave title (body-sm, muted), segmented **Learn / Evaluate** progress pill, violet **Ask AI** button, XP earned this session.
- Chrome fades to 20% opacity after 3s of reading; returns on scroll-up, mouse move, or keyboard activity.
- Mobile: top bar collapses to progress bar + ×; AI button becomes a floating violet pill, bottom-right.

### Learn phase
- 720px centered reading column on parchment. No sidebar, no cards-within-cards — content flows editorially.
- Wave intro: serif display-md title + one-line framing question in serif italic.
- Blocks stack with 32px rhythm: `TextBlock`, `CalloutBlock` (concept = blue left border), `ImageBlock`, `GraphicBlock` (interactive Manim/3Dmol/tscircuit/Matter.js in bordered frames), `AudioBlock`.
- Inline comprehension checks: a single MCQ can appear mid-content as an "ungraded checkpoint" — soft blue styling, no score pressure.
- Bottom of Learn: large **Check your understanding** primary pill → transitions to Evaluate.

### Evaluate phase
- Same column. Questions render one at a time (focus mode) with a "3 of 8" indicator, or as a continuous sheet toggleable in settings.
- `MCQBlock`, `FillInBlankBlock`, `DragDropBlock` per [[Evaluate-Component]].
- Submit → inline feedback: correct = green fill + brief explanation reveal; incorrect = gentle red outline + **explanation first**, retry second. Never a harsh "Wrong!" state.
- `HintLadder` available per question (violet).

### Completion
- `EvaluateResult` hero: score in large serif numerals over a Growth gradient, XP count-up, proficiency delta, **Next wave** primary + **Review answers** ghost.
- Confetti: none. Celebration is typographic + a single warm chime (`playSuccessSound()`).

## States

| State | Design |
|-------|--------|
| Resume mid-wave | Returns to exact block; toast "Welcome back — pick up where you left off" |
| Locked wave | Route guard explains unlock condition with path visualization |
| Reattempt | Per [[Reattempt-Mechanics]] — questions reshuffled, best score retained, note shown |
| Offline | Banner; progress queued locally |

## Motion

- Learn→Evaluate: horizontal slide cross-fade, 300ms.
- Explanation reveals: height-expand + fade, 250ms.
- Score hero: numeral count-up 600ms, ring draw 450ms.

## Accessibility

- Full keyboard path (Tab through blocks, Enter to submit, H for hint).
- Reading column contrast > 15:1; Sinhala body at 1.6 line-height.
- Reduced motion: instant phase transitions.
