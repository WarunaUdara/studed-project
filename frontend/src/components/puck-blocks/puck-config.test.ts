import { describe, expect, it } from "vitest";

import {
  agentBlocksToPuckItems,
  puckToWaveData,
  waveDataToPuck,
  type LearnBlockRaw,
  type EvaluateBlockRaw,
  type PuckData,
} from "@/components/puck-blocks/puck-config";

// Realistic agent output covering EVERY learn and evaluate type the agent
// can generate (matches the ai-service block catalog).
const AGENT_LEARN: LearnBlockRaw[] = [
  { id: "learn-1", type: "text", content: "Gravity pulls objects toward Earth." },
  { id: "learn-2", type: "math", content: "F = G(m1 m2)/r^2" },
  { id: "learn-3", type: "image", content: "https://cdn.example.com/gravity.png", metadata: "Diagram of falling objects" },
  { id: "learn-4", type: "video", content: "https://www.youtube.com/watch?v=abc123", metadata: "Gravity explained" },
  { id: "learn-5", type: "callout", content: "Remember: mass attracts mass." },
  { id: "learn-6", type: "example", content: "A 70kg person weighs 686N on Earth." },
  { id: "learn-7", type: "mathviz_manim", content: "Pendulum animation", metadata: JSON.stringify({ title: "Pendulum", scene_spec: { beats: [{ time: 0, action: "create" }] } }) },
  { id: "learn-8", type: "chemviz_3dmol", content: "Water molecule", metadata: JSON.stringify({ title: "H2O", source_type: "smiles", source: "O" }) },
  { id: "learn-9", type: "elecsim_tscircuit", content: "LED circuit", metadata: JSON.stringify({ title: "LED", circuit_code: "..." }) },
  { id: "learn-10", type: "mechsim_matterjs", content: "Bouncing ball", metadata: JSON.stringify({ title: "Ball", bodies: [{ shape: "circle" }] }) },
];

const AGENT_EVALUATE: EvaluateBlockRaw[] = [
  {
    id: "eval-1",
    type: "mcq",
    question: "What does gravity do?",
    options: ["Pulls objects together", "Pushes objects apart", "Does nothing", "Makes things float"],
    correctAnswer: "Pulls objects together",
    explanation: "Gravity is an attractive force.",
  },
  {
    id: "eval-2",
    type: "fill_in_blank",
    question: "The acceleration due to gravity is approximately ___ m/s^2.",
    correctAnswer: "9.8",
    explanation: "Standard value on Earth.",
  },
  {
    id: "eval-3",
    type: "true_false",
    question: "The Moon has weaker gravity than Earth.",
    correctAnswer: "True",
    explanation: "Smaller mass means weaker gravity.",
  },
  {
    id: "eval-4",
    type: "numeric",
    question: "What is the value of g on Earth in m/s^2?",
    correctAnswer: "9.8",
    explanation: "Standard value.",
  },
  {
    id: "eval-5",
    type: "drag_drop",
    question: "Match each planet to its gravity strength.",
    correctAnswer: "Earth: 9.8, Moon: 1.6",
    explanation: "Larger mass means stronger gravity.",
  },
];

describe("agentBlocksToPuckItems", () => {
  it("converts every learn and evaluate block type into a Puck item", () => {
    const items = agentBlocksToPuckItems(AGENT_LEARN, AGENT_EVALUATE);
    expect(items).toHaveLength(15);

    const byType = new Map(items.map((i) => [i.type, i]));
    expect(byType.get("TextBlock")).toBeDefined();
    expect(byType.get("MathViz")).toBeDefined();
    expect(byType.get("ImageBlock")).toBeDefined();
    expect(byType.get("VideoBlock")).toBeDefined();
    expect(byType.get("CalloutBlock")).toBeDefined();
    expect(byType.get("ExampleBlock")).toBeDefined();
    expect(byType.get("VizBlock")).toBeDefined();
    expect(byType.get("MCQBlock")).toBeDefined();
    expect(byType.get("FillBlankBlock")).toBeDefined();
    expect(byType.get("TrueFalseBlock")).toBeDefined();
    expect(byType.get("NumericBlock")).toBeDefined();
    expect(byType.get("DragDropBlock")).toBeDefined();
  });

  it("preserves ids, content, and metadata through conversion", () => {
    const items = agentBlocksToPuckItems(AGENT_LEARN, AGENT_EVALUATE);
    const viz = items.find((i) => i.type === "VizBlock")!;
    expect(viz.props.id).toBe("learn-7");
    expect(viz.props.vizType).toBe("mathviz_manim");
    const parsed = JSON.parse(viz.props.metadata as string);
    expect(parsed.title).toBe("Pendulum");

    const mcq = items.find((i) => i.type === "MCQBlock")!;
    expect((mcq.props.options as string).split("\n")).toHaveLength(4);
    expect(mcq.props.correctAnswer).toBe("Pulls objects together");
  });

  it("handles empty input without error", () => {
    expect(agentBlocksToPuckItems([], [])).toHaveLength(0);
    expect(
      agentBlocksToPuckItems(undefined as unknown as LearnBlockRaw[], undefined as unknown as EvaluateBlockRaw[]),
    ).toHaveLength(0);
  });
});

describe("insert-then-save round trip (the chat agent auto-insert flow)", () => {
  it("all agent block types survive save serialization with field parity", () => {
    const existing: PuckData = {
      content: [{ type: "TextBlock", props: { id: "existing-1", content: "Existing intro text." } }],
      root: {},
      zones: {},
    };

    const newItems = agentBlocksToPuckItems(AGENT_LEARN, AGENT_EVALUATE);
    const merged: PuckData = {
      ...existing,
      content: [...(existing.content ?? []), ...newItems],
    };
    expect(merged.content).toHaveLength(1 + 15);

    const { learnBlocks, evaluateBlocks } = puckToWaveData(merged);

    // existing + 10 learn
    expect(learnBlocks).toHaveLength(11);
    expect(evaluateBlocks).toHaveLength(5);

    // Verify every type round-trips with exact field parity.
    expect(learnBlocks[1]).toEqual({ id: "learn-1", type: "text", content: "Gravity pulls objects toward Earth.", metadata: null });
    expect(learnBlocks[2]).toEqual({ id: "learn-2", type: "formula", content: "F = G(m1 m2)/r^2", metadata: null });
    expect(learnBlocks[3]).toEqual({ id: "learn-3", type: "image", content: "https://cdn.example.com/gravity.png", metadata: "Diagram of falling objects" });
    expect(learnBlocks[4]).toEqual({ id: "learn-4", type: "video", content: "https://www.youtube.com/watch?v=abc123", metadata: "Gravity explained" });
    expect(learnBlocks[5]).toEqual({ id: "learn-5", type: "callout", content: "Remember: mass attracts mass.", metadata: null });
    expect(learnBlocks[6]).toEqual({ id: "learn-6", type: "example", content: "A 70kg person weighs 686N on Earth.", metadata: null });
    expect(learnBlocks[7].type).toBe("mathviz_manim");
    expect(learnBlocks[7].metadata).toContain("Pendulum");
    expect(learnBlocks[8].type).toBe("chemviz_3dmol");
    expect(learnBlocks[9].type).toBe("elecsim_tscircuit");
    expect(learnBlocks[10].type).toBe("mechsim_matterjs");

    expect(evaluateBlocks[0]).toEqual({
      id: "eval-1",
      type: "multiple_choice",
      question: "What does gravity do?",
      options: ["Pulls objects together", "Pushes objects apart", "Does nothing", "Makes things float"],
      correctAnswer: "Pulls objects together",
      explanation: "Gravity is an attractive force.",
      metadata: null,
    });
    expect(evaluateBlocks[1]).toEqual({
      id: "eval-2",
      type: "fill_in_the_blank",
      question: "The acceleration due to gravity is approximately ___ m/s^2.",
      options: null,
      correctAnswer: "9.8",
      explanation: "Standard value on Earth.",
      metadata: null,
    });
    expect(evaluateBlocks[2]).toEqual({
      id: "eval-3",
      type: "true_false",
      question: "The Moon has weaker gravity than Earth.",
      options: null,
      correctAnswer: "True",
      explanation: "Smaller mass means weaker gravity.",
      metadata: null,
    });
    expect(evaluateBlocks[3]).toEqual({
      id: "eval-4",
      type: "numeric",
      question: "What is the value of g on Earth in m/s^2?",
      options: null,
      correctAnswer: "9.8",
      explanation: "Standard value.",
      metadata: null,
    });
    expect(evaluateBlocks[4]).toEqual({
      id: "eval-5",
      type: "drag_and_drop",
      question: "Match each planet to its gravity strength.",
      options: null,
      correctAnswer: "Earth: 9.8, Moon: 1.6",
      explanation: "Larger mass means stronger gravity.",
      metadata: null,
    });
  });

  it("reloading the saved wave reproduces the same Puck blocks (editor reload path)", () => {
    const { learnBlocks, evaluateBlocks } = puckToWaveData({
      content: [...agentBlocksToPuckItems(AGENT_LEARN, AGENT_EVALUATE)],
      root: {},
      zones: {},
    });

    const rebuilt = waveDataToPuck(learnBlocks, evaluateBlocks);
    expect(rebuilt.content).toHaveLength(15);

    // Spot-check the distinctive mappings survive the full cycle.
    const byType = new Map(rebuilt.content.map((i) => [i.type, i]));
    expect(byType.get("TextBlock")?.props.content).toBe(AGENT_LEARN[0].content);
    expect(byType.get("MathViz")?.props.formula).toBe(AGENT_LEARN[1].content);
    expect(byType.get("ImageBlock")?.props.src).toBe(AGENT_LEARN[2].content);
    expect(byType.get("VideoBlock")?.props.src).toBe(AGENT_LEARN[3].content);
    expect(byType.get("CalloutBlock")?.props.content).toBe(AGENT_LEARN[4].content);
    expect(byType.get("ExampleBlock")?.props.content).toBe(AGENT_LEARN[5].content);
    const manimViz = rebuilt.content.find((i) => i.type === "VizBlock" && i.props.vizType === "mathviz_manim");
    expect(manimViz?.props.vizType).toBe("mathviz_manim");
    expect(manimViz?.props.id).toBe("learn-7");
    const chemViz = rebuilt.content.find((i) => i.type === "VizBlock" && i.props.vizType === "chemviz_3dmol");
    expect(chemViz?.props.vizType).toBe("chemviz_3dmol");
    expect(byType.get("MCQBlock")?.props.question).toBe(AGENT_EVALUATE[0].question);
    expect(byType.get("FillBlankBlock")?.props.question).toBe(AGENT_EVALUATE[1].question);
    expect(byType.get("TrueFalseBlock")?.props.correctAnswer).toBe("True");
    expect(byType.get("NumericBlock")?.props.correctAnswer).toBe("9.8");
    expect(byType.get("DragDropBlock")?.props.question).toBe(AGENT_EVALUATE[4].question);
  });
});
