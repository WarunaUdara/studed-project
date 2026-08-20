# StudEd UI/UX Principle Bank

This principle bank serves as the foundational standard for all UI/UX evaluations, audits, and critiques across the StudEd platform.

---

## 1. Cognitive Load (Sweller's Cognitive Load Theory)
- **Extraneous Load Elimination**: The UI must not compete with learning content. Every screen must have a singular primary focus.
- **Visual Clutter & Noise**: Avoid redundant badges, excessive borders, competing calls-to-action, or overly dense navigation bars.
- **Split-Attention Effect**: Instructions, interactive elements, and feedback mechanisms must be physically integrated, not separated across disconnected panels.
- **Signaling & Hierarchy**: Typography, color contrast, and whitespace must guide the student's eye directly to the next actionable step.

---

## 2. Effortless Flow (Zero Dead-Ends)
- **Continuous River**: The progression `Course -> Lesson -> Wave` must feel seamless and uninterrupted.
- **Next-Action Affordance**: Every screen must have an obvious, prominent forward action (e.g., "Start Evaluation", "Next Wave", "Continue Learning").
- **Back & Breadcrumb Navigation**: Clear, contextual back links ("< Basic Science", "< Course Map") must exist on every deep screen so the student never feels trapped.
- **Resumption**: Default state on dashboard and course pages must emphasize "Continue where you left off" with 1-click resumption.

---

## 3. Dopamine Loop & Gamification Honesty
- **Habit Loop Architecture**: `Cue -> Action -> Reward -> Investment`.
  1. *Cue*: Clear daily quest or next wave prompt.
  2. *Action*: Engaging in active problem-solving or reading.
  3. *Reward*: XP toast, streak preservation, level progression, confetti.
  4. *Investment*: Unlocking new wave pedestals, earning keys, climbing league standings.
- **Timing & Feedback Immediacy**: Rewards must fire within 800ms - 1200ms of successful completion.
- **Mastery Correlation**: Rewards must correspond to genuine effort and comprehension, never mindless clicking or passive scrolling.
- **Sound & Animation Discipline**: Confetti and synthesized Web Audio sounds must fire on genuine completion and respect `prefers-reduced-motion`.

---

## 4. Progression & The Progress Principle
- **Visible Milestones**: Break long courses into small, achievable waves (3-5 minutes each).
- **Competence & Momentum**: Celebrate small wins visibly. Show progress ring deltas, key unlocks, and level-up badges immediately upon completion.
- **Path Geography**: The vertical pedestal map must clearly delineate completed, current, key-gated, and locked states.

---

## 5. Student Safety & Emotional Design
- **Calm, Focused Environment**: Primary palette uses natural parchment backgrounds and calming emerald/forest tones (OKLCH Hue 145).
- **No Anxiety-Inducing Patterns**: Never use red/loss-framed copy for normal learning behaviors (e.g., avoid "You lost your streak forever").
- **Safe Reattempts**: Mistakes are part of learning. Offer clear, encouraging reset and retry paths with clear explanations.

---

## 6. Accessibility & Inclusivity (WCAG 2.2 AA)
- **Contrast Ratios**: Normal body text >= 4.5:1, large headings and interactive UI components >= 3:1 against their backgrounds.
- **Keyboard Operability**: Full navigation via Tab / Shift+Tab, Enter, Space, and Arrow keys with distinct `:focus-visible` outlines.
- **Semantic Structure**: Proper heading hierarchy (H1 -> H2 -> H3), explicit ARIA labels on icon buttons, and accessible form labels.
- **Motion Accessibility**: All animations and synthesized audio must gracefully respect user motion and sensory preferences.

---

## 7. Design System Consistency & Token Law
- **OKLCH Token System**: All colors must use tokens defined in `frontend/src/styles/index.css` (`--primary`, `--background`, `--foreground`, `--muted`, `--accent`, `--card`, `--border`, subject palettes).
- **Strict Token Pairing**: Any background token change must be accompanied by its corresponding foreground token (`--primary-foreground`, `--muted-foreground`, etc.).
- **Typography Scale**: Adhere strictly to the defined font families (IBM Plex Serif for headings, Inter for UI, JetBrains Mono for code) and scale.
- **Spatial Rhythm**: Standard 4px/8px grid system for margins, paddings, and component gaps.
