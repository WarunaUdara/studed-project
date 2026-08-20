import { describe, expect, it } from "vitest";
import { EvaluateBlockRenderer } from "../EvaluateBlockRenderer";
import { moveStep } from "./OrderStepsBlock";

describe("moveStep", () => {
  it("swaps an item with its neighbour", () => {
    expect(moveStep(["a", "b", "c"], 1, -1)).toEqual(["b", "a", "c"]);
    expect(moveStep(["a", "b", "c"], 1, 1)).toEqual(["a", "c", "b"]);
  });

  it("refuses to move past either end", () => {
    const order = ["a", "b", "c"];
    expect(moveStep(order, 0, -1)).toBe(order);
    expect(moveStep(order, 2, 1)).toBe(order);
  });
});

describe("EvaluateBlockRenderer", () => {
  const base = { id: "eb-1", question: "Which wire completes the circuit?" };

  it("routes classic question types to the quiz card", () => {
    const el = EvaluateBlockRenderer({
      block: { ...base, type: "multiple_choice", options: ["A", "B"] },
      index: 0,
      answer: "",
      onAnswerChange: () => {},
    });
    expect(el.type.name).toBe("QuizBlock");
  });

  const CONFIGS: Record<string, object> = {
    tap_target: { targets: [{ id: "a", label: "A" }] },
    drag_drop: { items: [{ id: "a", label: "A" }], slots: [{ id: "s", label: "S" }] },
    order_steps: { steps: [{ id: "a", label: "A" }] },
    toggle_switch: { switches: [{ id: "a", label: "A" }] },
    slider_target: { min: 0, max: 10, bands: [{ value: "low" }] },
  };

  it("routes interactive types to the manipulative card", () => {
    for (const [type, config] of Object.entries(CONFIGS)) {
      const el = EvaluateBlockRenderer({
        block: { ...base, type, metadata: JSON.stringify({ version: 1, ...config }) },
        index: 0,
        answer: "",
        onAnswerChange: () => {},
      });
      expect(el.type.name).toBe("InteractiveCard");
      expect(el.props.instruction.length).toBeGreaterThan(0);
    }
  });

  it("falls back to the quiz card when an interactive block has nothing to manipulate", () => {
    // Legacy and AI-generated blocks share these type names but carry no config.
    for (const type of Object.keys(CONFIGS)) {
      const el = EvaluateBlockRenderer({
        block: { ...base, type },
        index: 0,
        answer: "",
        onAnswerChange: () => {},
      });
      expect(el.type.name).toBe("QuizBlock");
    }
  });
});
