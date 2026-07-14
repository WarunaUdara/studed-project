import { describe, expect, it } from "vitest";
import {
  computeBadges,
  computeProficiency,
  cumulativeXpForLevel,
  earnedCount,
  levelFromXp,
  privateLeaderboardName,
  rankBadgeGlyph,
} from "@/lib/gamification";

describe("levelFromXp", () => {
  it("starts at level 1 with 0 xp", () => {
    const info = levelFromXp(0);
    expect(info.level).toBe(1);
    expect(info.xpIntoLevel).toBe(0);
    expect(info.progress).toBe(0);
  });

  it("reaches level 2 exactly at the cumulative threshold", () => {
    expect(levelFromXp(99).level).toBe(1);
    expect(levelFromXp(100).level).toBe(2);
  });

  it("matches the documented cumulative curve for level 3 and level 5", () => {
    expect(cumulativeXpForLevel(3)).toBe(300);
    expect(cumulativeXpForLevel(5)).toBe(1000);
    expect(levelFromXp(300).level).toBe(3);
    expect(levelFromXp(1000).level).toBe(5);
  });

  it("computes progress within the current level", () => {
    // Level 2 spans xp 100..300 (200 xp wide). At 200 we're halfway.
    const info = levelFromXp(200);
    expect(info.level).toBe(2);
    expect(info.xpIntoLevel).toBe(100);
    expect(info.xpForNextLevel).toBe(200);
    expect(info.progress).toBeCloseTo(0.5);
  });

  it("clamps negative or fractional xp to a valid non-negative integer", () => {
    expect(levelFromXp(-50).level).toBe(1);
    expect(levelFromXp(150.9).xpIntoLevel).toBe(50);
  });
});

describe("computeProficiency", () => {
  it("is NOT_STARTED with no waves", () => {
    expect(computeProficiency([])).toBe("NOT_STARTED");
  });

  it("is IN_PROGRESS when not all waves are completed", () => {
    expect(
      computeProficiency([
        { status: "COMPLETED", highestScore: 100 },
        { status: "STARTED", highestScore: 50 },
      ]),
    ).toBe("IN_PROGRESS");
  });

  it("is EXPERT only when the average score is a perfect 100", () => {
    expect(
      computeProficiency([
        { status: "COMPLETED", highestScore: 100 },
        { status: "COMPLETED", highestScore: 100 },
      ]),
    ).toBe("EXPERT");
  });

  it("is PROFICIENT when the average score is at least 80 but below 100", () => {
    expect(
      computeProficiency([
        { status: "COMPLETED", highestScore: 90 },
        { status: "COMPLETED", highestScore: 80 },
      ]),
    ).toBe("PROFICIENT");
  });

  it("is COMPLETED when all waves pass but the average is below 80", () => {
    expect(
      computeProficiency([
        { status: "COMPLETED", highestScore: 60 },
        { status: "COMPLETED", highestScore: 70 },
      ]),
    ).toBe("COMPLETED");
  });
});

describe("computeBadges / earnedCount", () => {
  const baseInputs = {
    totalXp: 0,
    completedWaves: 0,
    hasPerfectScore: false,
    completedLessons: 0,
    proficientLessons: 0,
    completedCourses: 0,
  };

  it("earns no badges with no activity", () => {
    const badges = computeBadges(baseInputs);
    expect(earnedCount(badges)).toBe(0);
  });

  it("earns xp-milestone badges at the correct thresholds", () => {
    const badges = computeBadges({ ...baseInputs, totalXp: 2000 });
    const earnedIds = badges.filter((b) => b.earned).map((b) => b.id);
    expect(earnedIds).toContain("rising_star");
    expect(earnedIds).toContain("scholar");
    expect(earnedIds).not.toContain("master");
  });

  it("earns activity-based badges independently of xp", () => {
    const badges = computeBadges({
      ...baseInputs,
      completedWaves: 1,
      hasPerfectScore: true,
      completedCourses: 1,
    });
    const earnedIds = badges.filter((b) => b.earned).map((b) => b.id);
    expect(earnedIds).toEqual(
      expect.arrayContaining(["first_wave", "perfect_score", "first_course"]),
    );
  });
});

describe("privateLeaderboardName", () => {
  it("reduces a full name to first name + last initial", () => {
    expect(privateLeaderboardName("Kavindi Perera")).toBe("Kavindi P.");
  });

  it("leaves a single-word name unchanged", () => {
    expect(privateLeaderboardName("Kavindi")).toBe("Kavindi");
  });

  it("handles multi-word names by using the last word's initial", () => {
    expect(privateLeaderboardName("Anne Marie De Silva")).toBe("Anne S.");
  });
});

describe("rankBadgeGlyph", () => {
  it("returns the medal glyphs for the top 3 ranks", () => {
    expect(rankBadgeGlyph(1)).toBe("🥇");
    expect(rankBadgeGlyph(2)).toBe("🥈");
    expect(rankBadgeGlyph(3)).toBe("🥉");
  });

  it("returns a star for top 10 outside the podium", () => {
    expect(rankBadgeGlyph(10)).toBe("⭐");
  });

  it("returns a crown for the top 1 percent (beyond the top-10 star cutoff)", () => {
    expect(rankBadgeGlyph(50, 10000)).toBe("👑");
  });

  it("returns a gem for the top 10 percent (beyond the top 1 percent)", () => {
    expect(rankBadgeGlyph(500, 10000)).toBe("💎");
  });

  it("returns no glyph outside the top 10 percent", () => {
    expect(rankBadgeGlyph(5000, 10000)).toBe("");
  });
});
