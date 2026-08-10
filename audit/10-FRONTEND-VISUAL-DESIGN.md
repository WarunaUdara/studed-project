# 10 — Frontend Visual Design & Theming

**Audit date:** 2026-08-10 · **Base commit:** `35d4424` · **Method:** headless-Chromium
screenshot capture at 2x DPR across `1440x900` / `390x844`, light and dark, plus
computed-style extraction from the live DOM.

**13 findings · 0 Critical · 3 High · 7 Medium · 3 Low** — 3 fixed in this pass.

---

## How this audit was produced

Static reading of Tailwind classes cannot tell you whether a page *looks* right.
This pass therefore drove a real browser and inspected rendered pixels and
computed styles. Two reusable tools were added:

| Tool | Purpose |
| :--- | :--- |
| `frontend/e2e/tools/shoot.ts` | Full-page captures of a route list across viewports and themes into `frontend/.audit-shots/` (gitignored) |
| `frontend/e2e/tools/section.ts` | Viewport-sized slices of one route, so a single section can be read at legible resolution |
| `frontend/e2e/tools/probe.ts` | Dumps resolved `--*` design tokens, font stacks, and computed type ramp from the live DOM |

### Two capture traps worth recording

Both produced convincing false positives before being ruled out. Any agent
continuing this work will hit them.

1. **`whileInView` never fires under `fullPage: true`.** The landing page reveals
   12 sections via framer-motion `whileInView`, which is driven by an
   IntersectionObserver against the *real* viewport. Playwright's full-page
   screenshot does not scroll, so every revealed section captured at
   `opacity: 0` — the page appeared ~60% blank. It is not. `section.ts` scrolls
   in viewport-sized steps first; all reveals use `viewport={{ once: true }}`,
   so they stay visible afterwards.
2. **Scrolling to the bottom contaminates later shots.** Reaching the page end
   awards `ScrollXpMeter`'s Explorer badge, which fires `Confetti` — a
   `fixed inset-0 z-50` overlay lasting 2.4s. Shots taken back at the top within
   that window show confetti strewn across the hero headline, which looks like a
   z-index bug and is not. `SKIP_REVEAL=1` bypasses the pre-scroll.

---

## Verdict

The design system is in **materially better shape than `07-EXPERIENCE-UX-DX.md`
implies** — that document predates roughly 98 commits of remediation. The OKLCH
token architecture is real and genuinely well-built: 1,260 semantic-token
utility usages against 185 raw-palette ones, full light/dark parity across ~60
tokens, and `useReducedMotion` correctly threaded through 8 of 9 animated
components.

What is missing is not architecture. It is **first-paint polish and token
discipline at the edges** — the things a visitor sees in the first 400ms and the
places where the token system was bypassed.

---

## 🟠 VIS-01 — No pre-paint theme script: dark-mode users get a white flash

**Severity: High · `frontend/index.html`, `frontend/src/App.tsx:21`**

`index.html` ships no inline theme script. The `dark` class is applied by
`useUiPrefs().hydrate()`, called from `App.tsx:21` — a React effect that runs
*after* the first paint. Every dark-theme visitor therefore sees a full-viewport
flash of `--background: oklch(0.988 0.003 145)` (near-white) before the app
repaints dark.

This is the single most visible defect on the site and it affects every route.

**Fix.** Add a blocking inline script to `<head>`, before the stylesheet, that
reads the same `studed-ui-prefs` key and sets the class pre-paint:

```html
<script>
  try {
    var p = JSON.parse(localStorage.getItem("studed-ui-prefs") || "{}");
    var t = p.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    if (t === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
</script>
```

Keep `hydrate()` as-is; it becomes idempotent reconciliation rather than the
first writer.

---

## 🟠 VIS-02 — The theme ignores the OS colour-scheme preference

**Severity: High · `frontend/src/stores/uiPrefs.ts:102`**

```ts
const theme = p.theme ?? "light";
```

A first-time visitor whose system is set to dark gets a light interface, with no
`matchMedia("(prefers-color-scheme: dark)")` consulted anywhere in the codebase.
The dark theme is fully built and tokenised — roughly 60 override tokens — and
most users will never see it.

**Fix.** Default to the OS preference when nothing is persisted (the snippet in
VIS-01 already does this). Only a deliberate toggle should pin the choice.
Optionally add a third `"system"` mode that tracks changes live.

---

## 🟠 VIS-03 — The favicon is a 404 and there are no social/meta tags

**Severity: High · `frontend/index.html`**

`index.html` references `/vite.svg`. That file does not exist in
`frontend/public/` — the directory contains only `_headers`, `_redirects`, and
`covers/`. Every browser tab shows a broken/default favicon.

Also absent: `<meta name="description">`, Open Graph tags, `<meta name="theme-color">`,
and any apple-touch-icon. The `<title>` is the bare string `StudEd`.

For a product whose landing page is its primary sales surface, a link shared to
WhatsApp or Facebook — the dominant sharing channels in the target market —
renders with no image, no description, and a broken icon.

**Fix.** Add a real favicon set derived from the `StudEd` serif wordmark, plus
`description`, OG/Twitter tags with a 1200x630 card, and
`<meta name="theme-color">` with light/dark `media` variants matching
`--background`.

---

## 🟡 VIS-04 — Emoji used as product iconography

**Severity: Medium · `frontend/src/lib/gamification.ts:82-112,273-279`, `LeaderboardRow.tsx:65`, `GamifiedPreview.tsx:96`**

Rendered UI state is carried by emoji glyphs:

| Location | Glyphs |
| :--- | :--- |
| `gamification.ts` proficiency `glyph` | 🟡 ✅ 🌟 👑 |
| `gamification.ts` `rankGlyph()` | 🥇 🥈 🥉 ⭐ 👑 💎 |
| `LeaderboardRow.tsx:65` | 👤 |
| `GamifiedPreview.tsx:96` | 🔥 |

These render from the OS font, not the design system: different shapes, weights,
and colours on Windows, Android, iOS, and Linux, and none of them respect
`--gold` / `--rank-1`. On a leaderboard the medal emoji sits directly beside
token-coloured rank backgrounds, so the mismatch is visible side by side.

This also conflicts with `AGENTS.md` rule 5 ("No emojis in code").

**Note:** the proficiency and rank glyphs are *spec-defined* in
`05-Gamification/`, so this is a product decision, not a pure cleanup. Raise it
before changing.

**Fix.** Replace with `lucide-react` icons tinted by the existing rank tokens
(`Medal`, `Crown`, `Gem`, `Star`, `User`), and update the gamification spec to
match. Keeps one visual language and makes rank colour themeable.

---

## 🟡 VIS-05 — 185 raw-palette classes bypass the OKLCH token system

**Severity: Medium**

Against 1,260 semantic-token usages there are 185 hardcoded Tailwind palette
classes (`bg-emerald-500`, `text-slate-400`, …). They do not respond to the
theme and will not follow a future brand change. Concentration:

| File | Count |
| :--- | ---: |
| `components/learn/visualizations/CoordinatePlaneBlock.tsx` | 47 |
| `routes/achievements.tsx` | 22 |
| `components/learn/visualizations/TsCircuitBlock.tsx` | 21 |
| `components/learn/visualizations/MatterPhysicsBlock.tsx` | 17 |
| `components/learn/visualizations/Mol3DBlock.tsx` | 15 |
| `routes/courses.index.tsx` | 13 |
| `routes/leaderboard.tsx` | 8 |
| `routes/educator/_layout/index.tsx` | 8 |
| remainder (11 files) | 33 |

Roughly 55% sits in the five `learn/visualizations/` blocks. Those render
scientific diagrams where a *fixed, non-themeable* palette is often the correct
choice — axis colours should not shift with the UI theme. Triage before
converting:

- **Convert** — `achievements.tsx`, `courses.index.tsx`, `leaderboard.tsx`,
  `educator/_layout/index.tsx`, and the remainder. These are chrome.
- **Keep, but move** — the visualization blocks. Promote their palettes to
  named constants in one module (e.g. `lib/vizPalette.ts`) with a comment
  stating they are intentionally theme-independent.

Verify with:
```bash
grep -rnoE '\b(bg|text|border|from|to|via|ring|fill|stroke)-(emerald|green|blue|slate|zinc|gray|neutral|stone|amber|yellow|orange|red|rose|pink|purple|violet|indigo|sky|cyan|teal|lime|fuchsia)-[0-9]{2,3}\b' --include='*.tsx' frontend/src | wc -l
```

---

## 🟡 VIS-06 — Webfonts render-block via CSS `@import` from a third party

**Severity: Medium · `frontend/src/styles/index.css:1`**

Line 1 is a single `@import url("https://fonts.googleapis.com/css2?...")` pulling
five families: IBM Plex Serif, Noto Serif Sinhala, Inter, Noto Sans Sinhala, and
JetBrains Mono. Every family is referenced by a token, so nothing is wasted at
the family level.

Three problems remain:

1. **CSS `@import` is render-blocking and serialised** — the browser must fetch
   and parse `index.css` before it even discovers the font request. No
   `preconnect` to `fonts.gstatic.com` exists, adding a full TLS handshake to
   the critical path.
2. **IBM Plex Serif is requested across 14 axes** — weights 100-700 in both
   roman and italic. The rendered page uses roman 400 for the wordmark and
   italic 400 for the hero accent. The other twelve faces are downloaded and
   never drawn.
3. **Third-party dependency on the critical render path** for a market with
   constrained connectivity, plus a GDPR/data-residency consideration.

**Fix.** Self-host subset `woff2` files under `public/fonts/` for only the faces
actually used, declare `@font-face` with `font-display: swap`, and drop the
remote import. Add `<link rel="preload">` for the two above-the-fold faces
(IBM Plex Serif 400 roman/italic). If the remote import is kept short-term, at
minimum trim the weight axes and add
`<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`.

---

## 🟡 VIS-07 — Landing sections have almost no tonal separation

**Severity: Medium · `frontend/src/routes/index.tsx`**

The page runs ten full-width sections. Backgrounds alternate between `--background`
(`oklch(0.988 0.003 145)`) and near-identical washes; measured against each
other the steps are ~1-2% lightness. At full-page zoom the composition reads as
a single undifferentiated near-white field, and section boundaries are carried
almost entirely by heading text and hairline borders.

Only two elements break the wash: the `PlayableWaveSection` tint and the final
CTA's green→purple gradient. The CTA gradient is also the *only* appearance of
`--purple` at that saturation anywhere on the page, so it reads as unrelated to
the rest of the design rather than as a climax.

**Fix.** Establish a deliberate three-tier surface rhythm
(`--background` → `--secondary` → a tinted brand wash) and alternate on a fixed
cadence, so scrolling has a felt structure. Then either introduce `--purple`
earlier as a secondary accent, or resolve the final CTA to the green family.

---

## 🟡 VIS-08 — Card treatments are inconsistent across sections

**Severity: Medium**

At least four distinct card styles appear on one page: hairline-bordered white
(How it works), shadowed white (Gamification), gradient-header (Featured
courses), and tinted-gradient (Audience segments). Radii, border weights, and
shadow depths differ between them.

`--radius` is defined once (`1.5rem`) with `sm/md/lg/xl` steps, but the computed
styles show cards resolving to `24px`, `16px`, and fully-rounded
(`3.35544e+07px`, i.e. `rounded-full`) with no evident rule.

**Fix.** Define two or three named card variants in `components/ui/Card.tsx`
(`flat`, `raised`, `feature`) via `class-variance-authority` — already a
dependency — and convert the landing sections to them. Elevation should encode
hierarchy, not vary per section.

---

## 🟡 VIS-09 — Protected surfaces have never been visually audited

**Severity: Medium · coverage gap, not a defect**

Everything above covers `/`, `/login`, `/register`, and the 404. The
authenticated surface — `/dashboard`, `/courses`, `/courses/$courseId`,
`/waves/$waveId`, `/leaderboard`, `/achievements`, `/settings`,
`/subscription`, and the entire `/educator` portal — is **~70% of the product's
screens and has not been inspected at all**, because `ProtectedRoute` redirects
to `/login` without a live backend, and Docker was unavailable during this pass.

This is the largest remaining gap in the frontend audit and the highest-value
next task.

**Fix.** Add `frontend/e2e/tools/mockAuth.ts` that intercepts `**/graphql` via
`page.route()` and replies per `operationName` from fixtures, seeding
`studed_has_session` and the `me` query. That unlocks screenshot coverage of
every protected route with no backend, and is reusable for Playwright specs.
Alternatively run `make dev-up` and drive the real seeded demo accounts.

---

## 🔵 VIS-10 — Hero social proof reads as placeholder

**Severity: Low · `frontend/src/routes/index.tsx:188-210`**

The trust row renders four circles containing the literal letters **A, B, C, D**.
Because they overlap (`-space-x-2`), each letter is partly occluded by the next,
so the cluster reads as an unfinished stub rather than social proof — directly
beside the copy "Trusted by students across Sri Lankan schools".

Contrast was also failing and **has been fixed in this pass** (see Fixed below).

**Fix.** Use real (or plausibly illustrated) student avatars, or drop the
cluster and keep the star rating and caption.

---

## 🔵 VIS-11 — Mobile hero overflows the fold

**Severity: Low**

At `390x844` the hero is `min-h-screen` with `pt-24`, so the `WaveMapHero` card —
the page's main visual proof — begins around y≈1150 and is cut off by the fold.
The first screen is all text. Consider reducing top padding at the `sm` breakpoint
or moving the card above the trust row on mobile.

---

## 🔵 VIS-12 — Landing page is a single 1,000-line route module

**Severity: Low · `frontend/src/routes/index.tsx`**

Ten section components live in one file. It is coherently organised and
banner-commented, so this is not urgent, but it is the file most likely to see
concurrent edits from multiple agents. Splitting sections into
`components/public/sections/` would reduce merge conflicts.

---

## ✅ Fixed in this pass

| ID | Finding | Change |
| :--- | :--- | :--- |
| VIS-13a | `StreakFlame` rendered a `Flame` icon *and* appended a 🔥 emoji for streaks ≥ 7 days. At mobile the duplicated glyph pushed the pill to two lines, breaking the rounded-pill shape and forcing "Lesson 4 · Circle Theorems" to wrap. | Removed the emoji from the label; added `whitespace-nowrap`. Both the chip and the lesson title now render on one line. |
| VIS-13b | `StreakFlame`'s infinite pulse was **not** gated on reduced motion. The component comment asserted "the CSS keyframe gate handles it globally" — untrue: the global `@media (prefers-reduced-motion)` block only neutralises CSS animations, and this pulse is a JS-driven framer-motion `animate`. | Gated on `useReducedMotion()`; corrected the misleading comment. |
| VIS-13c | Hero avatar cluster used `from-primary/50 to-purple/50` — a 50%-opacity gradient over a near-white background — with `text-white` at 10px bold. Well under WCAG AA 4.5:1 for small text. | Changed to full-opacity `from-primary to-purple`. |

All three verified by re-capture at `390x844`; `bun run typecheck` clean,
37/37 unit tests pass, `biome check` clean on touched files.

---

## What is genuinely good

- **The OKLCH token architecture.** ~60 tokens with complete light/dark parity,
  correctly registered through Tailwind v4 `@theme inline` so dark overrides
  resolve at runtime. This is done properly and is rarer than it should be.
- **Reduced-motion discipline.** `useReducedMotion` is threaded through
  `CourseJourneyMap`, `GamifiedPreview`, `PlayableWave`, `WaveMapHero`,
  `LiveLeaderboard`, `ScrollXpMeter`, `CountUp`, and the landing route itself.
  `StreakFlame` was the sole gap and is now closed.
- **`viewport={{ once: true }}` on all 12 scroll reveals** — content never
  re-hides on scroll-up, which is the common mistake with this pattern.
- **The `ScrollXpMeter` concept.** Making the landing page itself a wave that
  pays Explorer XP demonstrates the product's core loop instead of describing
  it. Monotonic, `aria-live="polite"`, reduced-motion aware.
- **Typography.** A serif display face against Inter for UI is a considered
  pairing, and the hero's italic-serif accent on the second line is well judged.
