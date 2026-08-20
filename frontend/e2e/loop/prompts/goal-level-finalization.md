# StudEd GOAL-LEVEL LOOP PROMPT — Project Finalization

Use this prompt as the single source of truth for an agentic loop that finalizes the StudEd platform. The loop is **goal-level**: every iteration plans, executes, validates, and re-plans against this document. It is not a one-shot task list; it is a closed loop that converges on the Goal State below.

---

## 0. Operating Mode

You are a **senior engineer + UX designer + student-psychology expert + education PhD** working on a **hackathon-pitch mindset**. You build things that a demo judge can grasp in 60 seconds, that a Grade 4-5 child can operate without instructions, and that an educator can edit without a manual.

Every iteration runs in this order and never skips a phase:

```
1. PLAN      - read this doc, read AGENTS.md, re-read relevant docs, write a plan for ONE slice
2. PULL      - git pull origin main (never start from a stale tree)
3. EXECUTE   - implement the slice in small modular commits (conventional commits)
4. VALIDATE  - bun run typecheck, bun run test --run, biome lint, make ci-local
5. VERIFY    - run frontend/e2e/loop/ (Phase 0-3) or playwright smoke on changed routes
6. RE-PLAN   - update the plan, mark done/blocked, pick the next slice
7. PUSH      - git push origin <active-branch> ONLY (never push to main while on a feature branch)
```

Rules:
- **Small modular commits.** Each commit is one coherent change. Do not bundle. Use Conventional Commits (`feat/fix/style/refactor/docs/test/chore/ci`).
- **Read first.** Read `AGENTS.md`, `00-Project-Overview/`, `01-Architecture/`, `02-Content-Hierarchy/`, `07-Technical-Specs/` before writing code for a slice.
- **Use Bun.** `bun install`, `bun run`, `bunx`. Never npm/yarn/npx.
- **No hardcoded secrets.** Env vars, `flutter_secure_storage` for mobile, never in code.
- **No emojis** in code, comments, or commits. Typographic symbols (`✦ → ↑`) are allowed; pictograph emojis are not.
- **Match the stack.** Vite+React+TS+TanStack+Zustand+Tailwind v4 (OKLCH)+GSAP+urql on frontend; Go+gqlgen on backend. Do not introduce new major frameworks without explicit approval.
- **Update docs.** If architecture or workflow changes, update the relevant markdown and `AGENTS.md`.
- **Ask before assuming.** If a requirement in this doc conflicts with existing code, prefer the existing code unless this doc explicitly overrides it.

---

## 1. GOAL STATE (the destination)

The platform must be demonstrable end-to-end as a **subscription educational product for Sri Lankan schools (Grades 1-11, O/L, A/L)**. A judge can:

1. Pick a **Grade 4-5 Physics course** from the catalog.
2. Play a **Learn phase** with real animations, guided by a **blob teacher mascot** who talks in kid-level dialog boxes ("gotcha!", "yaay!") and is **TTS-ready**.
3. Play an **Evaluate phase** that is mostly **interactive manipulation** (drag/select/switch/click/swipe), not MCQs.
4. Ask the **AI chat** (resizable panel) a question about the lesson and get a child-appropriate answer.
5. See the **Course → Lesson → Wave** hierarchy fully modular, **seeded to the database**, and renderable in the **educator editing panel**.

The following are the concrete deliverables. Each is a slice; each slice must reach Goal State before the loop moves to the next.

---

## 2. DELIVERABLE SLICES (in dependency order)

### SLICE A — Physics for Grade 4-5 (Flagship Demo Lesson)
A complete **Grade 4-5 Physics course** with at least **two lessons**:
- **Lesson 1: Forces & Motion** — a "push-pull" wave with a slider/friction toy, an injectable animation showing force arrows and acceleration.
- **Lesson 2: Electricity** — the flagship concept lesson. Light bulb circuit with tap-to-complete wiring, current/voltage metaphor (water-flow analogy), short-circuit warning animation.
Every wave must be a full **Learn → Evaluate** cycle. Evaluate must be **manipulative, not MCQ**: tap the correct wire, drag the missing battery, order the circuit steps, swipe the switch.

### SLICE B — Full Course Curriculums
Author complete, DB-seedable curriculums for:
- **Physics (Grades 4-11, O/L, A/L)**
- **Mathematics (with a "Math Foundation" course plan + one demo lesson)**
- **IT / Computer Science (Grades 6-11, O/L, A/L)**
Each curriculum: Course → Lessons → Waves, with **many waves per lesson** (vary by concept), each wave carrying Learn blocks + Evaluate blocks. All seedable (SQL migration or seed script) and renderable in the educator panel.

### SLICE C — Modular Content Architecture
- The **Course → Lesson → Wave** hierarchy must be fully modular in code: a wave is a typed data structure, not a bespoke page.
- Learn blocks and Evaluate blocks are **typed, versioned, serializable** so the same wave renders in student UI, educator editor, and DB seed.
- **Educator editing panel** must open any seeded wave and edit blocks (reuse the existing Puck/editor surface).

### SLICE D — Blob Teacher + AI Chat
- A **blob character teacher** (mascot) integrated into Learn phases with **dialog boxes** using kid-level phrases.
- An **AI chat panel** that is **resizable and smooth** (GSAP transitions), answerable to the current lesson context.
- Architecture must be **TTS-ready**: every dialog box has a stable `text` field that a TTS engine can consume later (no audio files; Web Audio API only for UI sounds).

### SLICE E — Interactive Learning Toolkit
Prefer **drag/drop, select, switch, click, swipe** over MCQs. Provide **injectable animations** (a declarative animation registry so educators/DB can attach animations to blocks). Include a **Python interactive interpreter** block for the IT/CS course where students run code and see errors visibly.

---

## 3. CROSS-CUTTING CONSTRAINTS (apply to every slice)

### UI/UX
- **Minimal, highly interactive, playful.** Kid-safe palette from the OKLCH system; no AI-purple glow, no neon gradients.
- Touch targets ≥ 44x44px; focus rings visible; keyboard navigable.
- No `rounded-full` pills on cards/modals/containers (only the navbar pill + pill buttons are sanctioned).
- No text < 12px for readable content.
- All motion via **GSAP** (+ `@gsap/react`), honoring `prefers-reduced-motion`. Framer-motion only where GSAP is high-risk (drag gestures); document exceptions.
- No `window.addEventListener("scroll")` — use ScrollTrigger/IntersectionObserver/CSS.
- Sounds via Web Audio API (`playClickSound`, `playSuccessSound`, `playLevelUpSound`), silenced under reduced-motion.
- Sinhala + English copy (i18n), realistic Sri Lankan names/content, no em-dashes in visible copy.

### Gamification
- XP awarded for genuine mastery, not superficial actions. Confetti/streaks only for real milestones.
- Run the **Serves vs Exploits** test on every gamification touchpoint (see `prompts/dark-patterns.md`).
- Reattempts allowed without punitive XP loss (see `05-Gamification/Reattempt-Mechanics.md`).

### Engineering
- **Typecheck + tests green before any push.** Regression tests only where necessary; do not over-test.
- `make ci-local` passes before push to main or PR.
- Seed data idempotent; migrations up/down safe.
- Use **graphify** (`.agents/skills/graphify`) to minimize context tokens when querying symbol dependencies, proto contracts, or microservice call graphs.
- Use **`gh` CLI** for issues/PRs. Comment to claim an issue before starting work (per `.agents/MULTI_AGENT_WORKFLOW.md`).
- Use **playwright** for smoke tests on changed routes.

---

## 4. VERIFICATION GATES (per slice, in order)

1. `bun run typecheck` — zero errors outside known-ignored legacy files.
2. `bun run test --run` — all suites pass (currently 24 files / 86 tests baseline).
3. `bunx biome lint` on changed files — no new errors.
4. `frontend/e2e/loop/` Phase 0-3 (discover → snapshot → audit → critique) — REPORT.md must show no new P0/P1 defects introduced by the slice.
5. Playwright smoke on changed routes (student wave, educator panel, catalog).
6. `make ci-local` before pushing to main/PR.

---

## 5. DEFINITION OF DONE (loop termination)

The loop may STOP only when **all** are true:

- [ ] Slice A, B, C, D, E reach Goal State (2.1-2.5 above).
- [ ] Grade 4-5 Physics demo (Forces + Electricity) fully playable from catalog → wave → evaluate.
- [ ] All three curriculums seeded and render in educator panel.
- [ ] Blob teacher dialog + resizable AI chat live, TTS-ready.
- [ ] Typecheck, tests, biome, loop audit, playwright smoke all green.
- [ ] `make ci-local` green.
- [ ] Docs updated (architecture, workflow, DESIGN.md for GSAP exceptions).
- [ ] Every commit pushed to the active branch; main only via merge/PR after `make ci-local`.

If any gate fails, do NOT stop: fix, re-validate, re-plan, continue.

---

## 6. LOOP METRICS & REPORTING

At the end of each iteration, update `frontend/e2e/loop/REPORT.md` (or a sibling `GOAL_TRACKER.md`) with:
- Slice in progress, status (blocked/in_progress/done).
- Verification gate results (typecheck/tests/biome/audit/playwright).
- Commits pushed this iteration.
- Next slice planned.
Keep it one page. This is how a human or reviewer sees convergence.