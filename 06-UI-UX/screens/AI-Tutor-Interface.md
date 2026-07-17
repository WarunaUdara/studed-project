---
title: "AI Tutor Interface"
description: "Conversational AI tutor panel — Knowledge Violet, glass, calm intelligence."
tags:
  - ui-ux
  - screens
  - ai
  - tutor
  - chat
  - studed
aliases:
  - "AI Tutor"
  - "Tutor Chat"
date: 2026-07-17
---

# AI Tutor Interface

> [!info] Goal
> A tutor that feels like a brilliant study companion — Socratic, syllabus-aware, never a generic chatbot. Violet is the AI color and appears **only** in AI contexts, so students instantly recognize "the AI is speaking."

## Entry Points

- **Ask AI** button in the [[Lesson-Player]] top bar / mobile FAB.
- AI nudge card on [[Student-Home]].
- "Walk through it with AI" from the [[Problem-Solving-Experience]] stuck state — opens with the problem already in context.

## Layout

### Desktop — side sheet
- 420px glass sheet docked right, full height, floating elevation. The learning canvas remains visible behind (context is never lost).
- Header: violet Intelligence gradient at 6% opacity, serif title "Tutor", context chip naming the current wave/problem, close ×.

### Mobile — full screen
- Sheet expands to full viewport; swipe-down to dismiss; the same glass treatment over a blurred backdrop.

### Conversation
- Thread: student messages right-aligned in white pills with border; tutor messages left-aligned with a violet-tinted wash and small violet sparkle avatar — `AIMessage`.
- Tutor opens with a question, not a lecture: *"Where do you think we should start?"* — Socratic default per `ai/prompts`.
- Streaming: text appears token-by-token with a violet shimmer caret; `AIThinkingDots` before first token.
- Rich responses: KaTeX inline, mini-diagrams, and embedded one-question checkpoints ("Try this: what is f(2)?") rendered as compact `MCQBlock`s inside the thread.

### Composer
- Pill input, 48px, glass, violet focus ring. Send button is a violet circle with an up-arrow.
- `AISuggestChip` row above input, context-aware: "Explain this step" · "Give me a hint" · "Quiz me" · "In Sinhala".
- Language chip toggles Sinhala/Tamil/English mid-thread; tutor replies in selected language.

## Guardrails & Tone

- The tutor guides, never dumps full solutions for graded Evaluate questions — it responds with the next rung of the hint ladder instead and says so kindly.
- Long answers collapse behind "Show full explanation."
- Every tutor message carries a subtle "AI" marker — transparency by design.

## States

| State | Design |
|-------|--------|
| Offline / model unavailable | Muted banner in header: "Tutor is resting — your questions will send when back online" |
| Rate limited | Suggest chips disabled, calm message, retry timer |
| Empty thread | Serif greeting + 3 suggestion prompts as large tappable cards |

## Motion

- Sheet: spring slide-in from right (desktop) / bottom (mobile).
- Messages: 12px rise + fade, 200ms.
- Reduced motion: no streaming caret shimmer; text appears whole.

## Accessibility

- Thread is a labelled `log` region; new messages announced politely. Composer fully keyboard operable; Esc closes the sheet and returns focus to the invoking button.
