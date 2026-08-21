import { describe, expect, it } from "vitest";
import {
  buildLessonContext,
  clampPanelSize,
  DEFAULT_PANEL,
  MIN_PANEL,
  resizeFromCorner,
} from "./lessonChatSize";

const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 360, height: 640 };

describe("chat panel sizing", () => {
  it("keeps the panel readable and on screen", () => {
    expect(clampPanelSize({ width: 100, height: 80 }, DESKTOP)).toEqual(MIN_PANEL);
    const huge = clampPanelSize({ width: 5000, height: 5000 }, DESKTOP);
    expect(huge.width).toBeLessThan(DESKTOP.width);
    expect(huge.height).toBeLessThan(DESKTOP.height);
  });

  it("shrinks below the usual minimum rather than overflowing a small phone", () => {
    const sized = clampPanelSize(DEFAULT_PANEL, PHONE);
    expect(sized.width).toBeLessThanOrEqual(PHONE.width);
    expect(sized.height).toBeLessThanOrEqual(PHONE.height);
  });

  it("grows when the corner is dragged up and left", () => {
    const bigger = resizeFromCorner(DEFAULT_PANEL, -80, -60, DESKTOP);
    expect(bigger.width).toBe(DEFAULT_PANEL.width + 80);
    expect(bigger.height).toBe(DEFAULT_PANEL.height + 60);

    const smaller = resizeFromCorner(DEFAULT_PANEL, 40, 40, DESKTOP);
    expect(smaller.width).toBe(DEFAULT_PANEL.width - 40);
    expect(smaller.height).toBe(DEFAULT_PANEL.height - 40);
  });
});

describe("lesson context", () => {
  it("sends the readable lesson text and skips interactive block payloads", () => {
    const context = buildLessonContext("Make the Bulb Glow", [
      { type: "text", content: "Electricity travels in a full circle." },
      { type: "circuit_lab", content: "Tap a gap to place a part." },
      { type: "callout", content: "Never poke wires into a socket." },
    ]);
    expect(context).toContain("Make the Bulb Glow");
    expect(context).toContain("full circle");
    expect(context).toContain("Never poke wires");
    expect(context).not.toContain("Tap a gap");
  });

  it("truncates very long lessons so a request stays small", () => {
    const context = buildLessonContext("Long", [{ type: "text", content: "x".repeat(5000) }]);
    expect(context.length).toBeLessThanOrEqual(2003);
    expect(context.endsWith("...")).toBe(true);
  });
});
