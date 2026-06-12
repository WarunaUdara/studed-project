---
title: "Student Dashboard"
description: "The main interface for students to browse courses, track progress, and view achievements."
tags:
  - student
  - dashboard
  - portal
  - progress
  - studed
aliases:
  - "Learner Dashboard"
  - "Student Home"
  - "My Learning"
date: 2026-06-03
---

# Student Dashboard

> [!info] Purpose
> The **Student Dashboard** is the primary interface where learners discover courses, track their progress through Lessons and Waves, view their [[XP-System|XP]] and [[Leaderboards|rank]], and manage their learning journey.

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│  Header: Logo | Search | Notifications | Profile | XP    │
├─────────────────────────────────────────────────────────┤
│  Sidebar (Left)         │  Main Content Area             │
│                         │                                │
│  🏠 Dashboard           │  ┌──────────────────────────┐  │
│  📚 My Courses          │  │  Continue Learning       │  │
│  🏆 Leaderboard         │  │  [Course Card]           │  │
│  🎯 Achievements        │  │  Progress: ████████░░ 80%│  │
│  📊 Progress            │  └──────────────────────────┘  │
│  ⚙️ Settings            │                                │
│                         │  📚 Enrolled Courses          │
│                         │  ┌────┐ ┌────┐ ┌────┐        │
│                         │  │Math│ │Sci │ │Eng │        │
│                         │  └────┘ └────┘ └────┘        │
│                         │                                │
│                         │  🏆 Leaderboard Snapshot      │
│                         │  You are #42 this week!       │
└─────────────────────────────────────────────────────────┘
```

## Core Sections

### 1. Continue Learning

- Highlights the last active Course / Lesson / Wave.
- One-click "Resume" button.
- Shows a progress ring or bar for the current Lesson.

### 2. My Courses

- Grid of all enrolled / unlocked Courses.
- Each card shows:
  - Course title and subject icon.
  - Overall completion percentage.
  - Number of Lessons completed / total.
  - Next Lesson to start.
- Filter by: Grade, Subject, Recently Active.

### 3. Course Detail View

- Expanded view when a Course is selected.
- **Lesson List:** Accordion or sidebar list.
- **Lesson Card:**
  - Title and description.
  - Wave count and estimated duration.
  - Proficiency badge (if all waves completed).
  - Locked / Available / Completed status.

### 4. Wave Player Launcher

- Inside a Lesson, Waves are listed as cards or a path.
- Each Wave card shows:
  - Title and sequence number.
  - Status: Locked 🔒 / Available ⭕ / Started 🟡 / Completed ✅.
  - Best score (if attempted).
  - XP earned.
- Clicking a Wave opens the [[Wave Interaction|Wave Player]].

### 5. Leaderboard Snapshot

- Mini leaderboard showing the student's current rank.
- Toggle: Global / Course-specific / Grade-specific.
- "View Full Leaderboard" links to the [[Leaderboards]] page.

### 6. Achievements & Stats

- Total XP earned.
- Current streak (days in a row with activity).
- Badges earned (e.g., "First Wave Complete", "Perfect Score", "Reattempt Champion").
- Graph of XP earned over the last 7/30 days.

### 7. Notifications

- New course unlocked.
- Leaderboard rank change.
- Subscription renewal reminder.
- Educator announcement.

## Subscription Status

> [!warning] Paywall
> If the student's subscription is inactive:
> - Courses show a lock icon with "Subscribe to unlock".
> - A prominent CTA banner appears at the top.
> - Past progress is saved but inaccessible until renewal.

## Responsive Design

- **Desktop:** Full sidebar + main content layout.
- **Tablet:** Collapsible sidebar, larger touch targets.
- **Mobile:** Bottom tab bar (Home, Courses, Leaderboard, Profile).

## Gamification Elements

- **Progress Bars:** Visual feedback for every Lesson and Course.
- **XP Popups:** Brief toast notification when XP is earned.
- **Streak Flame:** Icon indicating consecutive days of activity.
- **Unlock Animation:** When a new Wave or Lesson becomes available.

## Related Notes

- [[Educator Dashboard]] — The counterpart educator interface.
- [[Course Enrollment]] — How students gain access to courses.
- [[Wave Interaction]] — Playing a Wave (Learn + Evaluate).
- [[Progress Tracking]] — How progress is calculated and stored.
- [[XP-System]] — How XP is earned and displayed.
- [[Leaderboards]] — Full leaderboard view and rules.
- [[Gamification]] — Overview of all gamification features.
