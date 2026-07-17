---
title: "Design System"
description: "The Intelligent Learning Canvas — visual identity, tokens, typography, motion, and accessibility standards for StudEd."
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
  - "Intelligent Learning Canvas"
date: 2026-06-03
---

# Design System — Intelligent Learning Canvas

> [!info] Purpose
> The **Intelligent Learning Canvas** is StudEd's design identity: an editorial-academic, AI-native visual system that makes students feel *"I am entering a beautiful place where difficult concepts become understandable."*
>
> It serves Grade 1–13, O/L, A/L, university students, and global lifelong learners — and must never look childish, cartoonish, or like a generic LMS.

## Design Principles

1. **Calm Intelligence.** Whitespace is the default state. Color and motion are spent deliberately, never decoratively.
2. **Content is the Hero.** UI chrome recedes. The learning material — text, diagrams, interactive problems — occupies the visual foreground.
3. **Editorial Craft.** Serif display typography, generous line lengths, and print-inspired hierarchy communicate academic trust.
4. **Quietly Alive.** Soft atmospheric gradients, glass surfaces, and physics-smooth motion signal a modern AI product without demanding attention.
5. **Motivation Without Noise.** Progress feedback (XP, streaks, ranks) borrows Duolingo's clarity but renders it in a restrained, premium register.
6. **Accessible by Default.** WCAG 2.1 AA, Sinhala script legibility, mobile-first, and full `prefers-reduced-motion` support.

### Reference Translation

| Reference | What we take | What we avoid |
|-----------|--------------|---------------|
| **Sarvam AI** | Whitespace, atmospheric gradients, premium AI calm | Over-marketing density |
| **Brilliant.org** | Interactive problem-solving focus, intellectual tone | Playful illustration overload |
| **Apple** | Simplicity, hierarchy, polish, restraint | Sterility — we keep warmth |
| **Linear / Anthropic** | Typography-led layouts, muted palettes, precision | Developer-tool coldness |
| **Duolingo** | Motivation loops, progress feedback | Cartoons, mascots, bright saturation |
| **Khan Academy** | Pedagogical clarity, universal accessibility | Dated, utilitarian UI |

> [!warning] Anti-patterns
> - No cartoon mascots, heavy illustration, or "kid-friendly" chrome.
> - No rainbow interfaces — one accent color per surface.
> - No dense LMS tables-of-contents as primary navigation.
> - No hard drop shadows, no pure-black text on pure-white.

## Color System

Color is used **intentionally**: the canvas is neutral, blue marks action, green marks growth, violet marks AI, amber marks achievement. Roughly **80% neutral / 15% blue / 5% accent** on any given screen.

### Brand Palette

All colors are authored in **OKLCH** (per project convention). Hex values are provided only as reference for external tools.

| Role | Name | OKLCH | Hex ref | Usage |
|------|------|-------|---------|-------|
| Canvas | Parchment | `oklch(0.984 0.003 95)` | `#FAFAF7` | Primary background, all surfaces sit on this |
| Brand | Intelligent Blue | `oklch(0.546 0.215 262.9)` | `#2563EB` | Primary actions, links, focus, progress |
| Ink | Ink | `oklch(0.21 0.034 264.7)` | `#111827` | Headings and body text |
| Growth | Growth Green | `oklch(0.696 0.17 162.5)` | `#10B981` | Success states, correct answers, completion |
| AI | Knowledge Violet | `oklch(0.541 0.281 293)` | `#7C3AED` | AI tutor, AI-generated content, smart hints |
| Achievement | Amber | `oklch(0.769 0.188 70.1)` | `#F59E0B` | Achievements, streaks, leaderboard highlights |

### Implementation Tokens

All CSS custom properties are authored in OKLCH in `src/styles/index.css` and mapped through Tailwind v4 `@theme inline`.

```css
:root {
  /* Surfaces */
  --background: oklch(0.984 0.003 95);        /* #FAFAF7 */
  --foreground: oklch(0.21 0.034 264.7);      /* #111827 */
  --card: oklch(1 0 0);                       /* white cards on parchment */
  --muted: oklch(0.962 0.004 95);
  --muted-foreground: oklch(0.47 0.02 264);
  --border: oklch(0.92 0.005 264);
  --input: oklch(0.92 0.005 264);
  --ring: oklch(0.546 0.215 262.9);           /* blue focus ring */

  /* Action */
  --primary: oklch(0.546 0.215 262.9);        /* #2563EB */
  --primary-foreground: oklch(0.985 0.002 95);
  --secondary: oklch(0.962 0.004 95);
  --secondary-foreground: oklch(0.21 0.034 264.7);
  --accent: oklch(0.95 0.014 262);
  --accent-foreground: oklch(0.37 0.13 262.9);
  --destructive: oklch(0.577 0.245 27.3);

  /* Feedback */
  --success: oklch(0.696 0.17 162.5);         /* #10B981 */
  --success-foreground: oklch(0.985 0.002 95);
  --warning: oklch(0.769 0.188 70.1);
  --info: oklch(0.546 0.215 262.9);

  /* Intelligence & Achievement */
  --ai: oklch(0.541 0.281 293);               /* #7C3AED */
  --ai-foreground: oklch(0.985 0.002 95);
  --achievement: oklch(0.769 0.188 70.1);     /* #F59E0B */
  --achievement-foreground: oklch(0.26 0.05 70);

  /* Gamification ranks */
  --rank-1: oklch(0.769 0.188 70.1);          /* amber */
  --rank-2: oklch(0.75 0.01 264);             /* silver */
  --rank-3: oklch(0.62 0.09 55);              /* bronze */
}
```

### Atmospheric Gradients

Gradients are **large, soft, and low-contrast** — atmosphere, not decoration. They live behind hero sections, the AI tutor, and empty states; never behind body text.

| Gradient | Recipe | Usage |
|----------|--------|-------|
| **Dawn** | `radial-gradient(120% 120% at 50% 0%, oklch(0.95 0.02 262 / 0.5), transparent 60%)` | Landing hero, dashboard header |
| **Intelligence** | `oklch(0.546 0.215 262.9)` → `oklch(0.541 0.281 293)` at 4–8% opacity over parchment | AI tutor surface, smart features |
| **Growth** | `oklch(0.696 0.17 162.5)` at 6% opacity fading up | Success states, wave completion |
| **Amber Glow** | `oklch(0.769 0.188 70.1)` at 8% opacity | Achievement unlocks, streak milestones |

### Glass Surfaces

Used sparingly: floating nav, AI tutor panel, command palette.

```css
.glass {
  background: oklch(1 0 0 / 0.72);
  backdrop-filter: blur(16px) saturate(1.4);
  border: 1px solid oklch(1 0 0 / 0.6);
}
```

### Dark Mode

Dark mode inverts to a warm near-black canvas (`oklch(0.17 0.01 264)`), keeps identical hues, and raises chroma slightly on accents for contrast parity. Full token overrides live in `.dark { }` in `src/styles/index.css`.

> [!warning] Color discipline
> - One accent family per screen region. Blue and violet may blend only in AI gradients.
> - Amber is reserved for achievement — never use it for warnings or generic highlights.
> - Never place body text on gradients or glass.

## Typography

Typography carries the brand: **serif for thought, sans for function.**

### Font Stack

| Role | Font | Fallback | Voice |
|------|------|----------|-------|
| **Display / Headings** | Instrument Serif (preferred) or Fraunces | Georgia, serif | Intelligence, curiosity, academic excellence |
| **Body / UI** | Inter (preferred) or Geist | system-ui, sans-serif | Clarity, trust, precision |
| **Sinhala headings** | Noto Serif Sinhala | serif | Matches serif voice |
| **Sinhala body** | Noto Sans Sinhala | Iskoola Pota, sans-serif | Legibility |
| **Code / Math input** | JetBrains Mono | monospace | Technical blocks |

- Instrument Serif is used **regular weight only**, often italic for emphasis lines — it is a display face, never set below 20px.
- Fraunces is the alternate when optical sizing is wanted (marketing pages); set `font-optical-sizing: auto`, weight 400–560.
- Inter: `font-feature-settings: "cv11", "ss01"` for the friendlier single-story `a` in learning content.

### Type Scale

| Token | Size / Line | Weight | Face | Usage |
|-------|-------------|--------|------|-------|
| `display-xl` | 64/68 | 400 | Serif | Landing hero |
| `display-lg` | 48/52 | 400 | Serif | Page heroes, empty states |
| `display-md` | 36/42 | 400 | Serif | Section titles, wave intros |
| `title-lg` | 28/34 | 500 | Sans | Page titles in-app |
| `title-md` | 22/28 | 500 | Sans | Card titles, lesson names |
| `body-lg` | 18/30 | 400 | Sans | Learning content, reading |
| `body-md` | 16/26 | 400 | Sans | Default body |
| `body-sm` | 14/22 | 400 | Sans | Metadata, captions |
| `label` | 13/18 | 500 | Sans | Buttons, chips, overlines |
| `mono` | 14/22 | 400 | Mono | Code, formulas |

### Editorial Rules

- Learning content measure: **60–68 characters** (`max-w-prose`).
- Overline labels: uppercase, `0.12em` tracking, muted color, above serif headings.
- Serif italic is the designated voice for questions and prompts: *"What happens to the area when we double the radius?"*
- Numbers in stats and XP use tabular figures (`font-variant-numeric: tabular-nums`).

## Spacing, Layout & Shape

### Spacing

4px base grid. Generous by default — when in doubt, add space.

| Token | Value | Usage |
|-------|-------|-------|
| `space-2` | 8px | Icon ↔ text gaps |
| `space-4` | 16px | Component internals |
| `space-6` | 24px | Card padding (minimum) |
| `space-8` | 32px | Card padding (comfortable), cluster gaps |
| `space-16` | 64px | Between sections in-app |
| `space-24` | 96px | Landing page section rhythm |
| `space-32` | 128px | Hero vertical padding |

### Layout

- Max content width: `1200px` marketing, `1440px` educator studio, `720px` reading column in the lesson player.
- App shell: slim 240px sidebar (64px collapsed), content on parchment with generous margins.
- Mobile-first: single column, bottom tab bar, 16px gutters.

### Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 8px | Inputs, chips |
| `radius-md` | 12px | Small cards, dropdowns |
| `radius-lg` | 16px | Media blocks |
| `radius-xl` | **24px** | Cards — the signature radius |
| `radius-full` | 9999px | Buttons, pills, avatars |

### Elevation

Minimal shadows; borders do most of the work.

| Level | Spec | Usage |
|-------|------|-------|
| Resting | `1px solid --border` | All cards |
| Raised | `0 1px 2px rgb(17 24 39 / 0.04)` | Hover cards, popovers |
| Floating | `0 8px 24px rgb(17 24 39 / 0.08)` | Dialogs, AI panel, command palette |

## Motion Design

Built with **Framer Motion**. Motion should feel like paper settling — smooth, weighted, quiet. Nothing bounces aggressively; nothing loops except the streak flame.

### Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrances, reveals |
| `ease-soft` | `cubic-bezier(0.4, 0, 0.2, 1)` | State changes |
| `spring-gentle` | `{ stiffness: 120, damping: 20 }` | Cards, toasts |
| `duration-fast` | 150ms | Hovers |
| `duration-base` | 250ms | Most transitions |
| `duration-slow` | 450ms | Page transitions, hero reveals |

### Patterns

| Pattern | Spec |
|---------|------|
| **Page transition** | Fade + 8px rise, 300ms `ease-out-expo`, staggered children 40ms |
| **Scroll reveal** | `whileInView`: opacity 0→1, y 16→0, once, 20% viewport margin |
| **Card hover** | y −2px, border deepens, 150ms — no scale >1.01 |
| **Gradient drift** | Hero gradients translate ±4% over 12s, `ease-in-out` infinite alternate |
| **XP toast** | Spring in from top, count-up numerals, auto-dismiss 2.4s |
| **Wave unlock** | Checkpoint ring draws (SVG stroke-dashoffset), then card fades in |
| **AI thinking** | Three-dot pulse at 40% opacity + violet shimmer on text caret |

All motion respects `prefers-reduced-motion`: reveals become instant, loops stop, sounds silence.

## Iconography & Imagery

- **Icons:** Lucide React, 1.5px stroke, sizes 16/20/24/32.
- **Gamification marks:** Custom geometric SVGs (no cartoon badges) — engraved-medal aesthetic, single accent + ink line work.
- **Imagery:** Abstract gradient fields, generated Manim/3Dmol/tscircuit diagrams, and real photography of Sri Lankan students (warm, documentary style) on marketing pages only. No stock-illustration "flat people" packs.

## Sound

Synthesized Web Audio UI sounds (see `lib/sounds.ts`): soft click on buttons, warm major-third chime on success, low muted tone on error, rising arpeggio on level-up. No audio files; all silenced under `prefers-reduced-motion`.

## Voice & Tone

- **Calm and certain.** "You're one step away." not "Awesome job!!!"
- **Socratic in learning contexts** — prompts ask, they don't command.
- **Plain language, Sinhala-first aware.** Short sentences that translate cleanly.
- No exclamation-mark stacking; one per surface at most, reserved for genuine celebration.

## Accessibility

- Contrast: 4.5:1 body text, 3:1 large text and UI boundaries — Ink on Parchment exceeds 15:1.
- Focus: 2px blue ring, 2px offset, never removed without replacement.
- Touch targets: minimum 44×44px on mobile.
- Sinhala line-height floor: 1.6 for body text (vowel-sign ascenders/descenders).
- All interactive Evaluate blocks operable by keyboard and screen reader; drag-and-drop always has a select-based alternative.

## Related Notes

- [[Component-Library]] — Component specs built on these tokens.
- [[Screen-Designs]] — All 12 screen designs applying this system.
- [[User-Journeys]] — Flows the screens support.
- [[Frontend-Architecture]] — Implementation stack (Tailwind v4 CSS-first, shadcn/ui, Trophy UI).
- [[Sinhala-Language-Support]] — Sinhala typography and localization specifics.
