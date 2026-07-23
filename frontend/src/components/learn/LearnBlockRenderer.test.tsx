import { describe, expect, it } from "vitest";
import { LearnBlockRenderer } from "./LearnBlockRenderer";

describe("LearnBlockRenderer", () => {
  it("renders heading block element", () => {
    const el = LearnBlockRenderer({
      block: { id: "1", type: "heading", content: "Introduction to Calculus" },
    });
    expect(el.props.children).toBe("Introduction to Calculus");
  });

  it("renders text block element", () => {
    const el = LearnBlockRenderer({
      block: { id: "2", type: "text", content: "Calculus study content" },
    });
    expect(el.props.children).toBe("Calculus study content");
  });

  it("renders Math-To-Manim animation block element", () => {
    const el = LearnBlockRenderer({
      block: { id: "3", type: "manim", content: "a^2 + b^2 = c^2" },
    });
    expect(el.props.content).toBe("a^2 + b^2 = c^2");
  });

  it("renders 3Dmol molecular block element", () => {
    const el = LearnBlockRenderer({
      block: {
        id: "4",
        type: "molecule",
        content: "Caffeine",
        metadata: JSON.stringify({ moleculeName: "Caffeine" }),
      },
    });
    expect(el.props.content).toBe("Caffeine");
  });

  it("renders tscircuit schematic block element", () => {
    const el = LearnBlockRenderer({
      block: { id: "5", type: "tscircuit", content: "Op-Amp Circuit" },
    });
    expect(el.props.content).toBe("Op-Amp Circuit");
  });

  it("renders Matter.js physics simulation block element", () => {
    const el = LearnBlockRenderer({
      block: { id: "6", type: "physics", content: "2D Collision demo" },
    });
    expect(el.props.content).toBe("2D Collision demo");
  });
});
