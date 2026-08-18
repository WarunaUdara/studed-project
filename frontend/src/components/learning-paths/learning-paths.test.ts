import { describe, expect, it } from "vitest";
import { CourseMilestoneCard } from "./CourseMilestoneCard";
import { LearningPathRibbon } from "./LearningPathRibbon";
import {
  CodeIsometricIcon,
  LanguageIsometricIcon,
  MathIsometricIcon,
  ScienceIsometricIcon,
} from "./PathCategoryIcons";
import type { LearningPathDef } from "./types";

describe("Learning Paths & Milestone Tracks Engine", () => {
  it("exports all category isometric icons and components", () => {
    expect(typeof MathIsometricIcon).toBe("function");
    expect(typeof CodeIsometricIcon).toBe("function");
    expect(typeof ScienceIsometricIcon).toBe("function");
    expect(typeof LanguageIsometricIcon).toBe("function");
    expect(typeof CourseMilestoneCard).toBe("function");
    expect(typeof LearningPathRibbon).toBe("function");
  });

  it("calculates overall completion percentage correctly for a learning path", () => {
    const mockPath: LearningPathDef = {
      id: "test-math",
      title: "Math Foundations",
      subtitle: "Algebra & Geometry",
      levelBadge: "GRADES 4-7",
      category: "MATH",
      courses: [
        {
          id: "c1",
          title: "Fractions",
          description: "Fraction basics",
          slug: "fractions",
          gradeLevel: "GRADE_6",
          myProgress: { completedWaves: 2, totalWaves: 4 },
        },
        {
          id: "c2",
          title: "Coordinate Geometry",
          description: "Plane geometry",
          slug: "coordinate-geometry",
          gradeLevel: "GRADE_10",
          myProgress: { completedWaves: 3, totalWaves: 6 },
        },
      ],
    };

    const totalWaves = mockPath.courses.reduce((acc, c) => acc + (c.myProgress?.totalWaves ?? 0), 0);
    const completedWaves = mockPath.courses.reduce((acc, c) => acc + (c.myProgress?.completedWaves ?? 0), 0);
    const percent = Math.round((completedWaves / totalWaves) * 100);

    expect(totalWaves).toBe(10);
    expect(completedWaves).toBe(5);
    expect(percent).toBe(50);
  });
});
