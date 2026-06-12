---
title: "Design System"
description: "UI/UX standards, color palette, typography, and component guidelines for StudEd."
tags:
  - ui-ux
  - design-system
  - branding
  - components
  - studed
aliases:
  - "Design Standards"
  - "UI Guidelines"
  - "Visual Design"
date: 2026-06-03
---

# Design System

> [!info] Purpose
> The **Design System** ensures a consistent, premium, and accessible user experience across both the **Student Portal** and the **Educator Portal**.

## Design Principles

1. **Clarity First:** Learning is the goal. UI never obstructs content.
2. **Motivational:** Gamification elements (XP, badges, streaks) are visually rewarding.
3. **Accessible:** WCAG 2.1 AA compliance. Sinhala script legibility.
4. **Responsive:** Mobile-first for students, desktop-optimized for educators.
5. **Trustworthy:** Clean, professional aesthetic suitable for schools and parents.

## Color Palette

### Primary Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-500` | `#3B82F6` | Buttons, links, active states |
| `primary-600` | `#2563EB` | Hover states |
| `primary-100` | `#DBEAFE` | Backgrounds, tags |

### Secondary Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `secondary-500` | `#10B981` | Success, completion, positive XP |
| `secondary-600` | `#059669` | Hover |

### Gamification Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `gold` | `#F59E0B` | Expert rank, top leaderboard |
| `purple` | `#8B5CF6` | Achievements, rare badges |
| `red` | `#EF4444` | Errors, failed attempts |
| `orange` | `#F97316` | Warnings, streak alerts |

### Neutral Scale

| Token | Hex | Usage |
|-------|-----|-------|
| `gray-50` | `#F9FAFB` | Page backgrounds |
| `gray-100` | `#F3F4F6` | Card backgrounds |
| `gray-200` | `#E5E7EB` | Borders, dividers |
| `gray-700` | `#374151` | Body text |
| `gray-900` | `#111827` | Headings |

## Typography

### Font Stack

| Role | Font | Fallback |
|------|------|----------|
| **Headings** | Inter | system-ui, sans-serif |
| **Body** | Inter | system-ui, sans-serif |
| **Sinhala** | Noto Sans Sinhala | Iskoola Pota, sans-serif |
| **Monospace** | JetBrains Mono | monospace |

### Type Scale

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `text-4xl` | 36px | 40px | Hero titles |
| `text-2xl` | 24px | 32px | Page titles |
| `text-xl` | 20px | 28px | Section headings |
| `text-lg` | 18px | 28px | Subheadings |
| `text-base` | 16px | 24px | Body text |
| `text-sm` | 14px | 20px | Captions, metadata |
| `text-xs` | 12px | 16px | Badges, timestamps |

## Spacing Scale

Based on 4px increments (Tailwind default):

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight gaps |
| `space-2` | 8px | Icon + text |
| `space-4` | 16px | Card padding |
| `space-6` | 24px | Section gaps |
| `space-8` | 32px | Major sections |
| `space-12` | 48px | Page sections |

## Component Library

### Buttons

| Variant | Style | Usage |
|---------|-------|-------|
| **Primary** | `primary-500` bg, white text | Main CTAs (Start Wave, Enroll) |
| **Secondary** | White bg, `primary-500` border | Alternative actions |
| **Success** | `secondary-500` bg | Complete, submit, pass |
| **Danger** | `red-500` bg | Delete, cancel subscription |
| **Ghost** | Transparent | Low-priority actions |

### Cards

- Background: `gray-100` or white.
- Border radius: `12px` (`rounded-xl`).
- Shadow: `shadow-sm` for resting, `shadow-md` for hover.
- Padding: `space-4` (16px).

### Progress Indicators

- **Linear:** Height 8px, `primary-500` fill.
- **Circular:** Used for course completion rings.
- **Steps:** Wave path visualization (dots or checkpoints).

### Inputs

- Border radius: `8px` (`rounded-lg`).
- Focus ring: `primary-500` with 2px offset.
- Error state: `red-500` border with error message below.

## Iconography

- **Library:** Lucide React (lightweight, consistent).
- **Gamification Icons:** Custom SVGs for badges and ranks.
- **Size Scale:** 16px (inline), 20px (buttons), 24px (navigation), 32px (feature icons).

## Animations

| Animation | Trigger | Duration |
|-----------|---------|----------|
| **Page transition** | Route change | 200ms fade |
| **Card hover** | Mouse enter | 150ms scale + shadow |
| **XP popup** | Score submit | 300ms bounce in |
| **Unlock** | Wave unlock | 400ms slide + glow |
| **Streak flame** | Persistent | Subtle pulse loop |

## Accessibility

- Minimum contrast ratio: 4.5:1 for normal text, 3:1 for large text.
- Focus indicators on all interactive elements.
- `prefers-reduced-motion` support for animations.
- Screen-reader tested for Sinhala content.

## Related Notes

- [[User Journeys]] — How the design applies to key flows.
- [[Component Library]] — Full inventory of React/shadcn components.
- [[Frontend Architecture]] — Tech stack implementing the design system.
- [[Sinhala Language Support]] — Sinhala typography specifics.
