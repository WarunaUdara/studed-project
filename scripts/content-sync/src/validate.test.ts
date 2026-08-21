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

describe("interactive evaluate blocks", () => {
  function withEvaluateBlock(block: Record<string, unknown>) {
    return {
      ...validCourse,
      lessons: [
        {
          ...validCourse.lessons[0],
          waves: [{ ...validCourse.lessons[0].waves[0], evaluateBlocks: [block] }],
        },
      ],
    };
  }

  const tapBlock = {
    id: "eb-tap",
    type: "tap_target",
    question: "Which wire completes the circuit?",
    correctAnswer: "wire-left",
    explanation: "That wire closes the loop.",
    metadata: {
      version: 1,
      targets: [
        { id: "wire-left", label: "Left wire" },
        { id: "wire-right", label: "Right wire" },
      ],
    },
  };

  it("accepts a well-formed manipulative question", () => {
    expect(validateManifest(withEvaluateBlock(tapBlock)).issues).toHaveLength(0);
  });

  it("rejects an interactive block with no metadata to manipulate", () => {
    const { metadata: _omitted, ...noMetadata } = tapBlock;
    const result = validateManifest(withEvaluateBlock(noMetadata));
    expect(result.issues.some((i) => i.path.endsWith(".metadata"))).toBe(true);
  });

  it("rejects an answer naming a target that does not exist", () => {
    const result = validateManifest(
      withEvaluateBlock({ ...tapBlock, correctAnswer: "wire-middle" }),
    );
    expect(result.issues.some((i) => i.message.includes("not one of the block's targets"))).toBe(true);
  });

  it("rejects unsorted tap and drag answers that a student could never produce", () => {
    const unsortedTap = validateManifest(
      withEvaluateBlock({
        ...tapBlock,
        correctAnswer: "wire-right+wire-left",
        metadata: { ...tapBlock.metadata, multi: true },
      }),
    );
    expect(unsortedTap.issues.some((i) => i.message.includes("must be sorted"))).toBe(true);

    const unsortedDrag = validateManifest(
      withEvaluateBlock({
        id: "eb-drag",
        type: "drag_drop",
        question: "Build the circuit.",
        correctAnswer: "slot-2:bulb,slot-1:cell",
        explanation: "The cell powers the bulb.",
        metadata: {
          version: 1,
          items: [
            { id: "cell", label: "Battery" },
            { id: "bulb", label: "Bulb" },
          ],
          slots: [
            { id: "slot-1", label: "Power gap" },
            { id: "slot-2", label: "Lamp holder" },
          ],
        },
      }),
    );
    expect(unsortedDrag.issues.some((i) => i.message.includes("sorted by slot"))).toBe(true);
  });

  it("requires an ordering answer to list every step exactly once", () => {
    const result = validateManifest(
      withEvaluateBlock({
        id: "eb-order",
        type: "order_steps",
        question: "What happens first?",
        correctAnswer: "push>roll",
        explanation: "You push before it rolls.",
        metadata: {
          version: 1,
          steps: [
            { id: "push", label: "You push the cart" },
            { id: "roll", label: "The cart rolls" },
            { id: "stop", label: "Friction stops it" },
          ],
        },
      }),
    );
    expect(result.issues.some((i) => i.message.includes("every step id exactly once"))).toBe(true);
  });

  it("requires every switch to appear in a switch answer", () => {
    const result = validateManifest(
      withEvaluateBlock({
        id: "eb-switch",
        type: "toggle_switch",
        question: "Which switches light the bulb?",
        correctAnswer: "s1=on",
        explanation: "Only the first switch is on the loop.",
        metadata: {
          version: 1,
          switches: [
            { id: "s1", label: "Main switch" },
            { id: "s2", label: "Shortcut switch" },
          ],
        },
      }),
    );
    expect(result.issues.some((i) => i.message.includes('switch "s2" is missing'))).toBe(true);
  });

  it("requires a slider answer to name one of its bands", () => {
    const result = validateManifest(
      withEvaluateBlock({
        id: "eb-slider",
        type: "slider_target",
        question: "How hard should you push?",
        correctAnswer: "medium",
        explanation: "Enough to beat friction.",
        metadata: {
          version: 1,
          min: 0,
          max: 10,
          bands: [
            { value: "too-little", upTo: 3 },
            { value: "just-right", upTo: 7 },
            { value: "too-much" },
          ],
        },
      }),
    );
    expect(result.issues.some((i) => i.message.includes("one of the band values"))).toBe(true);
  });
});
