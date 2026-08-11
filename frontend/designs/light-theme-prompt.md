# Task: Add the light theme to the StudEd login page

## Context

The dark theme of this page is already built and signed off. You are adding the
light counterpart — not redesigning, not rebuilding. The dark result must come
out of this work pixel-identical to how it went in.

Read these first:

- `src/routes/login.tsx` — page layout, both panels
- `src/components/auth/LoginBrandPanel.tsx` — left panel
- `src/components/auth/LoginAuthCard.tsx` — auth card
- `src/components/auth/useLoginForm.ts` — shared submit/schema/redirect logic
- `src/styles/index.css` — all design tokens

Target design: `designs/target-login-light.png`. Open it and study it before
writing anything. The dark comp is `designs/target-login.png.jpeg` — compare
the two, because several things change beyond colour (see "What actually
changes" below).

This is a gamified learning platform for Sri Lankan schools. Light theme should
read as "bright sunny sky world" — soft blue-white sky, airy clouds, saturated
green accents, generous rounding, the same friendly mascot. Keep the tone
playful and encouraging. Never let it drift into institutional or corporate.

## Stack facts — read these, they are not what you would guess

- **Vite + React 19 + TanStack Router.** Not Next.js. The route is
  `src/routes/login.tsx`; there is no `app/` directory and no `page.tsx`.
- **Tailwind v4, CSS-first.** There is no `tailwind.config`. All tokens live in
  the `@theme inline` block in `src/styles/index.css`.
- **`next/image` does not exist here.** Use `<img>` with explicit `width`/
  `height` and `fetchPriority="high"` where you need priority loading.
- Dark mode is toggled by a `.dark` class on `<html>`, wired via
  `@custom-variant dark (&:is(.dark *))` in `index.css`. Use the `dark:` variant.

## The one decision to make before you write anything

The existing login page is **hard-coded dark**. It deliberately uses fixed
`text-white/70`, `bg-black/40`, `bg-panel-night` etc. rather than the themeable
`foreground` / `muted-foreground` / `card` tokens, because both panels were
always dark regardless of the user's theme preference.

Light theme breaks that assumption. You have three options:

1. **Theme-aware tokens** — convert the fixed colours into token pairs that flip
   on `.dark`. Cleanest long-term, but touches every line of both components.
2. **`dark:` variants** — keep light as the base and add `dark:` for the current
   values. Smaller diff, but doubles every colour class.
3. **Two component sets** — a light and a dark variant chosen at render.
   Most duplication; least recommended.

**Pick one, state why, and confirm it before implementing.** Whichever you pick,
the dark output must be byte-for-byte unchanged in appearance. Verify that
claim with before/after screenshots, don't assert it.

## Assets

In `public/covers/mascot/`:

- `bg-light.png` — **new.** Pale sky with clouds, drifting leaves, small
  crystals and two distant floating islands. This is the right-panel background,
  the light-theme equivalent of `bg-stars.png`.
- `hero-island.png` — mascot on a floating grass island (left-panel centrepiece)
- `mascot-peek.png` — mascot leaning forward, sits on the card's top edge
- `mascot.png`, `island.png` — mascot and island separately
- `bg-stars.png` — dark starfield, dark theme only

The mascot art is identical across themes — do not tint, recolour or swap it.

`mascot-peek.png` is still untrimmed: the mascot sits in the middle of a
1536×1024 canvas with roughly 14% empty space below it. Build as if it were
tight-cropped; it will be cleaned separately. Do not try to fix the images.

## What actually changes between the two comps

Do not assume light theme is "the same layout with inverted colours". Compare
the comps directly. These differ:

| | Dark | Light |
|---|---|---|
| Feature chips | Deep tinted disc, bright icon | **Solid saturated disc, white icon** |
| Sign-in button label | Dark green text on green | **White text on green** |
| Card treatment | Green glow (`shadow-glow-green`) | **Soft neutral drop shadow, no glow** |
| Card border | Brand green at 30% | Hairline neutral / very light green |
| Card fill | Translucent near-black + blur | Solid white |
| Field fill | White at 5% | Light grey, darker than the card |
| Left panel | Deep forest radial | Pale sky, soft clouds, near-white |
| Daily Quest card | Dark fill, green border | White card, soft shadow |
| Level hexagon | Dark core, green rim | Light core, green rim, green numeral |

Everything else — copy, ordering, spacing, sizing, the peeking mascot, the
circled arrow, the "or" divider — stays as built.

## Constraints

- **Visual only.** Do NOT modify `useLoginForm.ts`, the submit handler, the zod
  schema, the role-based redirect, or any GraphQL call. If a change seems to
  require it, stop and ask.
- **Do not regress dark theme.** Screenshot before and after at 1440 and 375 and
  diff them.
- **Do not touch the navbar `LoginModal`.** It shares `useLoginForm` but has its
  own presentation and must keep it.
- **Reuse existing components.** `Button`, `Input`, `Label`, `Progress` all
  exist. Do not create second versions of any of them.
- **No new dependencies** without asking. Lucide is available.
- **Every colour, radius and shadow comes from a token.** No `bg-[#f8fafc]` in
  JSX. Sizing/positioning arbitrary values are fine.
- Match existing file and naming conventions — look at a neighbouring feature
  folder and follow it.

"Forgot password?" and "Continue with Google" have **no backend** — no OAuth
mutation, no password-reset mutation. They are currently rendered visible but
disabled with a "Coming soon" hint. Keep that behaviour; do not wire them up.

---

## Work in 4 steps. STOP after each and wait for review.

Do not proceed until told to. If you are unsure about something, ask rather
than guessing.

### STEP 1 — Light tokens

Add to the `@theme inline` block in `src/styles/index.css`:

- Light surface tokens for both panels: left panel = pale sky wash (near-white,
  faint blue-green tint, subtle radial lift behind the island); right panel =
  soft blue-white sky
- Card surface: solid white fill, hairline border, soft neutral elevation shadow
  (wide, low opacity, no colour cast) — the light counterpart to
  `shadow-glow-green`
- Field surface: light grey fill that reads as recessed against the white card
- Four **solid** chip fills with white foregrounds: green, purple, amber, blue
- Ink colours: primary heading ink (near-black navy), body ink, muted ink

Reuse `brand-green` and `brand-purple` as-is — the accent green is the same in
both themes.

Follow the existing naming pattern in that file. Show me the config diff only.
Write no components this step.

### STEP 2 — Left panel, light

`LoginBrandPanel.tsx`.

- Background: pale sky wash with the soft radial lift behind the island
- Wordmark: "Stud" in heading ink, "Ed" in brand green, green star badge
- Tagline: "Premium learning for" ink / "Sri Lankan schools" green
- Headline: "Learn." "Play." in heading ink, "Level Up." in brand green
- Sub-copy: body ink with "starts here!" in green
- Feature chips flip to **solid saturated fill + white icon** (see table above)
- Daily Quest card: white fill, soft shadow, hairline border, green progress
  bar at 60%, "3 / 5" label, gift icon
- `hero-island.png` unchanged, still floating with `animate-float`

The island lane is a flex column specifically so it can never overlap the copy
at the `lg` breakpoint. Keep that structure.

### STEP 3 — Auth card, light

`LoginAuthCard.tsx` and the right panel in `login.tsx`.

- Right panel: `bg-light.png` as the background layer, full height, card
  vertically centred. Match how `bg-stars.png` is currently applied.
- Card: solid white, ~24px rounding, hairline border, soft neutral drop shadow
- "Welcome" in heading ink + "back!" in green
- Sub-heading in muted ink, centred
- Level/XP strip: light inset panel, hexagon with light core and green rim and
  green numeral, green bar at 70%
- Fields: light grey fill, leading mail/lock icons in muted ink, dark input
  text, muted placeholder
- Password eye toggle keeps its real button, aria-label and type switching
- Sign-in button: solid brand green, **white** bold label, circled arrow at the
  right edge
- "or" divider, Google button (white fill, light border, dark text), footer link

**The peeking mascot must not be clipped.** The right panel currently has no
`overflow-hidden` for exactly this reason — do not add one back.

### STEP 4 — Polish, contrast, parity

- Below `lg`: left panel hidden, card full-width, comfortable gutters, still
  vertically centred, no horizontal overflow at 375px
- Visible focus rings on every interactive element, green, offset, ≥3:1 against
  the **light** background — the dark theme's ring may not carry over
- `alt=""` on all decorative imagery including `bg-light.png`
- Float animations stay disabled under `prefers-reduced-motion`
- **Verify every muted grey hits 4.5:1 against the light panels.** Light themes
  fail this far more often than dark ones — muted greys on white are the single
  most common failure. Report the measured numbers, and say what you changed.
- `priority` / `fetchPriority="high"` on the hero island
- **Parity check:** re-screenshot dark theme and confirm it is unchanged

---

## Traps that cost time on the dark theme

These are real and already cost hours. Read them.

1. **Never run `bun run build` or `bun run typecheck` while the dev server is
   running.** Both invoke `tsr generate`, which rewrites `routeTree.gen.ts`; the
   dev server sees the write and enters a full-page reload loop at ~9 reloads/
   second, serving a blank page. Use `bunx tsc --noEmit` instead, which skips
   route generation. Equally, never run two dev servers — they bind 5173 on IPv4
   and IPv6 separately with no "port in use" warning and then fight over that
   same generated file forever.

2. **`Button` wraps its children in a content-width `relative` span.** Anything
   you absolutely position inside a Button anchors to the *label*, not the
   button. The sign-in arrow needs `[&>span:first-child]:w-full` on the Button
   to stretch that wrapper first.

3. **Do not parse computed colours to check contrast.** Tailwind v4 emits
   `oklab(0.99 … / 0.7)` for `text-white/70`. Naive regex parsing reads that as
   near-black and reports every element as failing at 1:1. Measure rendered
   pixels instead: screenshot, then screenshot again with the glyphs set to
   `transparent`, and compare the two.

4. **Tailwind v4 emits `-translate-x-1/2` as the standalone `translate`
   property**, which is independent of `transform`. A `transform`-based keyframe
   therefore does *not* clobber centring. This is why the float animations work
   on centred elements — don't "fix" it.

5. **`Progress` hard-codes `bg-primary` on its fill.** Override with
   `[&>div]:bg-brand-green` rather than editing the shared component, which is
   used across gamification.

6. **The Google button overflows at 375px.** Its label plus the "Coming soon"
   suffix exceeds the button's content box; the suffix is abbreviated below `sm`.
   Re-check this after any padding change.

7. `focus-visible` does not fire on programmatic `.focus()`. Test focus rings by
   actually pressing Tab.

## In the comps but never built

Present in both target images, deliberately skipped so far. Do not add them
unless asked:

- Speech bubble ("Ready to learn today?")
- Floating "XP +50" chip and "LEVEL 12" hexagon on the left panel
- "Need help? / Contact support" card beneath the auth card

## When you finish all four

Give a short summary: files touched, decisions made that weren't specified,
measured contrast numbers, confirmation that dark theme is unchanged, and
anything in the target you couldn't reproduce and why.

Do not commit anything without permission. Do not add a Claude co-author trailer
— commits go under the repo owner's account only.
