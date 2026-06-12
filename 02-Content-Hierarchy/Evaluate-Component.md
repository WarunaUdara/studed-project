---
title: "Evaluate Component"
description: "Interactive quiz and exercise blocks used in the Evaluate phase of a Wave."
tags:
  - content
  - evaluate
  - quiz
  - exercises
  - studed
aliases:
  - "Evaluate Blocks"
  - "Evaluate Phase"
  - "Quiz Component"
  - "Assessment Blocks"
date: 2026-06-03
---

# Evaluate Component

> [!info] Purpose
> The **Evaluate** phase of a Wave tests student understanding through interactive exercises. It is the "testing" part that follows the [[Learn Component|Learn]] phase.

## Supported Question Types

### 1. Multiple Choice Question (MCQ)

Standard single-select or multi-select questions.

- **Fields:** Question text, 2–6 options, correct option index(es).
- **Scoring:** Full points for correct, partial for partially correct (if multi-select).
- **UI:** Radio buttons (single) or checkboxes (multi).
- **Feedback:** Immediate "Correct / Incorrect" with optional explanation.

### 2. Fill-in-the-Blank

A sentence with one or more blank spaces to fill.

- **Fields:** Sentence template, array of accepted answers per blank.
- **Validation:** Case-insensitive match, tolerate minor spelling (Levenshtein distance).
- **UI:** Inline input fields within the sentence.
- **Use Case:** Vocabulary, math formulas, short factual answers.

### 3. Drag-and-Drop

Interactive matching or ordering exercise.

- **Variants:**
  - **Match pairs:** Drag items to correct categories or partners.
  - **Order sequence:** Drag steps into the correct order.
  - **Label diagram:** Drag labels onto parts of an image.
- **Fields:** Draggable items, drop zones, correct mapping.
- **UI:** Touch-friendly drag zones, snap-to-grid animation.
- **Scoring:** Points per correct placement.

### 4. True / False (Future)

Simple binary choice.

- **UI:** Toggle or two-button selection.
- **Scoring:** Binary.

### 5. Short Answer (Future)

Free-text response.

- **Requires:** AI-powered grading or manual review.
- **Not in MVP** due to grading complexity.

## Block Schema (JSONB)

```json
[
  {
    "id": "eval-1",
    "type": "mcq",
    "data": {
      "question": "What is the capital of Sri Lanka?",
      "options": ["Colombo", "Kandy", "Galle", "Jaffna"],
      "correct_indices": [0],
      "explanation": "Colombo is the commercial capital.",
      "points": 10
    }
  },
  {
    "id": "eval-2",
    "type": "fill-in-blank",
    "data": {
      "sentence": "The chemical formula for water is ___.",
      "blanks": [
        { "id": 1, "answers": ["H2O", "H₂O"], "points": 10 }
      ],
      "explanation": "Water consists of two hydrogen atoms and one oxygen atom."
    }
  },
  {
    "id": "eval-3",
    "type": "drag-and-drop",
    "data": {
      "instruction": "Match the animals to their habitats.",
      "draggables": ["Lion", "Shark", "Eagle"],
      "drop_zones": [
        { "label": "Land", "correct": ["Lion"] },
        { "label": "Water", "correct": ["Shark"] },
        { "label": "Air", "correct": ["Eagle"] }
      ],
      "points_per_match": 5
    }
  }
]
```

## Scoring & Feedback

| Aspect | Rule |
|--------|------|
| **Immediate Feedback** | Show correct/incorrect after each question or at end of Evaluate phase (configurable per Wave). |
| **Partial Credit** | Multi-select and drag-and-drop may award partial points. |
| **Explanation** | Optional educator-written explanation shown after attempt. |
| **Retry Within Wave** | Student can change answers before final submission. |

## AI-Assisted Question Generation

> [!tip] AI for Evaluate
> The [[AI Integration]] in the [[MDX Editor]] can:
> - Generate MCQs from Learn content.
> - Suggest distractor (wrong) answers for MCQs.
> - Create fill-in-blank sentences from key facts.
> - Design drag-and-drop pairings.
> - Auto-translate questions into Sinhala.

## Reattempt Logic

- After submission, student sees score.
- If score < passing threshold, a "Reattempt" button appears (if under [[Reattempt Mechanics|max reattempts]]).
- Reattempt may shuffle MCQ options or use a question pool (future).

## Related Notes

- [[Wave Anatomy]] — Where Evaluate fits in the Wave lifecycle.
- [[Learn Component]] — The teaching phase counterpart.
- [[MDX Editor]] — The tool educators use to build Evaluate blocks.
- [[AI Integration]] — How AI assists in question generation.
- [[XP-System]] — How Evaluate scores map to XP.
- [[Proficiency System]] — How Evaluate results determine lesson mastery.
- [[Reattempt Mechanics]] — Rules for retrying Waves.
