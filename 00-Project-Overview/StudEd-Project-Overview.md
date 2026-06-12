---
title: "StudEd Project Overview"
description: "High-level overview of the StudEd educational platform."
tags:
  - overview
  - studed
  - project-root
  - active
aliases:
  - "StudEd"
  - "Project Overview"
date: 2026-06-03
status: active
---

# StudEd Project Overview

> [!info] What is StudEd?
> **StudEd** is a premium, subscription-based educational platform strictly targeted at Sri Lankan schools. It caters to students from **Grade 1–11**, **O/L (Ordinary Level)**, and **A/L (Advanced Level)**.

## Mission

To create an interactive, gamified learning environment where students master subjects through structured **Courses**, **Lessons**, and **Waves** (levels), while educators can easily build rich, multimedia content with AI assistance.

## Core Value Proposition

- **Structured Learning:** A strict three-tier hierarchy (Course → Lesson → Wave) ensures progressive skill-building.
- **Interactive Content:** Every "Wave" combines a **Learn** phase (multimedia) with an **Evaluate** phase (quizzes & exercises).
- **AI-Powered Creation:** Educators use an intelligent, drag-and-drop [[MDX Editor]] to build lessons in minutes, with full **Sinhala language support**.
- **Gamified Motivation:** Students earn **XP**, climb **Leaderboards**, and achieve proficiency as they advance.
- **Premium Access:** The platform is monetized through a paid signup/subscription model.

## Target Audience

| Segment | Grades / Levels | Details |
|---------|-----------------|---------|
| Primary | Grade 1–5 | Foundational subjects, interactive learning |
| Junior Secondary | Grade 6–9 | Broad curriculum coverage |
| Senior Secondary | Grade 10–11 (O/L) | Exam preparation focus |
| Advanced Level | A/L | Subject specialization, rigorous evaluation |

> [!tip] See also
> - [[Target Audience]] — Detailed personas and user segments.
> - [[Monetization Strategy]] — Pricing models and subscription tiers.

## Platform Hierarchy at a Glance

```mermaid
graph TD
    A[Course] --> B[Lesson 1]
    A --> C[Lesson 2]
    A --> D[Lesson N]
    B --> E[Wave 1<br/>Learn + Evaluate]
    B --> F[Wave 2<br/>Learn + Evaluate]
    B --> G[Wave N<br/>Learn + Evaluate]
    C --> H[Wave 1]
    C --> I[Wave 2]
```

## Key Modules

1. **[[02-Content-Hierarchy/Course-Lesson-Wave-Hierarchy|Content Hierarchy]]** — How Courses, Lessons, and Waves are structured.
2. **[[03-Educator-Portal/Educator-Dashboard|Educator Portal]]** — Content creation, AI-assisted editing, and Sinhala support.
3. **[[04-Student-Portal/Student-Dashboard|Student Portal]]** — Learning experience, progress tracking, and gamification.
4. **[[05-Gamification/XP-System|Gamification]]** — XP, leaderboards, reattempt mechanics, and proficiency.
5. **[[01-Architecture/System-Architecture|System Architecture]]** — Frontend, backend, and database design.

## Quick Links

- [[Tech Stack]]
- [[Database Schema]]
- [[Design System]]
- [[API Specifications]]
- [[Glossary]]

---

*Last updated: [[2026-06-03]]*
