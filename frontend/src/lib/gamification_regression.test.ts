import { describe, expect, it } from "vitest";
import { cumulativeXpForLevel, levelFromXp, computeProficiency } from "./gamification";

describe("Gamification Regression Matrix", () => {
  it("validates cumulative XP bounds across level curve matrix", () => {
    const matrix = [
      { level: 1, expectedXp: 0 },
      { level: 2, expectedXp: 100 },
      { level: 3, expectedXp: 300 },
      { level: 4, expectedXp: 600 },
      { level: 5, expectedXp: 1000 },
      { level: 6, expectedXp: 1500 },
    ];

    for (const item of matrix) {
      expect(cumulativeXpForLevel(item.level)).toBe(item.expectedXp);
    }
  });

  it("evaluates level and progress calculation matrix for arbitrary XP", () => {
    const matrix = [
      { xp: -100, expectedLevel: 1, expectedProgress: 0 },
      { xp: 0, expectedLevel: 1, expectedProgress: 0 },
      { xp: 50, expectedLevel: 1, expectedProgress: 0.5 },
      { xp: 100, expectedLevel: 2, expectedProgress: 0 },
      { xp: 200, expectedLevel: 2, expectedProgress: 0.5 }, // 200 is halfway between L2 (100) and L3 (300)
      { xp: 1000, expectedLevel: 5, expectedProgress: 0 },
    ];

    for (const item of matrix) {
      const info = levelFromXp(item.xp);
      expect(info.level).toBe(item.expectedLevel);
      expect(info.progress).toBeCloseTo(item.expectedProgress, 2);
    }
  });

  it("validates computeProficiency regression matrix", () => {
    const matrix = [
      { waveStatuses: [], expected: "NOT_STARTED" },
      { waveStatuses: [{ status: "IN_PROGRESS", highestScore: 50 }], expected: "IN_PROGRESS" },
      { waveStatuses: [{ status: "COMPLETED", highestScore: 70 }], expected: "COMPLETED" },
      { waveStatuses: [{ status: "COMPLETED", highestScore: 85 }], expected: "PROFICIENT" },
      { waveStatuses: [{ status: "COMPLETED", highestScore: 100 }], expected: "EXPERT" },
    ];

    for (const item of matrix) {
      const level = computeProficiency(item.waveStatuses);
      expect(level).toBe(item.expected);
    }
  });
});
