# StudEd Taste — Consolidated Design Rules

Load this file for any UI/UX work on StudEd. It is the single merged source of
design taste, folding the best rules from four installed taste skills
(`design-taste-frontend`, `gpt-taste`, `minimalist-ui`, `image-to-code`) into
one stack-accurate, StudEd-native rulebook. The core concepts and comprehensive
details of each skill are preserved here.

## How this file is organized

Each section notes its origin skill. StudEd-specific adaptations are marked
**STUDED**. If a rule conflicts with another, the StudEd adaptation wins.

---

## 0. Read the room before touching code (design-taste-frontend §0)

1. **Page kind** - landing, dashboard, course journey, wave player, profile,
   editor, marketing.
2. **Vibe words** the user used - "calm", "playful", "premium", "minimal".
3. **Audience** - STUDED: **students (Grade 1-11, O/L, A/L) and educators.**
   The audience picks the aesthetic, not your taste. Student surfaces lean
   playful + calm; educator surfaces lean focused + trustworthy.
4. **Existing brand assets** - STUDED: OKLCH token system in
   `frontend/src/styles/index.css`, `Instrument Serif` + `Inter`, mascot
   (`HelmetCompanion`, Blob), gamification (XP, streaks, keys).
5. **Quiet constraints** - accessibility-first, age-appropriate tone, low
   cognitive load. These OVERRIDE aesthetic preference.

**Output a one-line "Design Read" before generating:**
*"Reading this as: student wave player for a Grade 8 science student, playful-calm language, leaning toward StudEd's OKLCH system with gold/emerald gamification accents."*

**STUDED — anti-default discipline:** Do not default to AI-purple gradients,
centered hero over dark mesh, three equal feature cards, generic glassmorphism
everywhere, Inter+slate-900. StudEd's established identity is editorial-academic
(Brilliant.org + Apple) with a gamified layer. Preserve it.

---

## 1. The three dials (design-taste-frontend §1)

Set three dials before layout/motion/density work:

* `DESIGN_VARIANCE` (1 = perfect symmetry, 10 = artsy chaos)
* `MOTION_INTENSITY` (1 = static, 10 = cinematic/physics)
* `VISUAL_DENSITY` (1 = airy, 10 = packed data)

**STUDED baseline:** `6 / 5 / 4`. StudEd is a product app (not a marketing
site): moderate variance, moderate motion, standard app density. Raise motion
for celebration moments (level-up, XP awards, confetti). Lower it for focus
surfaces (wave player during learning).

| Signal | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| Wave player / Learn phase (focus) | 4-5 | 2-3 | 4-5 |
| Dashboard / catalog (discovery) | 6 | 4-5 | 4-5 |
| Celebrations / XP / badges | 7-8 | 7-8 | 3-4 |
| Educator portal (task focus) | 4-5 | 2-3 | 6 |
| Marketing / landing | 7-8 | 5-7 | 3-4 |

---

## 2. Absolute negative constraints (minimalist-ui §2, design-taste-frontend §9)

These are hard bans unless the brief explicitly demands otherwise:

- **NO emojis in code, markup, text content, headings, or alt text.**
  Replace with proper icon-library glyphs. **STUDED:** the codebase currently
  uses emoji in a few places (navbar keys `🗝️`, streak `⚡`, course icons
  `💡⚙️`). Migrate these to `lucide-react` icons; add a lint rule to enforce.
  Playful charm comes from the mascot and gamification components, not emoji.
- **NO `rounded-full` (pill shapes) for large containers, cards, or primary
  buttons.** STUDED: the floating navbar pill is a deliberate brand element —
  keep it. But course cards, modals, and section containers should use the
  token corner-radius scale (`--radius-*`), not pills.
- **NO Inter as the default typeface.** STUDED: Inter is currently the body
  font (`--font-sans`). Migrate body to a distinctive grotesk (Geist / Outfit /
  Satoshi / Cabinet Grotesk) while keeping `Instrument Serif` for display
  headings. Document the migration in DESIGN.md.
- **NO lucide-react as the icon default.** STUDED: lucide-react is used across
  78 files. Keep it during migration (it is the pragmatic choice for a large
  existing codebase), but standardize `strokeWidth` globally (1.5 or 2) and
  never hand-roll SVG icon paths. Prefer `@phosphor-icons/react` /
  `@tabler/icons-react` for new icon-heavy surfaces.
- **NO gradients, neon colors, or 3D glassmorphism beyond subtle navbar
  blurs.** STUDED: the navbar glassmorphism pill is intentional; do not add
  glass to cards, modals, or content.
- **NO generic placeholder names** ("John Doe", "Acme Corp", "Lorem Ipsum").
  Use realistic, contextual, locale-appropriate names (Sri Lankan names for
  students, subjects, and courses).
- **NO AI copywriting clichés:** "Elevate", "Seamless", "Unleash", "Next-Gen",
  "Game-changer", "Revolutionize". Concrete, plain, specific language only.
- **NO hardcoded hex/RGB/named colors for theme tokens.** STUDED: use OKLCH
  tokens from `:root`/`.dark` in `frontend/src/styles/index.css`. Every
  foreground token pairs with a `-foreground` variant.

**Em-dash ban (design-taste-frontend §9.G):** `—` and `–` are banned anywhere
visible. Use hyphens, periods, commas, or colons. This is the single most
violated AI tell; treat it as binary, not "use sparingly."

---

## 3. Typography (design-taste-frontend §4.1, minimalist-ui §3)

- **Display / headlines:** default `text-4xl md:text-6xl tracking-tighter
  leading-none`; STUDED uses `Instrument Serif` (with its italic accent) for
  hero and section headings, `Inter`/grotesk for body.
- **Body / paragraphs:** `text-base text-muted-foreground leading-relaxed
  max-w-[65ch]`.
- **Font pairings STUDED uses:**
  - Sans: `--font-sans` (Inter today; target Geist/Satoshi/Outfit)
  - Serif: `--font-serif` (`IBM Plex Serif` today; Instrument Serif for display)
  - Sinhala: `--font-sinhala` (`Noto Sans Sinhala`) - language-toggled
  - Mono: `--font-mono` (`JetBrains Mono`)
- **Serif discipline:** serif only when the brief names it or the aesthetic is
  genuinely editorial/luxury. STUDED is editorial-academic, so Instrument Serif
  display is justified and deliberate. Do NOT inject a random serif word into a
  sans headline for emphasis; use italic/bold of the same family.
- **Italic descender clearance (mandatory):** italic display words with
  descenders (`y g j p q`) need `leading-[1.1]` minimum + `pb-1`/`mb-1` reserve.
- **Hierarchy via weight + color, not raw scale.** No oversized H1s that
  scream; control hierarchy with weight, color, and spacing.

---

## 4. Color (design-taste-frontend §4.2, minimalist-ui §4)

- **Max 1 accent color per surface** (excluding the gamification layer).
  STUDED: `--primary` (intelligent blue `oklch(0.55 0.22 264)`), `--secondary`
  (knowledge violet), `--success` (growth green), `--gold` for gamification.
  The gamification accents (gold/emerald/amber/orange) are semantic: XP,
  streaks, keys, badges. Lock the palette per page; no warm-grey page that
  suddenly gets a blue CTA in section 7.
- **THE LILA RULE:** no AI-purple button glows, no random neon gradients.
  STUDED's violet is a semantic secondary, not a default glow.
- **Warm monochrome discipline (minimalist-ui §4):** STUDED already uses a
  parchment background (`oklch(0.984 0.003 95)`). Use ultra-light borders
  (`--border`) for structure. Color is scarce: reserve it for semantics and
  gamification.
- **One palette per project:** don't fluctuate between warm and cool grays.
- **Color consistency lock (mandatory):** once an accent is chosen for a page,
  it is used on the WHOLE page. Audit every component before shipping.
- **No pure black/white:** use off-black (`--foreground`) and off-white
  (`--background`). Pure values kill depth.

**STUDED token groups (from AGENTS.md):**

| Group | Tokens | Usage |
|---|---|---|
| Core surface | `--background`, `--foreground`, `--card`, `--popover`, `--border`, `--input`, `--ring` | App shell, cards, inputs |
| Action | `--primary`, `--secondary`, `--accent`, `--destructive` | Buttons, links, focus (emerald `oklch(0.76 0.15 145)` in dark) |
| Feedback | `--success`, `--warning`, `--info` | Success, warnings, info badges |
| Subject palettes | `--color-brand-1..12` (Hue 145), `--color-science-1..12` (Hue 252), `--color-commerce-1..12` (Hue 55), `--color-ai-1..12` (Hue 295) | Domain themes |
| Gamification | `--gold`, `--purple`, `--orange`, `--achievement`, `--rank-1/2/3` | XP, badges, leaderboards, streaks |

---

## 5. Layout (design-taste-frontend §4.3, §4.4, gpt-taste §4, minimalist-ui §5)

- **Grid over flex-math:** use CSS Grid (`grid grid-cols-1 md:grid-cols-3
  gap-6`), never `w-[calc(33%-1rem)]`.
- **Viewport stability:** `min-h-[100dvh]`, never `h-screen`.
- **Bento gapless rule (gpt-taste §4):** bento grids must be mathematically
  gapless - `grid-flow-dense`, interlocking `col-span`/`row-span`, no empty
  cells. 3-5 intentional cards beat 8 messy ones.
- **No 3-column equal feature cards.** STUDED: course catalog cards, lesson
  grids, and achievement grids should vary - use asymmetric grids, mixed cell
  sizes, or featured + rest layouts.
- **No section-layout repetition:** once a layout family is used, don't repeat
  it adjacently. Vary density, alignment, scale, and whitespace.
- **No zigzag monotony:** max 2 consecutive image+text splits.
- **Eyebrow restraint (#1 violated rule):** max 1 eyebrow per 3 sections.
  No section-numbering eyebrows ("SECTION 01", "00 / INDEX").
- **No split-header ban violation:** no "left big headline + right small
  explainer" as a default; stack vertically or build a clean 2-column header
  with real purpose.
- **Spacing rhythm (minimalist-ui §8):** establish macro-whitespace first
  (`py-16` to `py-24` sections), then inner spacing. Use `--spacing` scale.
- **Shape consistency lock:** one corner-radius scale per surface. Options:
  all-sharp, all-soft (12-16px), or all-pill for interactive. Buttons are
  pill/full-radius, cards are 12-16px, inputs are 8px - document and follow it.
- **Cards only when elevation conveys hierarchy;** otherwise use `border-t`,
  `divide-y`, or negative space.
- **Tinted shadows:** no pure-black drop shadows on light backgrounds.
- **Mobile collapse explicit per section:** declare `< 768px` fallback
  (`w-full`, `px-4`, `max-w-7xl mx-auto`) for every multi-column layout.

**STUDED layout patterns:**
- Landing page: floating pill navbar, editorial hero, section flow.
- Catalog: card grid with subject-palette accents + isometric icons.
- Course journey: S-curve `CourseJourneyMap` with HelmetCompanion mascot.
- Wave player: focused single-column learning surface, minimal chrome,
  progress ring + XP feedback at the bottom.
- Leaderboard: rank-1/2/3 gold/silver/bronze rows.

---

## 6. Motion (design-taste-frontend §5, gpt-taste §5, minimalist-ui §7)

**STUDED stack decision: GSAP is the motion library.** Migrate from Framer
Motion to GSAP + `@gsap/react` + ScrollTrigger. Both are currently installed;
GSAP is the target.

- **Motion must be motivated:** every animation answers one of: hierarchy,
  storytelling, feedback, state transition. No animation "because it looks
  cool". Celebration moments (XP, level-up, badges) get the biggest motion.
- **Motion claimed = motion shown:** if `MOTION_INTENSITY > 4`, the surface
  must actually animate. If you can't ship it, drop the dial.
- **Animate ONLY `transform` and `opacity`.** Never `top`, `left`, `width`,
  `height`. `will-change` sparingly.
- **Reduced motion (mandatory):** anything above `MOTION_INTENSITY > 3` honors
  `prefers-reduced-motion` via `useReducedMotion()` / `matchMedia`. STUDED's
  Web Audio UI sounds must also respect reduced motion (silenced).
- **GSAP canonical patterns (design-taste-frontend §5.A/B):**
  - Sticky-stack: `start: "top top"`, `pin: true`, `pinSpacing: false`, scale
    driven by next card's trigger.
  - Horizontal-pan: `start: "top top"`, `pin: true`,
    `end: "+=${distance}"`, `scrub: 1`.
- **No `window.addEventListener("scroll", ...)`** - use `ScrollTrigger`,
  `useScroll()`, IntersectionObserver, or CSS scroll-driven animations.
- **No `useState` for continuous values** (mouse position, scroll progress,
  pointer physics). Use GSAP's `useGSAP` + motion values.
- **Micro-interactions (minimalist-ui §7):** hover cards lift with a subtle
  shadow shift; buttons respond `scale(0.98)` on `:active`; staggered reveals
  with cascade delay; all transform/opacity only.
- **Exit faster than enter** (150-200ms out, 300-400ms in) for modals.
- **STUDED UI sound:** Web Audio API synthesized sounds accompany motion
  (`playClickSound`, `playSuccessSound`, `playLevelUpSound`). Sound fires in
  sync with the animation it celebrates (within ~1s of the action).

**STUDED GSAP migration plan (incremental, don't do in one commit):**
1. Create a `useGsap`/motion helper in `src/lib/` wrapping `gsap` +
   `useGSAP` with reduced-motion guards.
2. Migrate celebration components first: `Confetti`, `XPToast`, `LevelUpCard`,
   `PointsBadge` animations, streak fire.
3. Migrate scroll reveals (landing, catalog) to ScrollTrigger.
4. Migrate modals/dropdowns to GSAP/`gasp` tweens or CSS transitions.
5. Keep framer-motion only where GSAP integration is not worth the risk (e.g.
   drag gestures); document exceptions in DESIGN.md.
6. Remove `framer-motion`/`motion` dependency once migration completes.

---

## 7. Interactive states (design-taste-frontend §4.5, ui-ux-pro-max priorities)

Always implement full state cycles - LLMs default to "static successful state":

- **Loading:** skeletal loaders matching final layout shape, not generic
  spinners. STUDED: use subject-palette shimmer on course cards, wave skeleton
  on the player.
- **Empty states:** beautifully composed, indicating how to populate (e.g.
  "No courses yet - browse the catalog").
- **Error states:** clear, inline for forms, contextual toasts for transient.
- **Tactile feedback:** `scale-[0.98]` / `-translate-y-[1px]` on `:active`.
- **Button contrast check (mandatory):** every CTA text readable against its
  background (WCAG AA 4.5:1; 3:1 large text). No white-on-white, no transparent
  button without border on a busy background.
- **CTA button wrap ban:** labels fit on one line at desktop (3 words max for
  primary CTAs, ideally 1-2). Wrapped CTAs are a fail.
- **No duplicate CTA intent:** one label per intent per page ("Get started" +
  "Sign up free" = same intent, pick one).
- **Touch targets:** min 44x44px, 8px+ spacing (STUDED is mobile-first for
  students).
- **Focus states:** visible focus rings (2-4px) using `--ring`; never remove
  focus-visible styling.
- **Loading buttons:** disable + spinner during async (login, submit, logout).

---

## 8. Content & copy (design-taste-frontend §4.9, §9.D, minimalist-ui §2)

- **Short headlines (≤8 words), short sub-paragraphs (≤25 words).** For
  students: plain, concrete language. No jargon without explanation.
- **No data-dump sections.** Top 3-5 highlights + "View all" link.
- **No generic names** - use realistic Sri Lankan names and subject examples.
- **No fake-precise numbers** unless real: XP, streaks, and scores must be
  real student data. No invented "98% mastery" claims.
- **Copy self-audit before shipping:** re-read every visible string; flag
  grammatically broken, AI-hallucinated, or pretentious copy.
- **One copy register per page:** don't mix marketing punch, technical mono,
  and editorial prose in the same composition.
- **STUDED tone:** warm, encouraging, never shaming. Positive framing for
  mistakes ("Almost! The output gear spins faster because...").

---

## 9. Anti-patterns / AI tells to never ship (all four skills)

- AI-purple gradients, neon glows, excessive glassmorphism
- Centered hero over dark mesh as default
- Three equal feature cards as default
- Inter + slate-900 as default
- Section numbering eyebrows, "SECTION 01", scroll cues ("Scroll ↓")
- Decorative status dots, locale/time/weather strips, version footers
- `border-t` + `border-b` on every list row
- Em-dashes anywhere
- Fake product previews built from divs
- Cards-inside-cards-inside-cards, giant rounded wrappers around everything
- Overcrowded hero (STUDED: hero/landing must be calm; student surfaces must
  be low-cognitive-load)
- Fake-precise data, generic avatars, Lorem ipsum
- Full-width `h-screen` heroes (use `min-h-[100dvh]`)

---

## 10. Evaluation protocol (dual-mode: vision + text)

The loop that audits StudEd UI supports two model capabilities. Determine which
mode the active model supports and use the matching protocol:

### 10.A Vision-capable models (e.g. Gemini)
1. Capture full-page and viewport screenshots per screen × state × viewport.
2. Analyze images directly for visual quality, spacing, alignment, contrast,
   color consistency, hierarchy, motion smoothness.
3. Extract text, typography, spacing, buttons, colors, layout from the image
   (image-to-code §8-§26 extraction discipline).
4. Run the deterministic audit (contrast math, token drift, overlap,
   dead links) in parallel - math beats eyeballing.
5. Verify dopamine-loop firing order/timing by watching screenshots + reading
   state transitions.

### 10.B Text-only models (e.g. DeepSeek - no vision)
1. Capture the text fingerprint instead: DOM outline, accessibility tree,
   computed styles as OKLCH, bounding boxes, text inventory, link inventory,
   focus order, state probes. No image reading.
2. Run the deterministic audit for objective faults (contrast, token drift,
   overlap/overflow, dead links, missing alt/focus, state coverage, rhythm).
3. Critique from the fingerprint + audit output using this file's rules.
4. Never claim a visual judgment you cannot back with fingerprint evidence.
   State "UNKNOWN - needs human/visual check" rather than inventing.

**Both modes:** run the three-pass critique (defects / dark-pattern / creative
backlog). Fix defects only; human-gate dark-pattern changes and creative work.

---

## 11. Dopamine loop / student psychology (StudEd-specific layer)

Beyond visual polish, StudEd must sustain a healthy, honest motivation loop:

- **Progress visibility:** clear course → lesson → wave progress everywhere.
  Every screen has a visible next action; "Continue where you left off" is the
  default affordance.
- **Mastery feedback:** positive, specific, immediate feedback after every
  evaluation. XP toast fires within ~1s of the correct answer.
- **Reattempt safety:** retries allowed with pedagogically sound gating, never
  punishment. Losing a streak must never feel like a trap.
- **Streak/XP honesty:** rewards tied to learning milestones, not visits.
  No XP farming via clicking.
- **Achievability:** goals calibrated so an average student succeeds with
  effort (proficiency curve, not a cliff). Celebrate small wins frequently.
- **Autonomy:** student can pause, resume, and see what's left without anxiety.
- **No dark patterns:** no manufactured urgency, no guilt-trip copy, no
  forced-action paywalls, no shame leaderboards, no dopamine farming.

**Serves vs Exploits test (apply to every gamification decision):**
*"Does this increase the student's genuine comprehension, autonomy, or healthy
motivation (serves)? Or does it manipulate behavior for retention at the
student's expense (exploits)?"* Verdict must be one line + reason.

---

## 12. Pre-flight checklist (design-taste-frontend §14, adapted)

Before shipping any UI work, run this matrix. Every box must be ticked:

- [ ] Design Read declared (one-liner, §0)
- [ ] Dial values explicit and reasoned from the brief (§1)
- [ ] ZERO em-dashes anywhere
- [ ] One theme lock per page (light/dark/auto); dark mode tested
- [ ] One accent lock per surface; OKLCH tokens only, no raw hex
- [ ] One corner-radius scale per surface
- [ ] Button contrast AA; no white-on-white; no wrapped CTAs
- [ ] Form contrast AA; labels above inputs; no placeholder-as-label
- [ ] Hero/landing: headline ≤2 lines, subtext ≤20 words, CTA visible without
      scroll, max `pt-24`
- [ ] Eyebrow count ≤ ceil(sections/3)
- [ ] No section-layout repetition; no zigzag 3x; no empty bento cells
- [ ] No duplicate CTA intent
- [ ] Logo wall = logos only, real SVGs, below the hero
- [ ] No pills/labels overlaid on images; no photo-credit decoration
- [ ] Copy self-audit passed; no AI tells; no fake-precise data
- [ ] Motion motivated; reduced-motion honored; sounds respect reduced motion
- [ ] Loading/empty/error states present on every data surface
- [ ] Touch targets ≥44px; focus rings visible; keyboard navigable
- [ ] Mobile collapse explicit; `min-h-[100dvh]`; no horizontal scroll
- [ ] GSAP conventions followed (no window scroll listeners, transform/opacity
      only, cleanup in useEffect)
- [ ] No emojis in code/copy; no hardcoded colors; no Inter/lucide in NEW code
      (migration in progress)
- [ ] Core Web Vitals plausibly hit (LCP <2.5s, INP <200ms, CLS <0.1)
- [ ] Dopamine-loop probes pass (XP toast, streak, progress ring, confetti
      fire in correct order/timing)
- [ ] Serves-vs-Exploits verdict passed for every gamification touchpoint

If any box cannot be honestly ticked, the work is not done.