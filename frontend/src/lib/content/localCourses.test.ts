import { describe, expect, it } from "vitest";
import {
  findLocalCourse,
  findLocalWave,
  firstLocalWaveId,
  localCourseDetail,
  localCourseNodes,
} from "./localCourses";
import { gradeWaveLocally } from "./localGrading";
import { manifestWaveId } from "./manifest";

const PHYSICS = "physics-grade-4-5";

describe("manifest-backed courses", () => {
  it("ships the Grade 4-5 physics course in the catalog", () => {
    const node = localCourseNodes().find((course) => course.slug === PHYSICS);
    expect(node).toBeDefined();
    expect(node?.myProgress?.totalWaves).toBeGreaterThanOrEqual(6);
  });

  it("builds a syllabus with both lessons and stable wave ids", () => {
    const detail = localCourseDetail(PHYSICS);
    expect(detail?.lessons).toHaveLength(2);
    expect(detail?.lessons[0].waves[0].id).toBe(manifestWaveId(PHYSICS, 1, 1));
    expect(firstLocalWaveId(PHYSICS)).toBe(manifestWaveId(PHYSICS, 1, 1));
  });

  it("returns null for courses that are not shipped locally", () => {
    expect(findLocalCourse("no-such-course")).toBeNull();
    expect(localCourseDetail("no-such-course")).toBeNull();
    expect(findLocalWave("no-such-course-l1-w1")).toBeNull();
  });

  it("hands the player a wave with its blocks and its siblings", () => {
    const wave = findLocalWave(manifestWaveId(PHYSICS, 2, 1));
    expect(wave?.title).toContain("Bulb");
    expect(wave?.learnBlocks.length).toBeGreaterThan(0);
    expect(wave?.evaluateBlocks.length).toBeGreaterThan(0);
    // The player reads sibling lessons to offer the next wave.
    expect(wave?.lesson.course.lessons).toHaveLength(2);
  });

  it("serializes block metadata as JSON strings, the way GraphQL delivers it", () => {
    const wave = findLocalWave(manifestWaveId(PHYSICS, 1, 1));
    const lab = wave?.learnBlocks.find((block) => block.type === "force_lab");
    expect(typeof lab?.metadata).toBe("string");
    expect(JSON.parse(lab?.metadata ?? "{}").version).toBe(1);
  });

  it("asks every question as a manipulation rather than a multiple choice", () => {
    const manipulative = new Set([
      "tap_target",
      "drag_drop",
      "order_steps",
      "toggle_switch",
      "slider_target",
    ]);
    const detail = localCourseDetail(PHYSICS);
    for (const lesson of detail?.lessons ?? []) {
      for (const waveSummary of lesson.waves) {
        const wave = findLocalWave(waveSummary.id);
        expect(wave).not.toBeNull();
        for (const block of wave?.evaluateBlocks ?? []) {
          expect(manipulative.has(block.type)).toBe(true);
        }
      }
    }
  });
});

describe("local grading", () => {
  const blocks = [
    { id: "a", correctAnswer: "wire-left", explanation: "It closes the loop." },
    { id: "b", correctAnswer: "slot-1:cell", explanation: "The battery pushes." },
  ];

  it("scores by share correct and pays XP only on a pass", () => {
    const passed = gradeWaveLocally(
      blocks,
      { a: "wire-left", b: "slot-1:cell" },
      { passingThreshold: 60, xpReward: 40, currentTotalXp: 100 },
    );
    expect(passed.score).toBe(100);
    expect(passed.passed).toBe(true);
    expect(passed.xpEarned).toBe(40);
    expect(passed.totalXp).toBe(140);

    const failed = gradeWaveLocally(
      blocks,
      { a: "wire-right", b: "" },
      { passingThreshold: 60, xpReward: 40, currentTotalXp: 100 },
    );
    expect(failed.score).toBe(0);
    expect(failed.passed).toBe(false);
    expect(failed.xpEarned).toBe(0);
    expect(failed.totalXp).toBe(100);
  });

  it("ignores case and stray spaces, as the server does", () => {
    const result = gradeWaveLocally(
      blocks,
      { a: "  Wire-Left ", b: "slot-1:cell" },
      { passingThreshold: 60, xpReward: 40, currentTotalXp: 0 },
    );
    expect(result.score).toBe(100);
  });

  it("returns per-question feedback for the renderer", () => {
    const result = gradeWaveLocally(
      blocks,
      { a: "wire-left" },
      { passingThreshold: 60, xpReward: 40, currentTotalXp: 0 },
    );
    expect(result.feedback).toHaveLength(2);
    expect(result.feedback[0]).toMatchObject({ evaluateBlockId: "a", correct: true });
    expect(result.feedback[1]).toMatchObject({ evaluateBlockId: "b", correct: false });
  });
});
