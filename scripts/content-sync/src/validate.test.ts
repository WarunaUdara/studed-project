import { describe, expect, it } from "bun:test";
import { validateManifest } from "./validate";
import type { CourseManifest } from "./types";

const validCourse: CourseManifest = {
  slug: "test-course",
  title: "Test Course",
  description: "A course used in unit tests.",
  gradeLevel: "G9",
  price: 0,
  version: 1,
  lessons: [
    {
      title: "Level 1",
      sequenceOrder: 1,
      waves: [
        {
          title: "1. First Wave",
          sequenceOrder: 1,
          xpReward: 100,
          maxReattempts: 3,
          passingThreshold: 60,
          estimatedDuration: 8,
          difficulty: "EASY",
          learnBlocks: [
            { id: "lb-1", type: "text", content: "hello" },
            { id: "lb-2", type: "code", content: "print(1)" },
          ],
          evaluateBlocks: [
            {
              id: "eb-1",
              type: "multiple_choice",
              question: "What prints?",
              options: ["1", "2"],
              correctAnswer: "1",
              explanation: "it prints 1",
            },
          ],
        },
      ],
    },
  ],
};

describe("validateManifest", () => {
  it("accepts a valid manifest", () => {
    const result = validateManifest(validCourse);
    expect(result.issues).toHaveLength(0);
    if ("course" in result) {
      expect(result.course.slug).toBe("test-course");
    }
  });

  it("rejects an invalid slug", () => {
    const result = validateManifest({ ...validCourse, slug: "Bad Slug!" });
    expect(result.issues.some((i) => i.path === "$.slug")).toBe(true);
  });

  it("rejects an unknown grade", () => {
    const result = validateManifest({ ...validCourse, gradeLevel: "K" });
    expect(result.issues.some((i) => i.path === "$.gradeLevel")).toBe(true);
  });

  it("rejects a published wave with no learn blocks", () => {
    const course = structuredClone(validCourse);
    course.lessons[0].waves[0].learnBlocks = [];
    const result = validateManifest(course);
    expect(result.issues.some((i) => i.message.includes("learn block"))).toBe(true);
  });

  it("rejects multiple_choice whose correctAnswer is not an option", () => {
    const course = structuredClone(validCourse);
    course.lessons[0].waves[0].evaluateBlocks[0].correctAnswer = "3";
    const result = validateManifest(course);
    expect(result.issues.some((i) => i.path.includes("correctAnswer"))).toBe(true);
  });

  it("accepts true_false without options and enforces correctAnswer", () => {
    const course = structuredClone(validCourse);
    course.lessons[0].waves[0].evaluateBlocks[0] = {
      id: "eb-tf",
      type: "true_false",
      question: "Is 2 + 2 = 4?",
      correctAnswer: "True",
      explanation: "obviously",
    };
    const ok = validateManifest(course);
    expect(ok.issues).toHaveLength(0);

    course.lessons[0].waves[0].evaluateBlocks[0].correctAnswer = "Yes";
    const bad = validateManifest(course);
    expect(bad.issues.some((i) => i.path.includes("correctAnswer"))).toBe(true);
  });

  it("allows draft waves without content", () => {
    const course = structuredClone(validCourse);
    course.lessons[0].waves[0] = {
      ...course.lessons[0].waves[0],
      status: "draft",
      learnBlocks: [],
      evaluateBlocks: [],
    };
    const result = validateManifest(course);
    expect(result.issues).toHaveLength(0);
  });

  it("rejects duplicate wave sequenceOrder within a lesson", () => {
    const course = structuredClone(validCourse);
    course.lessons[0].waves.push({ ...course.lessons[0].waves[0], title: "1. Duplicate" });
    const result = validateManifest(course);
    expect(result.issues.some((i) => i.message.includes("duplicate sequenceOrder"))).toBe(true);
  });
});
