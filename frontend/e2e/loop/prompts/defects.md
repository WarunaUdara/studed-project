# Pass A: UI/UX Defect Audit and Critique Specification

This specification governs Pass A of the critique phase. Only defects identified in Pass A are eligible to enter Phase 4 (Fix).

---

## 1. Defect Severity Classification

### P0 (Critical / Blocker)
- Breaks core learning flows: student cannot navigate from Course -> Lesson -> Wave, cannot submit answers, or encounters a crash / blank screen.
- Total loss of accessibility: complete absence of keyboard focusability on critical buttons or complete contrast failure rendering text invisible.
- Broken authentication or authorization redirects preventing valid students/educators from accessing their workspace.

### P1 (Major Defect)
- Broken interaction: interactive element fails to respond, dropdown does not open, or modal cannot be dismissed.
- Visual token violation: hardcoded raw hex/rgb colors, invalid contrast ratio (< 4.5:1 for text), broken typography scale, or severe layout overlap/overflow.
- Copy defect: misleading, missing, or contradictory text in key user journeys.
- Gamification breakdown: XP toast fails to appear, progress ring does not increment, or confetti fires inappropriately.

### P2 (Minor / Polish Defect)
- Spacing rhythm inconsistency (> 4px deviation in repeated list/grid items).
- Subtle visual misalignments or missing transition states.
- Minor microcopy improvements or redundant secondary labels.

---

## 2. Defect Output Schema

Pass A must produce a strict JSON array of defect items with the following structure:

```json
[
  {
    "id": "DEF-001",
    "severity": "P0 | P1 | P2",
    "screen": "/courses/science-thinking",
    "component": "StudEdCourseTrackMap",
    "evidence": "Quoted exact DOM text, bounding box collisions, computed OKLCH styles, or audit failure line",
    "rootCause": "Technical explanation of why the defect occurs in the code",
    "suggestedFix": "Concrete, actionable instruction to resolve the defect in existing source files"
  }
]
```

## 3. Strict Rules for Defect Reporting
- Every claim must cite exact evidence from the text fingerprint or audit report (e.g., specific color values, bounding box dimensions, exact element IDs).
- Do not make subjective aesthetic judgments; evaluate strictly against WCAG 2.2 AA, OKLCH design system tokens, and functional integrity.
- Never propose creative feature additions in Pass A.
