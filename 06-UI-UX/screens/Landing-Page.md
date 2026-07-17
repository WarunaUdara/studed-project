---
title: "Landing Page"
description: "Marketing landing page — first impression of the Intelligent Learning Canvas."
tags:
  - ui-ux
  - screens
  - landing
  - marketing
  - studed
aliases:
  - "Homepage"
date: 2026-07-17
---

# Landing Page

> [!info] Goal
> Convert visitors into trial subscribers by communicating *intelligent, premium learning* in under five seconds — for Sri Lankan students, parents, and global learners alike.

## Structure (top → bottom)

### 1. Navigation
- Glass `TopNav`, transparent at page top, blurs on scroll.
- Left: wordmark "StudEd" in Instrument Serif. Center: Courses, Method, Pricing, For Schools. Right: Sign in (ghost) + **Start Learning** (primary pill).
- Mobile: wordmark + hamburger opening a full-screen parchment menu with serif links.

### 2. Hero
- Parchment canvas with the **Dawn** gradient (blue→transparent from top center) drifting ±4% over 12s.
- Overline: `FOR GRADE 1 — A/L AND BEYOND` (label style, muted).
- Headline (display-xl, serif): "Where difficult ideas become clear."
- Sub-line (body-lg, muted): "Interactive lessons, an AI tutor that understands your syllabus, and progress you can feel — built for Sri Lankan schools and the world's curious minds."
- CTA row: **Start free trial** (primary) + "Watch a lesson" (secondary, play icon).
- Below: a live **mini problem card** (real interactive MCQ, e.g. "If f(x) = 2x + 3, what is f(5)?") — the visitor solves a real question before signing up. This is the Brilliant moment.

### 3. Trust strip
- Single muted row: school logos, "10,000+ learners", exam-board alignment badges (O/L, A/L syllabi). No carousel.

### 4. Method section — "Learn by doing"
- Three editorial columns on white cards (24px radius), scroll-revealed with 40ms stagger:
  1. **Understand** — short, beautiful explanations. (TextBlock visual)
  2. **Practice** — interactive problems, instant feedback. (ProblemCanvas visual)
  3. **Master** — XP, proficiency, and an AI tutor beside you. (ProficiencyBadge visual)

### 5. AI Tutor feature
- Split section: left copy ("A tutor that knows your syllabus"), right a static-rendered `AITutorPanel` mock with violet Intelligence gradient.
- Violet is introduced here for the first time — it never appears earlier on the page.

### 6. Course preview
- Horizontal snap-scroll row of `CourseCard`s (Combined Maths, Physics, O/L Science, Grade 5 Scholarship…). Scrolls natively, no auto-play.

### 7. Gamification glimpse
- Amber-accented strip: streak flame, leaderboard row, achievement medal — proof of the motivation loop, presented calmly as "Progress you can feel."

### 8. Testimonial
- Single large serif pull-quote from a student/parent, centered, generous whitespace. One only — editorial, not a wall.

### 9. Pricing teaser + Final CTA
- Three plan cards (links to [[Subscription-Page]]), middle highlighted with blue border.
- Final section: display-lg "Begin learning today." + primary CTA over a soft blue atmospheric gradient.

### 10. Footer
- Muted, four columns: Product, Schools, Company, Legal. Sinhala/Tamil language switcher.

## Motion

- Hero headline: word-by-word rise-in, 450ms stagger.
- Sections: `whileInView` reveals, once.
- Mini problem card: real success state with green glow when answered correctly.

## Mobile

- Everything single column; hero headline drops to display-md; mini problem card becomes full-width; course row becomes vertical stack of 3 with "View all courses" link.

## Accessibility

- Mini problem fully keyboard-operable; headline is the single `h1`; gradient never sits behind body copy.
