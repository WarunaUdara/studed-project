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
    // Text blocks render markdown (agent output often contains markdown).
    expect(el.type.name).toBe("MarkdownContent");
    expect(el.props.content).toBe("Calculus study content");
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

  it("renders self-contained HTML simulation block element", () => {
    const el = LearnBlockRenderer({
      block: {
        id: "6",
        type: "html_simulation",
        content: "Projectile Motion",
        metadata: JSON.stringify({
          title: "Projectile Motion",
          html: "<!doctype html><html><body><canvas></canvas></body></html>",
        }),
      },
    });
    expect(el.props.content).toBe("Projectile Motion");
    expect(el.props.metadata).toContain("<canvas>");
  });

  it("renders callout block content as markdown", () => {
    const el = LearnBlockRenderer({
      block: { id: "7", type: "callout", content: "Remember: **mass attracts mass**" },
    });
    const md = el.props.children.find(
      (c: { type?: { name?: string } }) => c?.type?.name === "MarkdownContent",
    );
    expect(md).toBeTruthy();
    expect(md.props.content).toBe("Remember: **mass attracts mass**");
  });

  it("renders the interactive physics lab blocks", () => {
    const force = LearnBlockRenderer({
      block: { id: "10", type: "force_lab", content: "Push the cart" },
    });
    expect(force.type.name).toBe("ForceLabBlock");

    const circuit = LearnBlockRenderer({
      block: { id: "11", type: "circuit_lab", content: "Light the bulb" },
    });
    expect(circuit.type.name).toBe("CircuitLabBlock");

    const water = LearnBlockRenderer({
      block: { id: "12", type: "water_flow", content: "Watch the water" },
    });
    expect(water.type.name).toBe("WaterFlowBlock");
  });

  it("renders an injected animation block by scene id", () => {
    const el = LearnBlockRenderer({
      block: {
        id: "13",
        type: "animation",
        content: "force-arrows",
        metadata: JSON.stringify({ version: 1, scene: "force-arrows", params: { push: 8 } }),
      },
    });
    expect(el.type.name).toBe("AnimationBlock");
    expect(el.props.content).toBe("force-arrows");
  });
});
