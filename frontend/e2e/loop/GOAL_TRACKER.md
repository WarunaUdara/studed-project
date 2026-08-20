# StudEd Goal Loop Tracker

**Iteration**: 3  
**Branch**: `feature/physics-g4-5`  
**Date**: 2026-08-20

---

## Slice status

| Slice | Status | Where it stands |
|---|---|---|
| A — Grade 4-5 Physics flagship | **in_progress** | Two lessons, six waves authored and playable end to end. Lesson 1 covers pushes and pulls, friction, and speeding up; Lesson 2 covers the bulb circuit, the water-flow analogy, and the short circuit. Every Evaluate question is a manipulation. |
| B — Full curriculums | **in_progress** | Math Foundation ships as a five lesson plan with Lesson 1 fully built on fractions. Physics G6 to A/L and IT/CS are next, built for depth per grade band rather than thin coverage of every grade. |
| C — Modular content architecture | **in_progress** | Blocks are typed, versioned and serializable; a wave renders from data in the student player, seeds from the same manifest, and now edits in the educator panel without the round-trip flattening it. Retiring the bespoke gears and maze pages is still open. |
| D — Blob teacher + AI chat | **in_progress** | Blob teacher dialog blocks are live and TTS-ready, and the resizable lesson chat panel is mounted in the wave player. Remaining: Sinhala copy for the teacher's lines. |
| E — Interactive toolkit | **in_progress** | Tap, pick-and-place, ordering, switch and slider question types, four physics scenes and the fraction bar are live, all injectable by scene id. The Python interpreter block is next, running server side by decision rather than shipping Pyodide to the browser. |

## Verification gates

| Gate | Result |
|---|---|
| `bun run typecheck` | pass, 0 errors (required `bun install`, `@paper-design/shaders-react` was missing from node_modules) |
| `bun run test --run` | pass, 31 files / 139 tests, up from 23 / 85 |
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
- `feat(educator)` interactive blocks editable in the wave editor
- `feat(learn)` fraction bar lab for maths waves
- `feat(content)` Math Foundation course plan and demo lesson

## Open defects found this iteration

- **P2** Framer Motion throws `Only two keyframes currently supported with spring and inertia animations` on every authenticated page load. Pre-existing, unrelated to this slice: a spring transition is driving a multi-keyframe `y` array. Worth fixing before the demo since it fills the console.
- **P2** The wave player still special-cases the gears and maze waves by id and by title substring. Slice C should replace both with typed blocks.

## Decisions taken

- The Python interpreter block runs **server side** in a sandboxed endpoint
  rather than shipping Pyodide to the browser.
- Slice B is built for **depth per grade band** (G6-8, G9-11, O/L, A/L) with two
  lessons of three manipulative waves each, not thin coverage of every grade.

## Next slice planned

The server-side Python execution endpoint and its interpreter block, then the
Physics ladder from G6 to A/L, then IT/CS.
