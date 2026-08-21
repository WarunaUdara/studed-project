# StudEd Goal Loop Tracker

**Iterations completed**: 11  
**Branch**: `feature/physics-g4-5` (pull request #86 open against `main`)  
**Date**: 2026-08-20

---

## Slice status

| Slice | Status | Where it stands |
|---|---|---|
| A — Grade 4-5 Physics flagship | **done** | Physics Adventures: two lessons, six waves, playable catalog to Evaluate. Forces with the push-pull lab and force arrows; electricity with tap-to-wire circuit building, the water-flow analogy, and the short-circuit warning. Every question is a manipulation. |
| B — Full curriculums | **done** | Physics runs G4-5 to A/L (five courses). ICT runs G6-8 to A/L (four courses). Math Foundation ships the planned course with one built lesson, which is what the slice asked for. Scientific Thinking is now a manifest too: 13 courses validate. |
| C — Modular content architecture | **done** | Every wave renders from typed, versioned, serializable blocks through one manifest per course, shared by the student player, the educator editor and the seed. The gears and maze pages are retired: both are learn blocks now, the hardcoded science syllabus module is deleted, and the player has no branch that depends on which wave it is showing. |
| D — Blob teacher + AI chat | **done** | Blob teacher dialog blocks are content, TTS-ready through `data-tts-text` and `dialogSpeechScript`. The resizable GSAP chat panel now reaches a student-only tutor endpoint with no authoring tools attached. |
| E — Interactive toolkit | **done** | Five manipulative question types, seven injectable scenes (force arrows, water flow, short circuit, fraction bar, lever balance, Ohm's law), six interactive learn labs, and a server-side Python sandbox for coding waves. |

## Verification gates

| Gate | Result |
|---|---|
| `bun run typecheck` | pass, 0 errors |
| `bun run test --run` | pass, 161 tests, up from 85 at the start |
| `bunx biome lint` on changed files | pass, no new errors. Pre-existing: 3 in `puck-config.tsx`, 2 in `courses.$courseId.tsx` |
| `make content-validate` | pass, 13 manifests valid |
| Playwright smoke | pass, 5/5 in `e2e/physics-demo.spec.ts`. The first test of a run intermittently loses its worker (`worker process exited unexpectedly`) and passes on retry; it is a runner start-up flake, not an assertion failure. |
| `bun run loop` audit | **not completed on this machine.** Phase 0 discovery ran (26 routes); Phase 1 stalled part way through 12 student screens and was stopped after 35 minutes. One real cause is fixed in this branch: the snapshot phase signed in before installing the GraphQL mock, so an offline audit captured protected screens as logged-out redirects. Re-run it against a running stack before the next merge. |
| Go tests | pass across every service, including the new `coderun`, `ask` and proxy suites |
| `make ci-local` | every code gate passes; stops at `helm-lint` because helm, kyverno, tofu and promtool are not installed locally. |
| Pull request CI | **all green** on #86: frontend typecheck/test/build, Go tests, govulncheck, gitleaks, Bun audit, OpenTofu, k8s schema, helm lint, Kyverno, Cloudflare Pages, and every service image publish. |

## Content shipped

| Course | Grade | Waves | Built around |
|---|---|---|---|
| Physics Adventures | G4-5 | 6 | force lab, circuit lab, water flow, short circuit |
| Forces, Energy and Machines | G6-8 | 6 | lever balance, force lab |
| Electricity and Motion | G9-11 | 6 | Ohm's law bench, force lab |
| O/L Physics Revision | O/L | 6 | Ohm's law bench, lever lab, force lab |
| O/L Physics Revision | O/L | 6 | Ohm's law bench, lever lab, force lab |
| A/L Physics: Mechanics and Circuits | A/L | 6 | Ohm's law bench, formulas, reasoning questions |
| Math Foundation | G5 | 3 built, 4 lessons planned | fraction bar |
| Computers and Code | G6-8 | 7 | server-side Python runner, instruction maze |
| Computer Science Foundations | G9-11 | 6 | Python runner, search algorithms |
| O/L ICT Revision | O/L | 6 | Python runner, logic gate switches |
| A/L ICT: Structures and Systems | A/L | 6 | Python runner, recursion and sorting |
| Scientific Thinking | G9 | 5 | gear train puzzles as content blocks |

## Remaining before the definition of done

- **Seeding into the database.** `make content-sync` needs a running stack; the
  manifests validate but have not been pushed into a live backend from here.
- **The loop audit.** Still needs one clean run against a running stack.
- **Sinhala copy.** All 13 manifests are English only, and the i18n shape for
  block content is an open decision.

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

Sinhala content copy, once the i18n shape is decided, then a stack run to seed
the manifests and complete the loop audit.
