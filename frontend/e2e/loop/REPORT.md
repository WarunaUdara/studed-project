# StudEd UI/UX Self-Evaluating Loop — Iteration 1 Report

**Generated At**: 2026-08-21T05:45:20.819Z  
**Status**: Completed Phase 0 (Discover), Phase 1 (Snapshot), Phase 2 (Audit), Phase 3 (Critique)

---

## Executive Summary

- **Total Deterministic Faults**: 166
- **P0 Critical Defects**: 59
- **P1 Visual / Interaction Defects**: 85
- **P2 Polish / Spacing Defects**: 22
- **Dark Pattern Flags (Pass B)**: 6
- **Creative Backlog Suggestions (Pass C)**: 2

---

## Section 1: Pass A — Defects (Fix Loop Candidate)

| Severity | Screen | Root Cause / Fault | Suggested Fix |
|---|---|---|---|
| **P0** | `/subscription` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P0** | `/courses/fractions` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "Courses" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.1). |
| **P1** | `/courses/fractions` | Insufficient WCAG 2.2 contrast (3.60:1 < 4.5:1) on "Go Premium" | Adjust color token to exceed 4.5:1 against oklab(0.769 0.0640531 0.176752 / 0.1). |
| **P0** | `/courses/fractions` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P0** | `/courses/science-thinking` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P1** | `/courses/science-thinking` | Interactive <button> has no accessible name or aria-label. | Add aria-label="..." or accessible text inside the interactive element. |
| **P1** | `/courses/science-thinking` | Interactive <button> has no accessible name or aria-label. | Add aria-label="..." or accessible text inside the interactive element. |
| **P1** | `/courses/science-thinking` | Interactive <button> has no accessible name or aria-label. | Add aria-label="..." or accessible text inside the interactive element. |
| **P1** | `/courses/science-thinking` | Interactive <button> has no accessible name or aria-label. | Add aria-label="..." or accessible text inside the interactive element. |
| **P1** | `/courses/science-thinking` | Interactive <button> has no accessible name or aria-label. | Add aria-label="..." or accessible text inside the interactive element. |
| **P0** | `/courses/logic-structures` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "Courses" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.1). |
| **P1** | `/courses/logic-structures` | Insufficient WCAG 2.2 contrast (3.60:1 < 4.5:1) on "Go Premium" | Adjust color token to exceed 4.5:1 against oklab(0.769 0.0640531 0.176752 / 0.1). |
| **P0** | `/courses/logic-structures` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P0** | `/courses` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P1** | `/courses` | Element overflows viewport horizontally (435px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (605px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (733px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (401px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (401px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (401px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (401px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (591px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (591px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (781px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (781px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (971px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (971px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (1161px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (1161px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (1351px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (1351px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (401px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (401px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P0** | `/courses/fractions` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P0** | `/courses` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "Courses" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.1). |
| **P1** | `/courses` | Insufficient WCAG 2.2 contrast (3.60:1 < 4.5:1) on "Go Premium" | Adjust color token to exceed 4.5:1 against oklab(0.769 0.0640531 0.176752 / 0.1). |
| **P0** | `/courses` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P1** | `/courses` | Element overflows viewport horizontally (1297px > 1280px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (1297px > 1280px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (1507px > 1280px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (1507px > 1280px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P0** | `/achievements` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P2** | `/achievements` | Color hue (27) deviates from the OKLCH design system tokens. | Replace with semantic design system tokens (--primary, --science, --commerce, --gold). |
| **P2** | `/achievements` | Color hue (27) deviates from the OKLCH design system tokens. | Replace with semantic design system tokens (--primary, --science, --commerce, --gold). |
| **P2** | `/achievements` | Color hue (27) deviates from the OKLCH design system tokens. | Replace with semantic design system tokens (--primary, --science, --commerce, --gold). |
| **P0** | `/courses/thinking-in-python` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "Courses" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.1). |
| **P1** | `/courses/thinking-in-python` | Insufficient WCAG 2.2 contrast (3.60:1 < 4.5:1) on "Go Premium" | Adjust color token to exceed 4.5:1 against oklab(0.769 0.0640531 0.176752 / 0.1). |
| **P0** | `/courses/thinking-in-python` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P0** | `/dashboard` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P1** | `/dashboard` | Interactive <a> has no accessible name or aria-label. | Add aria-label="..." or accessible text inside the interactive element. |
| **P0** | `/leaderboard` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "Leagues" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.1). |
| **P1** | `/leaderboard` | Insufficient WCAG 2.2 contrast (3.60:1 < 4.5:1) on "Go Premium" | Adjust color token to exceed 4.5:1 against oklab(0.769 0.0640531 0.176752 / 0.1). |
| **P0** | `/leaderboard` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P2** | `/leaderboard` | Color hue (27) deviates from the OKLCH design system tokens. | Replace with semantic design system tokens (--primary, --science, --commerce, --gold). |
| **P0** | `/courses/thinking-in-python` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P1** | `/achievements` | Insufficient WCAG 2.2 contrast (3.60:1 < 4.5:1) on "Go Premium" | Adjust color token to exceed 4.5:1 against oklab(0.769 0.0640531 0.176752 / 0.1). |
| **P0** | `/achievements` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P2** | `/achievements` | Color hue (27) deviates from the OKLCH design system tokens. | Replace with semantic design system tokens (--primary, --science, --commerce, --gold). |
| **P2** | `/achievements` | Color hue (27) deviates from the OKLCH design system tokens. | Replace with semantic design system tokens (--primary, --science, --commerce, --gold). |
| **P2** | `/achievements` | Color hue (27) deviates from the OKLCH design system tokens. | Replace with semantic design system tokens (--primary, --science, --commerce, --gold). |
| **P0** | `/courses/science-thinking` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "Courses" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.1). |
| **P1** | `/courses/science-thinking` | Insufficient WCAG 2.2 contrast (3.60:1 < 4.5:1) on "Go Premium" | Adjust color token to exceed 4.5:1 against oklab(0.769 0.0640531 0.176752 / 0.1). |
| **P0** | `/courses/science-thinking` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P1** | `/courses/science-thinking` | Interactive <button> has no accessible name or aria-label. | Add aria-label="..." or accessible text inside the interactive element. |
| **P1** | `/courses/science-thinking` | Interactive <button> has no accessible name or aria-label. | Add aria-label="..." or accessible text inside the interactive element. |
| **P1** | `/courses/science-thinking` | Interactive <button> has no accessible name or aria-label. | Add aria-label="..." or accessible text inside the interactive element. |
| **P1** | `/courses/science-thinking` | Interactive <button> has no accessible name or aria-label. | Add aria-label="..." or accessible text inside the interactive element. |
| **P1** | `/courses/science-thinking` | Interactive <button> has no accessible name or aria-label. | Add aria-label="..." or accessible text inside the interactive element. |
| **P0** | `/leaderboard` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P1** | `/leaderboard` | Element overflows viewport horizontally (443px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P2** | `/leaderboard` | Color hue (27) deviates from the OKLCH design system tokens. | Replace with semantic design system tokens (--primary, --science, --commerce, --gold). |
| **P1** | `/settings` | Insufficient WCAG 2.2 contrast (3.60:1 < 4.5:1) on "Go Premium" | Adjust color token to exceed 4.5:1 against oklab(0.769 0.0640531 0.176752 / 0.1). |
| **P0** | `/settings` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P0** | `/settings` | Insufficient WCAG 2.2 contrast (1.17:1 < 4.5:1) on "Free Preview · Manage plan Upg" | Adjust color token to exceed 4.5:1 against oklab(0.95 -0.0122873 0.00860365 / 0.5). |
| **P2** | `/settings` | Body text font size (10px) is below the 11px accessibility threshold. | Scale font size up to minimum 12px or use standard text-xs (12px). |
| **P2** | `/settings` | Body text font size (10px) is below the 11px accessibility threshold. | Scale font size up to minimum 12px or use standard text-xs (12px). |
| **P0** | `/waves/science-thinking-l1-w1` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P1** | `/waves/science-gears-1` | Insufficient WCAG 2.2 contrast (3.60:1 < 4.5:1) on "Go Premium" | Adjust color token to exceed 4.5:1 against oklab(0.769 0.0640531 0.176752 / 0.1). |
| **P0** | `/waves/science-gears-1` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P2** | `/waves/science-gears-1` | Color hue (27) deviates from the OKLCH design system tokens. | Replace with semantic design system tokens (--primary, --science, --commerce, --gold). |
| **P0** | `/courses/logic-structures` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P0** | `/settings` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P0** | `/settings` | Insufficient WCAG 2.2 contrast (1.17:1 < 4.5:1) on "Free Preview · Manage plan Upg" | Adjust color token to exceed 4.5:1 against oklab(0.95 -0.0122873 0.00860365 / 0.5). |
| **P2** | `/settings` | Body text font size (10px) is below the 11px accessibility threshold. | Scale font size up to minimum 12px or use standard text-xs (12px). |
| **P2** | `/settings` | Body text font size (10px) is below the 11px accessibility threshold. | Scale font size up to minimum 12px or use standard text-xs (12px). |
| **P0** | `/waves/science-gears-1` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P2** | `/waves/science-gears-1` | Color hue (27) deviates from the OKLCH design system tokens. | Replace with semantic design system tokens (--primary, --science, --commerce, --gold). |
| **P1** | `/subscription` | Insufficient WCAG 2.2 contrast (3.60:1 < 4.5:1) on "Go Premium" | Adjust color token to exceed 4.5:1 against oklab(0.769 0.0640531 0.176752 / 0.1). |
| **P0** | `/subscription` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P1** | `/waves/science-thinking-l1-w1` | Insufficient WCAG 2.2 contrast (3.60:1 < 4.5:1) on "Go Premium" | Adjust color token to exceed 4.5:1 against oklab(0.769 0.0640531 0.176752 / 0.1). |
| **P0** | `/waves/science-thinking-l1-w1` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P0** | `/dashboard` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "Quests" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.1). |
| **P1** | `/dashboard` | Insufficient WCAG 2.2 contrast (3.60:1 < 4.5:1) on "Go Premium" | Adjust color token to exceed 4.5:1 against oklab(0.769 0.0640531 0.176752 / 0.1). |
| **P0** | `/dashboard` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P1** | `/dashboard` | Interactive <a> has no accessible name or aria-label. | Add aria-label="..." or accessible text inside the interactive element. |
| **P0** | `/subscription` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P0** | `/courses/fractions` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "Courses" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.1). |
| **P1** | `/courses/fractions` | Insufficient WCAG 2.2 contrast (3.60:1 < 4.5:1) on "Go Premium" | Adjust color token to exceed 4.5:1 against oklab(0.769 0.0640531 0.176752 / 0.1). |
| **P0** | `/courses/fractions` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P1** | `/` | Insufficient WCAG 2.2 contrast (3.60:1 < 4.5:1) on "Go Premium" | Adjust color token to exceed 4.5:1 against oklab(0.769 0.0640531 0.176752 / 0.1). |
| **P0** | `/` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P0** | `/courses/logic-structures` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "Courses" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.1). |
| **P1** | `/courses/logic-structures` | Insufficient WCAG 2.2 contrast (3.60:1 < 4.5:1) on "Go Premium" | Adjust color token to exceed 4.5:1 against oklab(0.769 0.0640531 0.176752 / 0.1). |
| **P0** | `/courses/logic-structures` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P0** | `/courses` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P1** | `/courses` | Element overflows viewport horizontally (435px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (605px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (733px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (401px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (401px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (401px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (401px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (591px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (591px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (781px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (781px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (971px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (971px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (1161px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (1161px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (1351px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (1351px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (401px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (401px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P0** | `/pricing` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P0** | `/courses/fractions` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P0** | `/courses` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "Courses" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.1). |
| **P1** | `/courses` | Insufficient WCAG 2.2 contrast (3.60:1 < 4.5:1) on "Go Premium" | Adjust color token to exceed 4.5:1 against oklab(0.769 0.0640531 0.176752 / 0.1). |
| **P0** | `/courses` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P1** | `/courses` | Element overflows viewport horizontally (1297px > 1280px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (1297px > 1280px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (1507px > 1280px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/courses` | Element overflows viewport horizontally (1507px > 1280px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P0** | `/achievements` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P2** | `/achievements` | Color hue (27) deviates from the OKLCH design system tokens. | Replace with semantic design system tokens (--primary, --science, --commerce, --gold). |
| **P2** | `/achievements` | Color hue (27) deviates from the OKLCH design system tokens. | Replace with semantic design system tokens (--primary, --science, --commerce, --gold). |
| **P2** | `/achievements` | Color hue (27) deviates from the OKLCH design system tokens. | Replace with semantic design system tokens (--primary, --science, --commerce, --gold). |
| **P0** | `/courses/thinking-in-python` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "Courses" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.1). |
| **P1** | `/courses/thinking-in-python` | Insufficient WCAG 2.2 contrast (3.60:1 < 4.5:1) on "Go Premium" | Adjust color token to exceed 4.5:1 against oklab(0.769 0.0640531 0.176752 / 0.1). |
| **P0** | `/courses/thinking-in-python` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P0** | `/dashboard` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P1** | `/dashboard` | Interactive <a> has no accessible name or aria-label. | Add aria-label="..." or accessible text inside the interactive element. |
| **P0** | `/leaderboard` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "Leagues" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.1). |
| **P1** | `/leaderboard` | Insufficient WCAG 2.2 contrast (3.60:1 < 4.5:1) on "Go Premium" | Adjust color token to exceed 4.5:1 against oklab(0.769 0.0640531 0.176752 / 0.1). |
| **P0** | `/leaderboard` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P2** | `/leaderboard` | Color hue (27) deviates from the OKLCH design system tokens. | Replace with semantic design system tokens (--primary, --science, --commerce, --gold). |
| **P1** | `/pricing` | Insufficient WCAG 2.2 contrast (3.60:1 < 4.5:1) on "Go Premium" | Adjust color token to exceed 4.5:1 against oklab(0.769 0.0640531 0.176752 / 0.1). |
| **P0** | `/pricing` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P0** | `/courses/thinking-in-python` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P1** | `/achievements` | Insufficient WCAG 2.2 contrast (3.60:1 < 4.5:1) on "Go Premium" | Adjust color token to exceed 4.5:1 against oklab(0.769 0.0640531 0.176752 / 0.1). |
| **P0** | `/achievements` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P2** | `/achievements` | Color hue (27) deviates from the OKLCH design system tokens. | Replace with semantic design system tokens (--primary, --science, --commerce, --gold). |
| **P2** | `/achievements` | Color hue (27) deviates from the OKLCH design system tokens. | Replace with semantic design system tokens (--primary, --science, --commerce, --gold). |
| **P2** | `/achievements` | Color hue (27) deviates from the OKLCH design system tokens. | Replace with semantic design system tokens (--primary, --science, --commerce, --gold). |
| **P0** | `/leaderboard` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P1** | `/leaderboard` | Element overflows viewport horizontally (443px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P2** | `/leaderboard` | Color hue (27) deviates from the OKLCH design system tokens. | Replace with semantic design system tokens (--primary, --science, --commerce, --gold). |
| **P0** | `/courses/logic-structures` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P0** | `/` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P1** | `/` | Element overflows viewport horizontally (415px > 390px) | Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling. |
| **P1** | `/subscription` | Insufficient WCAG 2.2 contrast (3.60:1 < 4.5:1) on "Go Premium" | Adjust color token to exceed 4.5:1 against oklab(0.769 0.0640531 0.176752 / 0.1). |
| **P0** | `/subscription` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P0** | `/dashboard` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "Quests" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.1). |
| **P1** | `/dashboard` | Insufficient WCAG 2.2 contrast (3.60:1 < 4.5:1) on "Go Premium" | Adjust color token to exceed 4.5:1 against oklab(0.769 0.0640531 0.176752 / 0.1). |
| **P0** | `/dashboard` | Insufficient WCAG 2.2 contrast (1.38:1 < 4.5:1) on "D" | Adjust color token to exceed 4.5:1 against oklab(0.484 -0.134341 0.0940665 / 0.2). |
| **P1** | `/dashboard` | Interactive <a> has no accessible name or aria-label. | Add aria-label="..." or accessible text inside the interactive element. |

---

## Section 2: Pass B — Dark Pattern & Dopamine Honesty Audit

### Reattempt Safety & Low-Anxiety Practice (missing-healthy)
- **Screen**: `/waves/science-thinking-l1-w1`
- **Description**: Wave puzzle interface allows repeatable simulation attempts without penalty.
- **Verdict**: **SERVES — Encourages experimentation, exploratory physics, and fearless mastery.**
- **Recommendation**: Preserve immediate mechanical reset button without deducting Explorer XP.

### Transparent XP Milestone Reward (missing-healthy)
- **Screen**: `/waves/science-thinking-l1-w1`
- **Description**: XP awards fire in direct correlation with problem-solving milestones.
- **Verdict**: **SERVES — Reinforces genuine conceptual comprehension through instant multi-sensory feedback.**
- **Recommendation**: Ensure toast animation duration remains under 1200ms to avoid blocking navigation.

### Reattempt Safety & Low-Anxiety Practice (missing-healthy)
- **Screen**: `/waves/science-gears-1`
- **Description**: Wave puzzle interface allows repeatable simulation attempts without penalty.
- **Verdict**: **SERVES — Encourages experimentation, exploratory physics, and fearless mastery.**
- **Recommendation**: Preserve immediate mechanical reset button without deducting Explorer XP.

### Reattempt Safety & Low-Anxiety Practice (missing-healthy)
- **Screen**: `/waves/science-gears-1`
- **Description**: Wave puzzle interface allows repeatable simulation attempts without penalty.
- **Verdict**: **SERVES — Encourages experimentation, exploratory physics, and fearless mastery.**
- **Recommendation**: Preserve immediate mechanical reset button without deducting Explorer XP.

### Reattempt Safety & Low-Anxiety Practice (missing-healthy)
- **Screen**: `/waves/science-thinking-l1-w1`
- **Description**: Wave puzzle interface allows repeatable simulation attempts without penalty.
- **Verdict**: **SERVES — Encourages experimentation, exploratory physics, and fearless mastery.**
- **Recommendation**: Preserve immediate mechanical reset button without deducting Explorer XP.

### Transparent XP Milestone Reward (missing-healthy)
- **Screen**: `/waves/science-thinking-l1-w1`
- **Description**: XP awards fire in direct correlation with problem-solving milestones.
- **Verdict**: **SERVES — Reinforces genuine conceptual comprehension through instant multi-sensory feedback.**
- **Recommendation**: Ensure toast animation duration remains under 1200ms to avoid blocking navigation.

---

## Section 3: Pass C — Creative & Pedagogical Backlog (Human Gate Required)

### Interactive Helmet Companion Haptic Celebration (`delight`)
- **Target Screen**: `/waves/$waveId`
- **Description**: When solving a 7-gear cluster network wave on mobile, trigger subtle Web Haptic vibration and animated helmet bounce.
- **Pedagogical Rationale**: Strengthens the multi-sensory dopamine release upon completing complex kinetic physics challenges.
- **Human Approval**: Mandatory prior to coding.

### Bilingual Step-by-Step Voice Guidance Toggle (`pedagogy`)
- **Target Screen**: `/courses/$courseId`
- **Description**: Provide optional Sinhala voiceover explanations for scientific parity and gear mechanical principles.
- **Pedagogical Rationale**: Lowers cognitive barrier for young Grade 6-9 students learning kinematic mechanics for the first time.
- **Human Approval**: Mandatory prior to coding.

---

## Phase 6: Human Gate & Next Steps

1. **Review Pass A Defects**: Address top P0/P1 contrast and aria-label improvements.
2. **Review Pass C Proposals**: Select backlog items for future sprints.
