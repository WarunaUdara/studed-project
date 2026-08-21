import { describe, expect, it } from "vitest";
import {
  ANIMATION_SCENES,
  booleanParam,
  getScene,
  numberParam,
  SCENE_IDS,
  stringParam,
} from "./animationRegistry";
import { netForce } from "./ForceArrowsScene";
import { flowRate } from "./WaterFlowScene";

describe("animation registry", () => {
  it("exposes every scene with a label and a component", () => {
    expect(SCENE_IDS.length).toBeGreaterThan(0);
    for (const id of SCENE_IDS) {
      const scene = ANIMATION_SCENES[id];
      expect(scene.label.length).toBeGreaterThan(0);
      expect(typeof scene.Component).toBe("function");
    }
  });

  it("resolves scene ids case-insensitively and ignores unknown ids", () => {
    expect(getScene("force-arrows")).not.toBeNull();
    expect(getScene("FORCE-ARROWS")).not.toBeNull();
    expect(getScene("no-such-scene")).toBeNull();
    expect(getScene(undefined)).toBeNull();
  });
});

describe("scene param coercion", () => {
  it("reads numbers from both numeric and string JSON values", () => {
    expect(numberParam({ push: 4 }, "push", 1)).toBe(4);
    expect(numberParam({ push: "4.5" }, "push", 1)).toBe(4.5);
    expect(numberParam({ push: "abc" }, "push", 1)).toBe(1);
    expect(numberParam({}, "push", 1)).toBe(1);
  });

  it("falls back for empty strings and non-boolean values", () => {
    expect(stringParam({ label: "Cart" }, "label", "Box")).toBe("Cart");
    expect(stringParam({ label: "" }, "label", "Box")).toBe("Box");
    expect(booleanParam({ active: false }, "active", true)).toBe(false);
    expect(booleanParam({ active: "true" }, "active", false)).toBe(true);
    expect(booleanParam({}, "active", true)).toBe(true);
  });
});

describe("physics scene models", () => {
  it("cancels the net force when friction matches the push", () => {
    expect(netForce(10, 1)).toBe(0);
    expect(netForce(10, 0)).toBe(10);
    expect(netForce(10, 0.5)).toBe(5);
    expect(netForce(10, 2)).toBe(0);
  });

  it("raises flow with pressure and lowers it with resistance", () => {
    expect(flowRate(9, 0)).toBeGreaterThan(flowRate(3, 0));
    expect(flowRate(9, 9)).toBeLessThan(flowRate(9, 0));
    expect(flowRate(0, 3)).toBe(0);
  });
});
