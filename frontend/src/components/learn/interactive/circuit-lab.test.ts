import { describe, expect, it } from "vitest";
import { matchesPlacement } from "./CircuitLabBlock";

describe("circuit lab wiring", () => {
  const solution = { "slot-top": "wire", "slot-power": "cell" };
  const short = { "slot-top": "wire", "slot-power": "cell", "slot-bypass": "wire" };

  it("lights only when every gap in the solution is filled and nothing else is", () => {
    expect(matchesPlacement(solution, { "slot-top": "wire", "slot-power": "cell" })).toBe(true);
    expect(matchesPlacement(solution, { "slot-top": "wire" })).toBe(false);
    expect(matchesPlacement(solution, { "slot-top": "cell", "slot-power": "wire" })).toBe(false);
  });

  it("separates the working circuit from the short circuit by the shortcut wire", () => {
    const shorted = { "slot-top": "wire", "slot-power": "cell", "slot-bypass": "wire" };
    expect(matchesPlacement(short, shorted)).toBe(true);
    expect(matchesPlacement(solution, shorted)).toBe(false);
  });

  it("ignores slots that were emptied again", () => {
    expect(
      matchesPlacement(solution, { "slot-top": "wire", "slot-power": "cell", "slot-bypass": "" }),
    ).toBe(true);
  });
});
