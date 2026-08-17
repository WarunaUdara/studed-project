# Daily Spark Warmup & Streak Gamification Engine

## 1. Executive Summary & UX Philosophy

The **Daily Spark** is an onboarding and daily login warmup engine inspired by Brilliant and Duolingo. Before students enter the primary dashboard, they are presented with a focused, minimal, 3–4 task micro-challenge tailored to their enrolled courses (e.g., Fractions, Algebra, Geometry, Physics). 

Completing this short sequence triggers:
1. **Direct cognitive engagement** through hands-on geometric and conceptual manipulation.
2. **Instant visual & auditory feedback** with explanations (*"Why?"* button).
3. **Mascot Motivation Screen** featuring the 3D Blob companion celebrating progress with dynamic XP tallies.
4. **Daily Streak Celebration Screen** logging daily activity, awarding streak multipliers, and visualizing weekly consistency.
5. **Seamless transition** to the student dashboard with preserved state and updated XP.

---

## 2. User Journey & State Progression Matrix

```
[User Login / Warmup Trigger]
              │
              ▼
    ┌───────────────────┐
    │  Task 1 / 3       │ ──(Interactive Fraction: Color 1/4 of Triangle)──► [Check Selection]
    └───────────────────┘                                                          │
              ▲                                                                    ▼
      (Retry on Error) ◄─────────────────────────────────────────────────── [Correct: +15 XP]
              │                                                                    │
              ▼                                                                    ▼
    ┌───────────────────┐                                                 ┌───────────────────┐
    │  Task 2 / 3       │ ──(Interactive Fraction: Color 2/4 of Triangle)──► [Correct: +20 XP]│
    └───────────────────┘                                                 └───────────────────┘
              │                                                                    │
              ▼                                                                    ▼
    ┌───────────────────┐                                                 ┌───────────────────┐
    │  Task 3 / 3       │ ──(Interactive Fraction: Color 3/4 of Triangle)──► [Correct: +20 XP]│
    └───────────────────┘                                                 └───────────────────┘
              │
              ▼
    ┌────────────────────────────────────────────────────────┐
    │  Screen 4: Blob Mascot Motivation ("Perfect! 55 XP")   │
    └────────────────────────────────────────────────────────┘
              │
              ▼
    ┌────────────────────────────────────────────────────────┐
    │  Screen 5: Streak Celebration ("1 · A streak is born!")│
    └────────────────────────────────────────────────────────┘
              │
              ▼
    ┌────────────────────────────────────────────────────────┐
    │  Student Dashboard (/dashboard) with Updated Stats     │
    └────────────────────────────────────────────────────────┘
```

---

## 3. Dynamic Geometric Fraction Algorithm

The geometric fraction task challenges students to color a specific fractional area (e.g., $\frac{1}{4}, \frac{2}{4}, \frac{3}{4}$) of a large equilateral triangle.

### Geometric Coordinate Breakdown (Normalized Base $W=400, H=346.41$)

The master triangle $T$ with vertices $V_0 = (200, 20)$, $V_1 = (20, 331.77)$, $V_2 = (380, 331.77)$ is partitioned into sub-polygons:

```
                  V0 (200, 20)
                       /\
                      /  \
                     / P1 \  <--- Area = 1/4 (25%)
                    /______\
        M0 (110, 175.9)     M1 (290, 175.9)
              /\     \      /\
             /  \     \    /  \
            / P2a\ P2b \  / P4 \  <--- P4: Area = 1/4 (25%)
           /______\_____\/______\
   V1 (20, 331.8)       M2 (200, 331.8)     V2 (380, 331.8)
       [P2a = 1/8] [P2b = 1/8]   [P3 = 1/4 (Inverted Center)]
```

### Partition Area Mapping:
1. **$P_1$ (Top Triangle)**: Vertices `[(200,20), (110,175.88), (290,175.88)]` $\to \text{Area} = 0.25$ ($\frac{1}{4}$).
2. **$P_3$ (Center Inverted)**: Vertices `[(110,175.88), (290,175.88), (200,331.77)]` $\to \text{Area} = 0.25$ ($\frac{1}{4}$).
3. **$P_4$ (Bottom-Right Triangle)**: Vertices `[(290,175.88), (200,331.77), (380,331.77)]` $\to \text{Area} = 0.25$ ($\frac{1}{4}$).
4. **$P_{2a}$ (Bottom-Left Outer)**: Vertices `[(20,331.77), (110,175.88), (110,331.77)]` $\to \text{Area} = 0.125$ ($\frac{1}{8}$).
5. **$P_{2b}$ (Bottom-Left Inner)**: Vertices `[(110,175.88), (110,331.77), (200,331.77)]` $\to \text{Area} = 0.125$ ($\frac{1}{8}$).

### Dynamic Evaluation Rule:
Given a target fraction $F_{\text{target}}$ (e.g. $0.25$ for $\frac{1}{4}$):
$$\sum_{i \in \text{Selected}} \text{Area}(P_i) \stackrel{?}{=} F_{\text{target}}$$
* Tolerates floating-point epsilon $|\sum \text{Area} - F_{\text{target}}| < 0.001$.
* **Permutational Flexibility**: Selecting $P_1$, $P_3$, $P_4$, or $\{P_{2a}, P_{2b}\}$ are all mathematically correct solutions for $\frac{1}{4}$!

---

## 4. UI/UX Aesthetic Standards

### 4.1. Color Tokens & Dark Canvas
* **Canvas Fill**: `#0c0d0e` with centered frosted card `#141518`.
* **Sub-polygon Unselected Fill**: `#2c3038` with `#525866` border.
* **Sub-polygon Hover Fill**: `#3b4252`.
* **Sub-polygon Selected Fill**: `#2563eb` (Vibrant Royal Blue) with `#93c5fd` highlight outline.
* **Correct State Glowing Border**: `ring-1 ring-emerald-500 border-emerald-500/80` with emerald ambient bloom.
* **CTA Button**: Emerald pill `bg-emerald-500 hover:bg-emerald-400 text-white font-semibold shadow-lg shadow-emerald-500/25`.

### 4.2. Animation Choreography (Framer Motion)
* **Step Transition**: Slide-fade horizontal transition between tasks ($x: 24 \to 0$, opacity $0 \to 1$).
* **Confetti Explosion**: Lightweight SVG confetti fountain upon correct submission.
* **Mascot Bounce**: Gentle 3D spring float and scale-in for the celebration screens.
* **Streak Lighting**: High-intensity radial glow and glowing lightning emblem with weekly calendar dots.

---

## 5. Implementation Roadmap

1. **Audio Synthesis & Confetti Utility**: Integrated Web Audio chimes for *Correct*, *Click*, and *Level Up*.
2. **Interactive Fraction Component (`FractionTriangleChallenge.tsx`)**: SVG polygon interactive mesh with area calculator.
3. **Daily Spark Wizard (`DailySparkModal.tsx` / `DailySparkScreen.tsx`)**:
   - Manages task queue, top progress bar, and cumulative XP counter.
   - Renders task cards with "Why?" explanation dialogs.
4. **Mascot Motivation Screen (`DailySparkCelebration.tsx`)**:
   - 3D blob lifting weights / cheering.
   - Total session XP breakdown.
5. **Streak Born Screen (`DailySparkStreak.tsx`)**:
   - Big 3D golden lightning badge with peeking blob mascot.
   - Weekly calendar day indicators (M, T, W, T, F, S, S).
6. **Integration**:
   - Connected to student login, dashboard widget, and `/dashboard` entry point.
   - Full TypeScript and Vitest test suites.
