import { describe, expect, it } from "vitest";
import { describeRun } from "./code-runner";

const base = {
  stdout: "",
  stderr: "",
  exitCode: 0,
  timedOut: false,
  durationMs: 12,
  truncated: false,
};

describe("describeRun", () => {
  it("celebrates a run that printed something", () => {
    const summary = describeRun({ ...base, stdout: "42\n" });
    expect(summary.tone).toBe("success");
    expect(summary.message).toContain("12 ms");
  });

  it("points a student at the traceback when the program crashed", () => {
    const summary = describeRun({
      ...base,
      exitCode: 1,
      stderr: "NameError: name 'x' is not defined",
    });
    expect(summary.tone).toBe("error");
    expect(summary.message).toContain("error");
  });

  it("explains a timeout rather than showing an empty result", () => {
    const summary = describeRun({ ...base, timedOut: true, exitCode: -1 });
    expect(summary.tone).toBe("warning");
    expect(summary.message).toContain("too long");
  });

  it("flags a silent program, which usually means a missing print", () => {
    const summary = describeRun(base);
    expect(summary.tone).toBe("warning");
    expect(summary.message).toContain("did not print");
  });
});
