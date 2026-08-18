import { describe, expect, it } from "vitest";
import { DailySparkLeagueRank } from "./DailySparkLeagueRank";
import { DailySparkMascotMotivation } from "./DailySparkMascotMotivation";
import { DailySparkModal } from "./DailySparkModal";
import { DailySparkStreakCharge } from "./DailySparkStreakCharge";
import { DailySparkStreakScreen } from "./DailySparkStreakScreen";
import { DailySparkTaskCard } from "./DailySparkTaskCard";
import { FractionTriangle, TRIANGLE_REGIONS } from "./FractionTriangle";

describe("Daily Spark Warmup & Streak Gamification Suite", () => {
  it("exports all complete 5-screen Daily Spark components", () => {
    expect(typeof FractionTriangle).toBe("function");
    expect(typeof DailySparkTaskCard).toBe("function");
    expect(typeof DailySparkMascotMotivation).toBe("function");
    expect(typeof DailySparkStreakScreen).toBe("function");
    expect(typeof DailySparkStreakCharge).toBe("function");
    expect(typeof DailySparkLeagueRank).toBe("function");
    expect(typeof DailySparkModal).toBe("function");
  });

  it("verifies the total area of all triangle sub-polygons sums to exactly 1.0 (100%)", () => {
    const totalArea = TRIANGLE_REGIONS.reduce((acc, r) => acc + r.areaFraction, 0);
    expect(totalArea).toBeCloseTo(1.0, 4);
  });

  it("verifies 1/4 fraction solutions: any single 1/4 piece equals 0.25", () => {
    const quarters = TRIANGLE_REGIONS.filter((r) => r.areaFraction === 0.25);
    expect(quarters.length).toBe(3);
    for (const q of quarters) {
      expect(q.areaFraction).toBe(0.25);
    }
  });

  it("verifies 1/4 fraction permutation: combining two 1/8 eighth sub-pieces equals 0.25", () => {
    const eighths = TRIANGLE_REGIONS.filter((r) => r.areaFraction === 0.125);
    expect(eighths.length).toBe(2);
    const combinedArea = eighths.reduce((acc, r) => acc + r.areaFraction, 0);
    expect(combinedArea).toBe(0.25);
  });

  it("verifies 2/4 fraction solutions: two 1/4 pieces equal 0.50 (50%)", () => {
    const quarters = TRIANGLE_REGIONS.filter((r) => r.areaFraction === 0.25);
    const twoQuartersArea = quarters[0].areaFraction + quarters[1].areaFraction;
    expect(twoQuartersArea).toBe(0.5);
  });

  it("verifies 3/4 fraction solutions: three 1/4 pieces equal 0.75 (75%)", () => {
    const quarters = TRIANGLE_REGIONS.filter((r) => r.areaFraction === 0.25);
    const threeQuartersArea = quarters.reduce((acc, r) => acc + r.areaFraction, 0);
    expect(threeQuartersArea).toBe(0.75);
  });
});
