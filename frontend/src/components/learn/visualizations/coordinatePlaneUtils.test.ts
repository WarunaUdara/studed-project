import { describe, expect, it } from "vitest";
import {
  DEFAULT_STEPS,
  isPointInGrid,
  parseConfig,
  resolveGrid,
  stepTargetsMatch,
} from "./coordinatePlaneUtils";

describe("parseConfig", () => {
  it("returns an empty config for missing metadata", () => {
    expect(parseConfig(null)).toEqual({});
    expect(parseConfig(undefined)).toEqual({});
  });

  it("parses title, grid, and steps from metadata", () => {
    const config = parseConfig(
      JSON.stringify({
        title: "Grid Discovery",
        grid: { xMin: -3, xMax: 3, yMin: -3, yMax: 3 },
        steps: [
          {
            id: "s1",
            title: "T",
            instruction: "I",
            mode: "select_point",
            target: { x: 1, y: 1 },
            explanation: "E",
          },
        ],
      }),
    );
    expect(config.title).toBe("Grid Discovery");
    expect(config.grid).toEqual({ xMin: -3, xMax: 3, yMin: -3, yMax: 3 });
    expect(config.steps).toHaveLength(1);
  });

  it("falls back to an empty config on invalid JSON", () => {
    expect(parseConfig("not json")).toEqual({});
  });
});

describe("resolveGrid", () => {
  it("uses defaults when no grid is provided", () => {
    expect(resolveGrid(undefined)).toEqual({ xMin: 0, xMax: 6, yMin: 0, yMax: 6 });
  });

  it("merges partial bounds with defaults", () => {
    expect(resolveGrid({ xMax: 3, yMin: -2 })).toEqual({ xMin: 0, xMax: 3, yMin: -2, yMax: 6 });
  });
});

describe("isPointInGrid", () => {
  const grid = { xMin: -3, xMax: 3, yMin: -2, yMax: 2 };
  it("accepts points inside the bounds", () => {
    expect(isPointInGrid({ x: 0, y: 0 }, grid)).toBe(true);
    expect(isPointInGrid({ x: -3, y: 2 }, grid)).toBe(true);
  });
  it("rejects points outside the bounds", () => {
    expect(isPointInGrid({ x: 4, y: 0 }, grid)).toBe(false);
    expect(isPointInGrid({ x: 0, y: 3 }, grid)).toBe(false);
  });
});

describe("stepTargetsMatch", () => {
  it("matches equal points", () => {
    expect(stepTargetsMatch({ x: 3, y: 1 }, { x: 3, y: 1 })).toBe(true);
  });
  it("rejects mismatches and nulls", () => {
    expect(stepTargetsMatch({ x: 3, y: 2 }, { x: 3, y: 1 })).toBe(false);
    expect(stepTargetsMatch(null, { x: 3, y: 1 })).toBe(false);
    expect(stepTargetsMatch({ x: 3, y: 1 }, undefined)).toBe(false);
  });
});

describe("DEFAULT_STEPS", () => {
  it("covers the progression: x-axis, y-axis, 2D, demo, select", () => {
    expect(DEFAULT_STEPS[0].mode).toBe("move_axis");
    expect(DEFAULT_STEPS[0].axis).toBe("x");
    expect(DEFAULT_STEPS[1].mode).toBe("move_axis");
    expect(DEFAULT_STEPS[1].axis).toBe("y");
    expect(DEFAULT_STEPS[2].mode).toBe("move_plane");
    expect(DEFAULT_STEPS.some((s) => s.mode === "vector_demo")).toBe(true);
    expect(DEFAULT_STEPS.filter((s) => s.mode === "select_point").length).toBe(2);
  });
});
