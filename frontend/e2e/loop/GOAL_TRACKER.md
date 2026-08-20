# StudEd Goal Loop Tracker

**Iterations completed**: 7  
**Branch**: `feature/physics-g4-5` (pull request #86 open against `main`)  
**Date**: 2026-08-20

---

## Slice status

| Slice | Status | Where it stands |
|---|---|---|
| A — Grade 4-5 Physics flagship | **done** | Physics Adventures: two lessons, six waves, playable catalog to Evaluate. Forces with the push-pull lab and force arrows; electricity with tap-to-wire circuit building, the water-flow analogy, and the short-circuit warning. Every question is a manipulation. |
| B — Full curriculums | **in_progress** | Shipped: Physics G4-5, G6-8, G9-11 and O/L; Math Foundation (plan plus a built fractions lesson); ICT G6-8 with a real Python runner. Remaining: A/L physics, ICT G9-11 through A/L, and Math lessons 2 to 5. |
| C — Modular content architecture | **in_progress** | Blocks are typed, versioned and serializable. One manifest per course feeds the student player, the educator editor and the database seed. Remaining: retire the bespoke gears and maze wave pages. |
| D — Blob teacher + AI chat | **done** | Blob teacher dialog blocks are content, TTS-ready through `data-tts-text` and `dialogSpeechScript`. The resizable GSAP chat panel now reaches a student-only tutor endpoint with no authoring tools attached. |
| E — Interactive toolkit | **done** | Five manipulative question types, seven injectable scenes (force arrows, water flow, short circuit, fraction bar, lever balance, Ohm's law), six interactive learn labs, and a server-side Python sandbox for coding waves. |

## Verification gates

| Gate | Result |
|---|---|
| `bun run typecheck` | pass, 0 errors |
| `bun run test --run` | pass, 159 tests, up from 85 at the start |
| `bunx biome lint` on changed files | pass, no new errors. Pre-existing: 3 in `puck-config.tsx`, 2 in `courses.$courseId.tsx` |
| `make content-validate` | pass, 8 manifests valid |
| Playwright smoke | pass, 4/4 in `e2e/physics-demo.spec.ts` |
| Go tests | pass across every service, including the new `coderun`, `ask` and proxy suites |
| `make ci-local` | every code gate passes; stops at `helm-lint` because helm, kyverno, tofu and promtool are not installed locally. CI on the pull request covers those. |

## Content shipped

| Course | Grade | Waves | Built around |
|---|---|---|---|
| Physics Adventures | G4-5 | 6 | force lab, circuit lab, water flow, short circuit |
| Forces, Energy and Machines | G6-8 | 6 | lever balance, force lab |
| Electricity and Motion | G9-11 | 6 | Ohm's law bench, force lab |
| O/L Physics Revision | O/L | 6 | Ohm's law bench, lever lab, force lab |
| Math Foundation | G5 | 3 built, 4 lessons planned | fraction bar |
| Computers and Code | G6-8 | 6 | server-side Python runner |

## Decisions taken

- The Python interpreter runs **server side** in a sandboxed ai-service endpoint
  rather than shipping Pyodide to the browser.
- Slice B is built for **depth per grade band** rather than thin coverage of
  every grade.
- The pull request was opened once the demo path was verified, so CI covers the
  infrastructure gates this machine cannot run.

## Open defects

- **P2** Framer Motion logs `Only two keyframes currently supported with spring
  and inertia animations` on every authenticated page load. Pre-existing: a
  spring transition drives a multi-keyframe `y` array somewhere in the shell.
- **P2** The wave player still special-cases the gears and maze waves by id and
  by title substring. Slice C should replace both with typed blocks.
- **P3** No Sinhala copy yet for any of the new course content.

## Next slice planned

A/L physics, then the ICT ladder from G9-11 to A/L, then Math lessons 2 to 5.
After that, retiring the bespoke wave pages closes Slice C.
