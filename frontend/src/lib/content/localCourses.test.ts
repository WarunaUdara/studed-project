import { describe, expect, it } from "vitest";
import { hasInteractiveConfig } from "./interactiveBlocks";
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

describe("Math Foundation course", () => {
  const MATH = "math-foundation";

  it("ships a plan of lessons with the first one fully built", () => {
    const detail = localCourseDetail(MATH);
    expect(detail?.lessons.length).toBeGreaterThanOrEqual(5);

    const published = detail?.lessons.filter((lesson) => lesson.isPublished) ?? [];
    expect(published).toHaveLength(1);
    expect(published[0].waves).toHaveLength(3);

    // Planned lessons are visible as a roadmap but carry no waves yet.
    const planned = detail?.lessons.filter((lesson) => !lesson.isPublished) ?? [];
    expect(planned.length).toBeGreaterThan(0);
    for (const lesson of planned) expect(lesson.waves).toHaveLength(0);
  });

  it("counts only built waves towards progress, not planned lessons", () => {
    const node = localCourseNodes().find((course) => course.slug === MATH);
    expect(node?.myProgress?.totalWaves).toBe(3);
  });

  it("teaches fractions with a manipulable bar rather than prose", () => {
    const wave = findLocalWave(manifestWaveId(MATH, 1, 1));
    expect(wave?.learnBlocks.some((block) => block.type === "fraction_lab")).toBe(true);
    expect(wave?.learnBlocks.some((block) => block.type === "blob_dialog")).toBe(true);
  });
});

describe("Computers and Code course", () => {
  const ICT = "ict-grade-6-8";

  it("ships two full lessons of coding waves", () => {
    const detail = localCourseDetail(ICT);
    expect(detail?.lessons).toHaveLength(2);
    expect(detail?.lessons.every((lesson) => lesson.waves.length >= 3)).toBe(true);
  });

  it("teaches sequencing with the instruction maze", () => {
    const detail = localCourseDetail(ICT);
    const mazeWave = detail?.lessons[0].waves.find((w) => w.title.includes("Program the Blob"));
    expect(mazeWave).toBeDefined();
    const wave = findLocalWave(mazeWave?.id ?? "");
    expect(wave?.learnBlocks.some((block) => block.type === "blob_maze")).toBe(true);
  });

  it("puts a runnable Python exercise in the waves that teach code", () => {
    const wave = findLocalWave(manifestWaveId(ICT, 2, 2));
    const runner = wave?.learnBlocks.find((block) => block.type === "python_runner");
    expect(runner).toBeDefined();

    // The error-reading wave opens with a program that is broken on purpose.
    expect(runner?.content).toContain("totl");
    const config = JSON.parse(runner?.metadata ?? "{}");
    expect(config.starterCode).toBe(runner?.content);
    expect(config.hint).toContain("NameError");
  });

  it("keeps every question manipulative here too", () => {
    const manipulative = new Set([
      "tap_target",
      "drag_drop",
      "order_steps",
      "toggle_switch",
      "slider_target",
    ]);
    const detail = localCourseDetail(ICT);
    for (const lesson of detail?.lessons ?? []) {
      for (const summary of lesson.waves) {
        const wave = findLocalWave(summary.id);
        for (const block of wave?.evaluateBlocks ?? []) {
          expect(manipulative.has(block.type)).toBe(true);
        }
      }
    }
  });
});

describe("every shipped course", () => {
  const MANIPULATIVE = new Set([
    "tap_target",
    "drag_drop",
    "order_steps",
    "toggle_switch",
    "slider_target",
  ]);

  it("asks only manipulative questions and answers them reachably", () => {
    for (const node of localCourseNodes()) {
      const detail = localCourseDetail(node.slug);
      for (const lesson of detail?.lessons ?? []) {
        for (const summary of lesson.waves) {
          const wave = findLocalWave(summary.id);
          expect(wave, `${summary.id} should resolve`).not.toBeNull();
          expect(wave?.learnBlocks.length).toBeGreaterThan(0);
          expect(wave?.evaluateBlocks.length).toBeGreaterThan(0);

          for (const block of wave?.evaluateBlocks ?? []) {
            expect(MANIPULATIVE.has(block.type)).toBe(true);
            expect(block.correctAnswer ?? "").not.toBe("");
            expect(block.explanation ?? "").not.toBe("");
            // Every manipulative block needs a configuration to manipulate,
            // otherwise the player falls back to a plain text answer box.
            expect(hasInteractiveConfig(block.type, block.metadata)).toBe(true);
          }
        }
      }
    }
  });

  it("writes formulas as single-escaped LaTeX so KaTeX can render them", () => {
    for (const node of localCourseNodes()) {
      const detail = localCourseDetail(node.slug);
      for (const lesson of detail?.lessons ?? []) {
        for (const summary of lesson.waves) {
          const wave = findLocalWave(summary.id);
          for (const block of wave?.learnBlocks ?? []) {
            if (block.type !== "formula") continue;
            // A doubled backslash is a LaTeX line break, not a command, and is
            // the usual sign that an authoring script over-escaped the string.
            expect(block.content.includes("\\\\")).toBe(false);
          }
        }
      }
    }
  });

  it("covers a ladder of grade levels rather than one band", () => {
    const grades = new Set(localCourseNodes().map((course) => course.gradeLevel));
    expect(grades.size).toBeGreaterThanOrEqual(5);
    // The ladder has to reach both exam years, not stop at middle school.
    expect(grades.has("OL")).toBe(true);
    expect(grades.has("AL")).toBe(true);
  });

  it("carries both subject ladders through to A/L", () => {
    const bySubject = (needle: string) =>
      localCourseNodes().filter((course) => course.slug.startsWith(needle));
    expect(bySubject("physics").length).toBeGreaterThanOrEqual(5);
    expect(bySubject("ict").length).toBeGreaterThanOrEqual(4);
    for (const prefix of ["physics", "ict"]) {
      expect(bySubject(prefix).some((course) => course.gradeLevel === "AL")).toBe(true);
      expect(bySubject(prefix).some((course) => course.gradeLevel === "OL")).toBe(true);
    }
  });

  it("gives each course a distinct slug and a non-empty syllabus", () => {
    const slugs = localCourseNodes().map((course) => course.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(localCourseDetail(slug)?.lessons.length).toBeGreaterThan(0);
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
