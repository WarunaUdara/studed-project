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

  it("routes interactive types to the manipulative card", () => {
    for (const type of ["tap_target", "drag_drop", "order_steps", "toggle_switch", "slider_target"]) {
      const el = EvaluateBlockRenderer({
        block: { ...base, type },
        index: 0,
        answer: "",
        onAnswerChange: () => {},
      });
      expect(el.type.name).toBe("InteractiveCard");
      expect(el.props.instruction.length).toBeGreaterThan(0);
    }
  });
});
