import { describe, expect, it } from "vitest";
import {
  achievementStyle,
  computeProficiency,
  cumulativeXpForLevel,
  earnedCount,
  leaderboardDisplayName,
  levelFromXp,
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

describe("earnedCount", () => {
  // The unlock RULES moved to gamification-service; the frontend only counts
  // what the API says was unlocked. Testing rules here again is what let a
  // second, drifting copy of them exist.
  it("counts nothing when nothing is unlocked", () => {
    expect(earnedCount([{ unlocked: false }, { unlocked: false }])).toBe(0);
  });

  it("counts only the unlocked achievements", () => {
    expect(earnedCount([{ unlocked: true }, { unlocked: false }, { unlocked: true }])).toBe(2);
  });

  it("counts nothing for an empty catalog", () => {
    expect(earnedCount([])).toBe(0);
  });
});

describe("achievementStyle", () => {
  it("gives each known achievement its tier", () => {
    expect(achievementStyle("master").tier).toBe("purple");
    expect(achievementStyle("scholar").tier).toBe("gold");
    expect(achievementStyle("first_wave").tier).toBe("bronze");
  });

  it("falls back for an achievement the frontend has not seen", () => {
    // The server owns the catalog, so it can add one before the UI knows it.
    const style = achievementStyle("some_future_badge");
    expect(style.tier).toBe("bronze");
    expect(style.icon).toBe("trophy");
  });
});

describe("leaderboardDisplayName", () => {
  // Names arrive already masked from the gateway. This is a display guard.
  it("passes an already-masked name straight through", () => {
    expect(leaderboardDisplayName("Kavindi P.")).toBe("Kavindi P.");
  });

  it("never re-masks, which would strip the name twice", () => {
    expect(leaderboardDisplayName("Kavindi Perera")).toBe("Kavindi Perera");
  });

  it("falls back when a name is missing", () => {
    expect(leaderboardDisplayName("")).toBe("Student Scholar");
    expect(leaderboardDisplayName("   ")).toBe("Student Scholar");
    expect(leaderboardDisplayName(null)).toBe("Student Scholar");
    expect(leaderboardDisplayName(undefined)).toBe("Student Scholar");
  });
});

describe("rankBadgeGlyph", () => {
  it("returns the medal glyph keys for the top 3 ranks", () => {
    expect(rankBadgeGlyph(1)).toBe("medal-gold");
    expect(rankBadgeGlyph(2)).toBe("medal-silver");
    expect(rankBadgeGlyph(3)).toBe("medal-bronze");
  });

  it("returns a star for top 10 outside the podium", () => {
    expect(rankBadgeGlyph(10)).toBe("star");
  });

  it("returns a crown for the top 1 percent (beyond the top-10 star cutoff)", () => {
    expect(rankBadgeGlyph(50, 10000)).toBe("crown");
  });

  it("returns a gem for the top 10 percent (beyond the top 1 percent)", () => {
    expect(rankBadgeGlyph(500, 10000)).toBe("gem");
  });

  it("returns no glyph outside the top 10 percent", () => {
    expect(rankBadgeGlyph(5000, 10000)).toBe("");
  });
});
