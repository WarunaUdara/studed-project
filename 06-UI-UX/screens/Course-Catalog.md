---
title: "Course Catalog"
description: "Browsing and discovering courses — editorial, filterable, calm."
tags:
  - ui-ux
  - screens
  - courses
  - catalog
  - studed
aliases:
  - "Course Browsing"
date: 2026-07-17
---

# Course Catalog

> [!info] Goal
> Help a student find the right course in under 30 seconds, while making the catalog feel like a curated library — not an LMS list. Supports [[Course-Enrollment]].

## Layout

### 1. Page header
- Overline `CATALOG`, serif display-lg: "Choose what to master."
- Search field (44px, pill, leading search icon) with keyboard shortcut `/` — results filter live.

### 2. Filter rail
- Horizontal pill chips (scrollable on mobile): **Grade** (1–13 / O/L / A/L / University), **Subject** (Maths, Science, Physics, Chemistry, ICT…), **Language** (Sinhala, Tamil, English), **Level**.
- Active chip: blue fill; inactive: white with border. One accent — filters never use other colors.

### 3. Featured course
- One wide atmospheric card at top (rotates weekly, editorial pick): gradient cover left, description + educator name + **Enroll** right.

### 4. Course grid
- 3-column grid of `CourseCard`s:
  - Cover: subject-coded atmospheric gradient (maths = blue family, science = green, humanities = neutral) with the course title in serif on the cover.
  - Body: lesson count + wave count meta, difficulty label, progress ring if enrolled, price/Included-in-plan chip if not.
  - Hover: lift + "View course" arrow slides in.

### 5. Course detail (modal-first)
- Clicking a card opens a **detail sheet** (right-side glass sheet on desktop, bottom sheet mobile): syllabus accordion (lessons → waves), educator bio, sample wave preview button, **Enroll** / **Start free preview** CTA.
- Full course page exists for deep links but the sheet is the primary path — browsing context is never lost.

## States

| State | Design |
|-------|--------|
| Empty filter result | `EmptyState`: "Nothing here yet — try widening your filters." + reset button |
| Enrolled courses | Filter chip "My courses" pre-available; enrolled cards show progress rings |
| Premium-locked | Amber "Premium" chip on card; enroll CTA routes to [[Subscription-Page]] |

## Motion

- Grid items stagger in 30ms on filter change; cards cross-fade rather than jump.
- Detail sheet slides with spring-gentle.

## Mobile

- Filters collapse into a "Filters" button opening a bottom sheet with grouped options + Apply. Grid → single column with larger covers.
