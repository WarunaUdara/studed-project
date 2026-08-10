# Autonomous Production Readiness TODO List

This TODO list is maintained dynamically by long-running agents during autonomous audit & refactoring cycles.

---

## 🟢 Completed Tasks
- [x] Integrate `grpcauth` fail-closed inter-service authentication across all microservices.
- [x] Configure `api-gateway` GraphQL transports (`GET`, `POST`, `MultipartForm`).
- [x] Resolve `govulncheck` vulnerabilities in `auth-service` and `api-gateway`.
- [x] Add zero-cost `floci-gcp` local emulator configuration in OpenTofu IaC.
- [x] Author declarative `coordinate-geometry` course manifest and sync engine.
- [x] Build interactive 2D `CoordinatePlaneBlock.tsx` visual discovery component.
- [x] Add Redis connection retry/reconnect exponential backoff logic in `services/api-gateway/internal/middleware/ratelimit.go` (background health monitor + fail-closed `allow()`).
- [x] Add unit test coverage for `services/api-gateway/internal/middleware/auth.go` claims parsing.
- [x] Add OpenTelemetry trace propagation context across gRPC client interceptors in `shared/go/grpcauth`.
- [x] Enforce `grpcauth.UnaryServerInterceptor` on `auth-service` and `course-service` gRPC servers.
- [x] Add OpenTelemetry SDK initialization/export to service mains (`shared/go/otel`).
- [x] Document the gRPC trace propagation + token auth contract in `docs/ARCHITECTURE.md`.
- [x] Run `govulncheck` + `bun audit` and refresh dependency pins (Go 1.26.2, Bun overrides postcss ^8.5.26).
- [x] Add OTLP HTTP trace exporter (`otlptracehttp`) to `shared/go/otel` with automatic fallback to stdouttrace.
- [x] Provision Grafana Tempo distributed trace collector in `docker-compose.yml` (`http://tempo:3200`) and Grafana datasources (`tempo.yml`).
- [x] Add 3D high-resolution generated cover artwork for Course Catalog cards.

---

## 🟡 Open Backlog Tasks

### Frontend visual design & theming
Opened 2026-08-10 by a browser-driven visual audit of the rendered UI (previous
passes reviewed the frontend statically). Full findings, evidence, and rationale:
[`audit/10-FRONTEND-VISUAL-DESIGN.md`](../audit/10-FRONTEND-VISUAL-DESIGN.md).

Ordered by value. Each item is atomic and independently verifiable.

- [x] **VIS-09 — Unblock visual audit of protected routes.** Done against the
  real backend rather than a mock: `frontend/e2e/tools/authShoot.ts` logs in
  through the actual form and captures the student and educator surfaces.
  Required repairing `docker-compose.yml` (undeclared `tempo_data` volume) and a
  dirty gamification migration — see "Environment repairs" in the audit doc.
  Demo password is `password123`, not `password1234` (VIS-21).
- [x] **VIS-16 — Deduplicate progression state.** One canonical home per signal:
  XP + level bar in the Navbar, streak in the dashboard greeting band (renders
  at every viewport, unlike the `lg`-only sidebar), logout in the Navbar.
  `StudentShell`'s sidebar is now navigation and identity only.
- [x] **VIS-17 — Rebalance the dashboard grid.** Moved the Gamification Hub into
  the main column: columns now end within ~60px of each other (was ~750px
  apart) and page height dropped 4210px to 3416px with no content removed.
- [x] **VIS-22 — Fix `--muted-foreground`.** Chroma was 0.145 against `--primary`
  0.164, so every caption in the app rendered as near-brand green and the
  primary/secondary text hierarchy inverted. Now 0.022 in both themes.
- [x] **VIS-23 — Remove the educator sidebar's duplicate logout** (same pattern
  as VIS-16, in `EducatorShell`).
- [x] **VIS-24 — Replace off-palette colours on the educator dashboard.**
  `amber-500` to `--warning`, `blue-500` to `--info`, XP figure to `--gold`;
  8 of the 185 VIS-05 raw-palette usages cleared.
- [ ] **VIS-25 — Fix the "Completion Rate" metric.** It computes published/total
  *courses*, so the demo reads 100% while all 24 courses contain 0 waves and the
  neighbouring card reads "0 XP across 0 published waves". "Content Health" has
  the same flaw. Rename it or compute `publishedWaves / totalWaves` (the loop at
  `educator/_layout/index.tsx:61-75` already gathers both).
- [ ] **VIS-26 — Delete or repurpose the educator "Quick Actions" card.** All
  three entries duplicate on-screen navigation, and "Dashboard" links to the
  current page.
- [ ] **VIS-27 — Unify publish-status treatment.** Dashboard uses "Live"/"Draft"
  pill badges; course detail uses plain "Published" text. One component, one
  vocabulary.
- [ ] **VIS-19 — Resolve duplicated navigation.** Three destinations appear in
  both navbar and sidebar with inconsistent labels ("Courses" vs "My Courses").
  Make the sidebar primary on authenticated routes.
- [ ] **VIS-18 — Add a short-content treatment to the wave player.** Page ends at
  ~45% viewport height with a short learn block; tab strip spans 896px with both
  tabs left-aligned.
- [ ] **VIS-20 — Keep e2e fixtures out of the demo dashboard.** Four of six
  "My Courses" entries are test artefacts (`E2E TEST COURSE 1784055373417`,
  `Gating Repro 178403…`). Namespace them to a dedicated account or purge them.
- [ ] **VIS-21 — Fix the e2e warm-up login.** `e2e/global-setup.ts` uses
  `password123` while the seed script provisions `password1234`, and swallows
  the failure via `.catch(() => {})`, so it silently warms nothing. Share one
  credentials constant and let the final `waitForURL` throw.
- [ ] **VIS-01 — Add a pre-paint theme script** to `frontend/index.html` so
  dark-theme users do not get a white flash on every load. Must run before the
  stylesheet and read the same `studed-ui-prefs` key.
- [ ] **VIS-02 — Respect `prefers-color-scheme`** in `uiPrefs.hydrate()`
  (`frontend/src/stores/uiPrefs.ts:102`) instead of defaulting to `"light"`.
- [ ] **VIS-03 — Ship a real favicon set + social meta.** `/vite.svg` is
  referenced but absent from `frontend/public/` (404). Add favicon/apple-touch
  icons, `description`, OG/Twitter tags with a 1200x630 card, and
  light/dark `theme-color`.
- [ ] **VIS-06 — Fix webfont delivery.** Self-host subset `woff2` under
  `public/fonts/`, drop the render-blocking third-party `@import`
  (`frontend/src/styles/index.css:1`), preload the two above-the-fold faces, and
  trim IBM Plex Serif from 14 axes to the 2 actually rendered.
- [ ] **VIS-07 — Give the landing page a surface rhythm.** Sections currently
  differ by ~1-2% lightness and read as one flat near-white field. Establish a
  three-tier alternation and resolve the final CTA's isolated green→purple
  gradient into the palette.
- [ ] **VIS-08 — Consolidate card treatments.** Four distinct card styles and
  three unrelated radii on one page. Define `flat` / `raised` / `feature`
  variants in `components/ui/Card.tsx` via `class-variance-authority` (already a
  dependency) and convert the landing sections.
- [ ] **VIS-05 — Triage 185 raw-palette classes.** Convert the ~85 in app chrome
  (`achievements.tsx`, `courses.index.tsx`, `leaderboard.tsx`,
  `educator/_layout/index.tsx`) to OKLCH tokens. For the ~100 in
  `learn/visualizations/`, keep fixed palettes but promote them to a documented
  `lib/vizPalette.ts` marked intentionally theme-independent.
- [ ] **VIS-04 — Decide on emoji iconography** (🥇🥈🥉⭐👑💎🟡✅🌟👤🔥 in
  `lib/gamification.ts`, `LeaderboardRow.tsx`, `GamifiedPreview.tsx`). These are
  spec-defined in `05-Gamification/`, so **confirm with the product owner before
  changing.** If approved, replace with `lucide-react` icons tinted by the
  existing `--rank-*` / `--gold` tokens and update the spec.
- [ ] **VIS-10 — Replace the A/B/C/D placeholder avatars** in the hero trust row
  with real avatars, or drop the cluster.
- [ ] **VIS-11 — Tighten the mobile hero** so the `WaveMapHero` card is not cut
  off by the fold at 390x844.
- [ ] **VIS-12 — Split `routes/index.tsx`** (1,000 lines, 10 sections) into
  `components/public/sections/` to reduce multi-agent merge conflicts.

**Capture traps** — read the "Two capture traps" section of
`audit/10-FRONTEND-VISUAL-DESIGN.md` before screenshotting. `whileInView`
reveals do not fire under `fullPage: true`, and scrolling to the page bottom
triggers a full-viewport confetti overlay that contaminates subsequent shots.
Both produce convincing false positives.
