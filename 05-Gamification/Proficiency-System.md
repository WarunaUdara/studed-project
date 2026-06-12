---
title: "Proficiency System"
description: "How lesson and course proficiency is calculated and displayed to students."
tags:
  - gamification
  - proficiency
  - mastery
  - completion
  - studed
aliases:
  - "Mastery System"
  - "Skill Proficiency"
  - "Lesson Mastery"
date: 2026-06-03
---

# Proficiency System

> [!info] Purpose
> The **Proficiency System** tracks whether a student has truly mastered a Lesson or Course. It goes beyond simple "completion" by requiring a minimum average score across all Waves.

## Proficiency Levels

| Level | Icon | Criteria |
|-------|------|----------|
| **Not Started** | ⭕ | 0 Waves attempted |
| **In Progress** | 🟡 | 1+ Waves attempted, not all completed |
| **Completed** | ✅ | All Waves completed (any score) |
| **Proficient** | 🌟 | All Waves completed AND average score >= 80% |
| **Expert** | 👑 | All Waves completed AND average score = 100% |

> [!tip] Motivational Design
> "Completed" means you finished. "Proficient" means you *understood*.
> This distinction encourages students to reattempt for better scores, not just rush through.

## Lesson Proficiency Calculation

```
waves = all Waves in Lesson
completed_waves = waves where PROGRESS.status == 'completed'
avg_score = average(PROGRESS.highest_score for all waves)

if completed_waves.count == waves.count:
    if avg_score == 100:
        level = 'Expert'
    elif avg_score >= 80:
        level = 'Proficient'
    else:
        level = 'Completed'
else:
    level = 'In Progress' (or 'Not Started')
```

## Course Proficiency

Derived from Lesson proficiencies:

- **Course Completion:** All Lessons are at least "Completed".
- **Course Proficiency:** All Lessons are at least "Proficient".
- **Course Expert:** All Lessons are "Expert".

## Student-Facing UI

### Lesson Card

- Badge on the Lesson card showing proficiency level.
- Color coding: Gray (Not Started) → Yellow (In Progress) → Green (Completed) → Gold (Proficient) → Purple (Expert).

### Proficiency Dashboard

- A dedicated page or section showing:
  - Total Lessons by proficiency level (bar chart).
  - Courses close to proficiency ("Just 2 more waves to master Algebra!").
  - Suggested reattempts: "Reattempt Wave 3 to boost your average to 80%."

### Certificates (Future)

- Auto-generated PDF certificate when a Course reaches "Proficient" or "Expert".
- Includes student name, course title, date, and a unique verification code.

## XP Bonuses

| Milestone | Bonus XP |
|-----------|----------|
| First Lesson Completed | +20 XP |
| First Lesson Proficient | +100 XP |
| First Course Completed | +200 XP |
| First Course Proficient | +500 XP |
| First Course Expert | +1,000 XP |

## Educator Insights

- Class-wide proficiency distribution.
- Waves that lower average scores (need improvement).
- Students stuck at "Completed" but not "Proficient".

## Related Notes

- [[XP-System]] — How proficiency milestones award bonus XP.
- [[Progress Tracking]] — Where completion data lives.
- [[Wave Interaction]] — Where students earn scores.
- [[Reattempt Mechanics]] — How students improve scores to reach proficiency.
- [[Gamification]] — Overview of all motivational features.
- [[Student Dashboard]] — Where proficiency badges appear.
