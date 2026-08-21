import { describe, expect, it } from "vitest";
import { buildDemoLeaderboard, SEEDED_STUDENTS, SRI_LANKAN_SCHOOLS } from "@/lib/demoData";
import {
  getLeagueInfo,
  LEAGUE_TIERS,
  privateLeaderboardName,
  rankBadgeGlyph,
  rankMedal,
} from "@/lib/gamification";

describe("Gamification & Leaderboard System", () => {
  describe("League Tiers", () => {
    it("assigns correct league tier based on XP", () => {
      expect(getLeagueInfo(0).tier).toBe("HYDROGEN");
      expect(getLeagueInfo(450).tier).toBe("HYDROGEN");
      expect(getLeagueInfo(1000).tier).toBe("LITHIUM");
      expect(getLeagueInfo(2499).tier).toBe("LITHIUM");
      expect(getLeagueInfo(2500).tier).toBe("CARBON");
      expect(getLeagueInfo(4999).tier).toBe("CARBON");
      expect(getLeagueInfo(5000).tier).toBe("TITANIUM");
      expect(getLeagueInfo(9999).tier).toBe("TITANIUM");
      expect(getLeagueInfo(10000).tier).toBe("QUANTUM");
      expect(getLeagueInfo(50000).tier).toBe("QUANTUM");
    });

    it("has valid metadata for all 5 tiers", () => {
      const tiers = ["HYDROGEN", "LITHIUM", "CARBON", "TITANIUM", "QUANTUM"] as const;
      for (const tier of tiers) {
        const meta = LEAGUE_TIERS[tier];
        expect(meta).toBeDefined();
        expect(meta.name).toContain("League");
        expect(meta.promotionCutoff).toBeGreaterThan(0);
        expect(meta.badgeBg).toBeDefined();
      }
    });
  });

  describe("Seeded Student Cohort & buildDemoLeaderboard", () => {
    it("contains 50 unique Sri Lankan seeded students", () => {
      expect(SEEDED_STUDENTS.length).toBe(50);
      const uniqueIds = new Set(SEEDED_STUDENTS.map((s) => s.id));
      expect(uniqueIds.size).toBe(50);
      for (const student of SEEDED_STUDENTS) {
        expect(student.fullName.length).toBeGreaterThan(3);
        expect(SRI_LANKAN_SCHOOLS).toContain(student.school);
        expect(student.baseXp).toBeGreaterThan(0);
      }
    });

    it("builds a sorted leaderboard placing the active user accurately", () => {
      const youId = "my-test-user-id";
      const youXp = 5400; // Between stu-015 (5620) and stu-016 (5310)
      const youName = "Nuwan Kumara";

      const list = buildDemoLeaderboard(youId, youXp, youName, "GLOBAL");
      expect(list.length).toBe(51);

      // Verify sorted strictly descending by totalXp
      for (let i = 0; i < list.length - 1; i++) {
        expect(list[i].totalXp).toBeGreaterThanOrEqual(list[i + 1].totalXp);
        expect(list[i].rank).toBe(i + 1);
      }

      // Verify you are in the list at correct rank
      const youEntry = list.find((e) => e.user.id === youId);
      expect(youEntry).toBeDefined();
      expect(youEntry?.totalXp).toBe(5400);
      expect(youEntry?.user.fullName).toBe("Nuwan Kumara");
    });

    it("adjusts XP scale for weekly and grade scopes", () => {
      const globalList = buildDemoLeaderboard("test", 500, "Test", "GLOBAL");
      const weeklyList = buildDemoLeaderboard("test", 500, "Test", "WEEKLY");
      expect(weeklyList[0].totalXp).toBeLessThan(globalList[0].totalXp);
    });
  });

  describe("Privacy & Name Formatting", () => {
    it("formats full names into private 'Firstname Initial.' format", () => {
      expect(privateLeaderboardName("Senuri Wickramasinghe")).toBe("Senuri W.");
      expect(privateLeaderboardName("Kavindu Jayawardena")).toBe("Kavindu J.");
      expect(privateLeaderboardName("Dinuka")).toBe("Dinuka");
      expect(privateLeaderboardName("")).toBe("Student Scholar");
      // Raw UUIDs
      expect(privateLeaderboardName("123e4567-e89b-12d3-a456-426614174000")).toBe("Student Scholar");
    });
  });

  describe("Rank Medals & Badges", () => {
    it("returns correct rank medals and glyphs", () => {
      expect(rankMedal(1)).toBe("gold");
      expect(rankMedal(2)).toBe("silver");
      expect(rankMedal(3)).toBe("bronze");
      expect(rankMedal(4)).toBeNull();

      expect(rankBadgeGlyph(1)).toBe("medal-gold");
      expect(rankBadgeGlyph(2)).toBe("medal-silver");
      expect(rankBadgeGlyph(3)).toBe("medal-bronze");
      expect(rankBadgeGlyph(5)).toBe("star");
    });
  });
});
