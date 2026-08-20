# Dark-Pattern Taxonomy and Evaluation Framework

This document defines the criteria for Pass B (Dark-Pattern Audit). Every pattern evaluated must undergo the Serves vs Exploits test.

---

## 1. Exploitative Patterns (Must be Detected and Flagged)

### A. Deception
- **Misleading Labels**: Action buttons that disguise their actual outcome (e.g., a button labeled "Continue" that actually enrolls or charges).
- **Hidden Prerequisites**: Concealing requirements, key costs, or subscription requirements until the student has invested significant time.
- **Fake Scarcity & Social Proof**: Fabricated participant counters, false countdowns, or synthetic notifications claiming urgency.

### B. Forced Action & Obstruction
- **Misleading Paywalls**: Gating free educational content behind subscription prompts or misrepresenting free trial mechanics.
- **Roach Motel / Difficult Exit**: Easy to start an action or modal, but difficult or confusing to close, back out, or pause.
- **Pre-checked Defaults**: Pre-selecting high-commitment options without student consent.

### C. Manufactured Urgency & Time Pressure
- **Artificial Countdowns**: Timer mechanisms that reset automatically or induce stress without pedagogical justification.
- **False Limited-Time Offers**: Claiming discounts or bonuses will expire when they are evergreen.

### D. Sunk-Cost Traps & Loss Framing
- **Coercive Streak Mechanics**: Threatening streak loss to coerce logins without pedagogical value.
- **Punitive Retries**: Deducting existing XP, shaming mistakes, or locking accounts after incorrect answers.

### E. Dark Nudges & Emotional Manipulation
- **Confirmshaming**: Opt-out or cancel copy that demeans the student (e.g., "No, I don't want to succeed").
- **Forced Social Sharing**: Requiring social invites or posts to unlock learning material.

### F. Dopamine Farming & Meaningless Motion
- **Gratuitous Gamification**: Firing confetti and awarding large XP quantities for superficial actions (e.g., scrolling, viewing an index page).
- **Demoralizing Leaderboards**: Presenting rankings in a manner that isolates struggling students rather than celebrating personal growth.

---

## 2. Healthy Motivational Patterns (Must be Ensured and Verified)

### A. Clear Progress Visibility
- Honest, accurate percentage and count metrics for courses, lessons, and waves.
- Clear distinction between completed, current, key-gated, and locked modules.

### B. Constructive Mastery Feedback
- Immediate, positive, and explanatory feedback upon submitting answers.
- Clear breakdowns of earned XP and score thresholds.

### C. Psychological Safety & Reattempt Integrity
- Encouraging retry mechanics with clear explanations for incorrect answers.
- Clear reset mechanisms for wave attempts without penalty.

### D. Honest Reward Distribution
- XP and streak increments are directly tied to learning activities and cognitive effort.

### E. Student Autonomy
- Students can pause, save progress, navigate between lessons, and inspect syllabus depth at will without anxiety.

---

## 3. The Serves vs Exploits Test

For every identified pattern, the auditor must apply the following test:

> **The Serves vs Exploits Test:**
> *"Does this pattern increase the student's genuine comprehension, autonomy, or healthy motivation (serves)? Or does it manipulate behavior/attention for retention metrics at the student's expense (exploits)?"*

### Verdict Specification:
- **Verdict**: `SERVES` or `EXPLOITS`
- **Rationale**: Exactly one concise sentence explaining why the pattern serves student growth or exploits behavior.
