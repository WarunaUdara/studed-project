# 07 — User & Developer Experience

**7 findings · 0 Critical · 1 High · 5 Medium · 1 Low**

---

## 🟠 UX-01 — No accessibility validation on a product built for children

**Severity: High · Legal and ethical obligation**

There is no automated accessibility testing anywhere: no `axe-core`, no
`eslint-plugin-jsx-a11y` in the Biome config, no Lighthouse CI, and no
accessibility statement. The eleven Playwright specs test functionality only.

For a K-12 education platform this is not a polish item:

- Educational products are commonly procured under accessibility requirements
  (WCAG 2.2 AA is the usual bar); a school or ministry procurement will ask.
- Some proportion of the target users — children with dyslexia, ADHD, low
  vision, or motor differences — cannot use an inaccessible learning platform
  at all. The project's own ADHD-focused Pomodoro/binaural features show intent
  to serve neurodivergent students, which makes the gap more conspicuous.

Specific risks visible in the code:
- `MathFormula` (`frontend/src/components/ui/MathFormula.tsx:41`) injects KaTeX
  HTML with no `aria-label` and no MathML fallback — formulas are silent to a
  screen reader. KaTeX supports `output: "htmlAndMathml"`, which is the
  accessible setting; the code uses `output: "html"`.
- The Pomodoro engine plays binaural beats and generated audio via the Web
  Audio API. Auto-playing audio requires user initiation, a visible stop
  control, and a volume control (WCAG 1.4.2). Binaural beats also warrant a
  health note — they are contraindicated for people with epilepsy.
- Gamification (XP, streaks, leaderboards) relies on colour and motion; needs
  `prefers-reduced-motion` support and non-colour status indicators.

**Fix.**
1. `output: "htmlAndMathml"` in KaTeX, plus `aria-label` with the source LaTeX.
2. Add `@axe-core/playwright` and assert zero serious/critical violations on
   the main routes — this reuses the existing Playwright suite, so it is
   inexpensive:
   ```ts
   const results = await new AxeBuilder({ page }).analyze();
   expect(results.violations.filter(v => ["serious","critical"].includes(v.impact!))).toEqual([]);
   ```
3. Lighthouse CI with an accessibility threshold of 95.
4. Keyboard-navigation test for the wave-completion flow, focus-visible styles,
   and skip links.
5. Respect `prefers-reduced-motion` in the gamification animations; add explicit
   consent + a safety note before any binaural audio plays.

---

## 🟡 UX-02 — Users see raw internal error strings

**Severity: Medium · Cross-referenced as [SEC-10](01-SECURITY.md#-sec-10--internal-errors-are-returned-verbatim-to-clients)**

With no gqlgen error presenter, wrapped Go errors reach the browser verbatim:

> `failed to fetch wave: rpc error: code = Unavailable desc = connection error: desc = "transport: Error while dialing dial tcp 10.4.2.31:8083: connect: connection refused"`

A student sees this. It tells them nothing actionable, leaks infrastructure
detail, and looks broken.

There is also no error taxonomy on the frontend, no distinction between
retryable and terminal failures, no retry affordance, and no offline handling —
relevant for the target market's connectivity.

**Fix.** Server side, implement the `PublicError` taxonomy from SEC-10
(`UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION`, `RATE_LIMITED`,
`CONFLICT`, `INTERNAL`) with a request ID in `extensions`.

Client side, map codes to human copy and an appropriate action:

| Code | Message | Action |
| :--- | :--- | :--- |
| `UNAUTHENTICATED` | "Your session ended. Please sign in again." | Redirect to login |
| `FORBIDDEN` | "You don't have access to this." | Back to dashboard |
| `RATE_LIMITED` | "Too many attempts — try again in a minute." | Countdown, disabled retry |
| `INTERNAL` | "Something went wrong on our side." | Retry button + reference ID |

Add TanStack Query retry with backoff for idempotent reads only, an offline
banner via `navigator.onLine`, and an error boundary per route so one broken
component does not blank the page.

---

## 🟡 UX-03 — Sinhala support is a headline feature with no i18n foundation

**Severity: Medium**

The README and `03-Educator-Portal/Sinhala-Language-Support.md` present Sinhala
support as a core differentiator, and `preferredLanguage` is threaded through
the user model and the JWT claims. But:

- There is **no i18n library** in the frontend (no `i18next`, `react-intl`, or
  equivalent) and no message catalogue. All UI strings are hardcoded English.
- The only translation mechanism is `translateContent` — a **runtime LLM call**
  (COST-01). That is appropriate for translating *educator-authored content*,
  but it is the wrong tool for interface strings: it is slow, costs money per
  render, is non-deterministic, and cannot be reviewed by a Sinhala speaker.
- No font loading strategy for Sinhala script (Noto Sans Sinhala or similar),
  and no verification that the current font stack renders Sinhala correctly.
- No RTL/locale-aware date, number, or plural formatting.

So a Sinhala-preferring student gets an entirely English interface.

**Fix.** Separate the two concerns properly:
- **UI strings** → `i18next` with `en.json` / `si.json` catalogues, reviewed by
  a native speaker. Deterministic, free, cacheable, reviewable.
- **Authored content** → keep the LLM translation, but translate **once at
  authoring time** and store both language versions on the wave, rather than
  translating on every read. This removes the per-render cost entirely and lets
  an educator correct the machine output before students see it.
- Add `Intl.DateTimeFormat`/`NumberFormat` with the active locale, and
  self-host Noto Sans Sinhala with `font-display: swap`.

---

## 🟡 UX-04 — Locked content gives no explanation

**Severity: Medium**

`GetWaveProgress` returns `status: LOCKED` (`progress.go:290-295`) with no
indication of *why* or *what unlocks it*. The unlock rule — the immediately
preceding wave in course-wide sequence order must have a passing attempt — is
non-obvious, and the sequence spans lesson boundaries, so the blocking wave may
be in a different lesson entirely.

A student who sees a locked wave has no way to discover what to do next. That
is a direct drop-off point in the core learning loop.

**Fix.** Return the reason and the target with the status:
```graphql
type WaveProgress {
  status: ProgressStatus!
  lockReason: LockReason        # PREVIOUS_WAVE_INCOMPLETE | NOT_ENROLLED | NOT_PUBLISHED
  unlockedBy: WaveRef           # { id, title, lessonTitle }
}
```
Then the UI can say *"Complete 'Introduction to Fractions' in Lesson 2 to
unlock this"* with a link — a small change that materially improves the
product. The same applies to the reattempt cap: surface `remainingAttempts`
prominently *before* a student submits, not only in the response.

---

## 🟡 DX-01 — Onboarding requires seven tools and a working guess

**Severity: Medium**

A new contributor must install Docker, Bun, Go 1.25, `protoc`, OpenTofu, Helm,
kubectl, and (for some targets) gcloud and k3d. There is no devcontainer, no
`asdf`/`mise` tool-version file, no bootstrap script, and no `make doctor`. Some
Makefile targets fail outright on any machine that is not the original author's
(OPS-09).

The failure mode is poor: a missing tool produces `command not found` from
inside a `for` loop, several layers into a Makefile recipe.

**Fix.**
1. `make doctor` — check every required tool, report versions, print install
   commands for what is missing. Highest value per line of code in this repo.
2. `mise.toml` (or `.tool-versions`) pinning go/bun/tofu/helm versions, so the
   local toolchain matches CI and the OPS-07 skew cannot recur.
3. `.devcontainer/devcontainer.json` for a zero-install path via VS Code or
   Codespaces.
4. A `QUICKSTART.md` with the literal five commands from clone to a working
   local demo, verified against a clean machine.

---

## 🟡 DX-02 — Documentation sprawl obscures the source of truth

**Severity: Medium**

The repository root mixes a full Obsidian vault with the codebase:

- 9 numbered documentation directories (`00-Project-Overview/` …
  `99-Meta/`) with ~40 markdown files.
- A parallel `docs/` directory with 5 deployment documents.
- Root-level `AGENTS.md`, `prompt_for_claude.md`, `User Journeys.md`,
  `DEPLOYMENT.md`, `README.md`.
- Four AI-tool configuration directories: `.claude/`, `.cursor/`, `.gemini/`,
  `.opencode/`, plus `.agents/` and `agent/`.
- `.obsidian/` workspace state committed to git.
- Empty stub files: `Evaluate Component.md`, `System Architecture.md`,
  `Puck Research.md`, `2026-06-03.md`, `Untitled.base` — all 0 bytes, all
  duplicating real content that lives in the numbered folders.

The content itself is often good. The problem is that a reviewer cannot tell
which document is authoritative, and several are contradicted by the code
(FLOW-09, REL-01, OPS-01). Duplication guarantees drift.

**Fix.** Establish one hierarchy:
```
README.md              → what it is, quickstart, accurate architecture diagram
docs/
  ARCHITECTURE.md      → the single architecture source of truth
  DEPLOYMENT.md
  OPERATIONS.md        → runbooks, SLOs, DR
  DECISIONS/           → ADRs, one per significant choice
  product/             → the Obsidian vault content, moved here wholesale
audit/                 → this report
```
Delete the empty stubs, add `.obsidian/workspace.json` and `.DS_Store` to
`.gitignore` (`.DS_Store` is listed but a copy is still tracked at the root),
and consolidate the six AI-agent config directories into `.claude/` plus a
single `AGENTS.md`.

Most importantly: **make the README's architecture diagram match reality**
(FLOW-09). It is the first thing anyone reads.

---

## 🔵 DX-03 — Working-tree hygiene

- `.mock-educator-cookies` and `.mock-student-cookies` sit in the working tree.
  Correctly gitignored, but they hold live session tokens and should live in a
  gitignored `.local/` directory rather than the repository root.
- `.DS_Store` is present at the root despite being in `.gitignore` — it was
  committed before the rule was added. Remove with `git rm --cached .DS_Store`.
- `submodules/math-to-manim` is untracked and unreferenced by the build. Either
  register it properly in `.gitmodules` or remove it.
- `frontend/test-results/` and `frontend/dist/` exist locally; both are
  gitignored, which is correct.

---

## What is already good

- **Cookie-based auth done right** — `HttpOnly`, `Secure`, `SameSite`, with a
  non-sensitive `studed_has_session` flag in localStorage for UI state. This is
  the correct pattern and is more often got wrong than right.
- **Graceful KaTeX degradation** — `MathFormula` falls back to rendering the raw
  formula as code rather than showing a blank block, with a comment explaining
  the reasoning. Thoughtful.
- **Biome** for fast, unified lint/format on the frontend.
- **Eleven Playwright specs** already written and covering the real user
  journeys — a strong asset, currently unused by CI (OPS-04).
- **`make demo-public`** — one-command public demo via ngrok is a genuinely
  useful piece of developer experience.
- **Conventional commits** used consistently in the git history, which makes
  automated changelogs a drop-in addition (OPS-11).
