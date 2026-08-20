# StudEd Goal Loop Tracker

**Iteration**: 1  
**Branch**: `feature/physics-g4-5`  
**Date**: 2026-08-20

---

## Slice status

| Slice | Status | Where it stands |
|---|---|---|
| A — Grade 4-5 Physics flagship | **in_progress** | Two lessons, six waves authored and playable end to end. Lesson 1 covers pushes and pulls, friction, and speeding up; Lesson 2 covers the bulb circuit, the water-flow analogy, and the short circuit. Every Evaluate question is a manipulation. |
| B — Full curriculums | **pending** | Physics G6-11/OL/AL, Math Foundation, and IT/CS not yet authored. |
| C — Modular content architecture | **in_progress** | Blocks are typed, versioned and serializable; a wave now renders from data in the student player and seeds from the same manifest. Educator panel rendering of the new blocks and retiring the bespoke gears/maze pages are still open. |
| D — Blob teacher + AI chat | **in_progress** | Blob teacher dialog blocks are live and TTS-ready, and the resizable lesson chat panel is mounted in the wave player. Remaining: Sinhala copy for the teacher's lines. |
| E — Interactive toolkit | **in_progress** | Tap, pick-and-place, ordering, switch and slider question types plus an injectable animation registry are live. The Python interpreter block is not started. |

## Verification gates

| Gate | Result |
|---|---|
| `bun run typecheck` | pass, 0 errors (required `bun install`, `@paper-design/shaders-react` was missing from node_modules) |
| `bun run test --run` | pass, 30 files / 129 tests, up from 23 / 85 |
| `bunx biome lint` on changed files | pass, no new errors. Two pre-existing a11y errors remain in `courses.$courseId.tsx` at line 367 |
| Playwright smoke | pass, 3/3 in `e2e/physics-demo.spec.ts` covering catalog, syllabus, Learn, Evaluate and the circuit lab |
| `make content-validate` | pass, 3 manifests valid |
| `make ci-local` | blocked on this machine. Every code gate passed (security scan, frontend typecheck, tests, build, all Go service tests, shared tests); it stops at `helm-lint` because helm, kyverno, tofu and promtool are not installed locally. GitHub Actions covers those. |

## Commits this iteration

- `feat(content)` typed interactive block contract with canonical answers
- `feat(learn)` injectable animation registry with physics scenes
- `feat(learn)` interactive physics lab blocks for forces and electricity
- `feat(evaluate)` manipulative evaluate blocks routed from the player
- `feat(mascot)` blob teacher dialog blocks for the Learn phase
- `feat(content)` interactive blocks accepted in course manifests
- `feat(content)` the Grade 4-5 Physics flagship course
- `feat(courses)` manifest-backed courses playable without a backend
- `test(e2e)` the Grade 4-5 physics demo path end to end
- `feat(learn)` resizable lesson chat panel for students

## Open defects found this iteration

- **P2** Framer Motion throws `Only two keyframes currently supported with spring and inertia animations` on every authenticated page load. Pre-existing, unrelated to this slice: a spring transition is driving a multi-keyframe `y` array. Worth fixing before the demo since it fills the console.
- **P2** The wave player still special-cases the gears and maze waves by id and by title substring. Slice C should replace both with typed blocks.

## Next slice planned

Educator panel rendering for the new block types (Slice C), then the Slice B
curriculums, then the Python interpreter block (Slice E).
