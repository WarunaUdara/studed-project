import { describe, expect, it } from "vitest";

import {
  agentBlocksToPuckItems,
  puckToWaveData,
  waveDataToPuck,
  type LearnBlockRaw,
  type EvaluateBlockRaw,
  type PuckData,
} from "@/components/puck-blocks/puck-config";

// Realistic agent output (matches what /v1/agent/stream emits on "done").
const AGENT_LEARN: LearnBlockRaw[] = [
  { id: "learn-1", type: "text", content: "Gravity pulls objects toward Earth." },
  { id: "learn-2", type: "math", content: "F = G(m1 m2)/r^2" },
  { id: "learn-3", type: "image", content: "https://cdn.example.com/gravity.png", metadata: "Diagram of falling objects" },
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
    type: "drag_drop",
    question: "Match each planet to its gravity strength.",
    correctAnswer: "Earth: 9.8, Moon: 1.6",
    explanation: "Larger mass means stronger gravity.",
  },
];

describe("agentBlocksToPuckItems", () => {
  it("converts every learn and evaluate block into a Puck item", () => {
    const items = agentBlocksToPuckItems(AGENT_LEARN, AGENT_EVALUATE);
    expect(items).toHaveLength(6);
    expect(items[0]).toMatchObject({ type: "TextBlock" });
    expect(items[1]).toMatchObject({ type: "MathViz" });
    expect(items[2]).toMatchObject({ type: "ImageBlock" });
    expect(items[3]).toMatchObject({ type: "MCQBlock" });
    expect(items[4]).toMatchObject({ type: "FillBlankBlock" });
    expect(items[5]).toMatchObject({ type: "DragDropBlock" });
  });

  it("handles empty input without error", () => {
    expect(agentBlocksToPuckItems([], [])).toHaveLength(0);
    expect(agentBlocksToPuckItems(undefined as unknown as LearnBlockRaw[], undefined as unknown as EvaluateBlockRaw[])).toHaveLength(0);
  });

  it("preserves ids and content through conversion", () => {
    const items = agentBlocksToPuckItems(AGENT_LEARN, AGENT_EVALUATE);
    expect(items[0].props.id).toBe("learn-1");
    expect(items[0].props.content).toBe("Gravity pulls objects toward Earth.");
    expect(items[3].props.id).toBe("eval-1");
    expect((items[3].props.options as string).split("\n")).toHaveLength(4);
  });
});

describe("insert-then-save round trip (the chat agent insert flow)", () => {
  it("agent blocks appended to a wave survive save serialization unchanged", () => {
    // Start with existing wave content, as an educator would see it.
    const existing: PuckData = {
      content: [
        { type: "TextBlock", props: { id: "existing-1", content: "Existing intro text." } },
      ],
      root: {},
      zones: {},
    };

    // 1. Agent finishes; panel converts its blocks to Puck items.
    const newItems = agentBlocksToPuckItems(AGENT_LEARN, AGENT_EVALUATE);

    // 2. Editor appends them to the live content (handleInsertBlocks).
    const merged: PuckData = {
      ...existing,
      content: [...(existing.content ?? []), ...newItems],
    };
    expect(merged.content).toHaveLength(1 + 6);

    // 3. Save serializes back to GraphQL inputs (puckToWaveData).
    const { learnBlocks, evaluateBlocks } = puckToWaveData(merged);

    // 4. The original agent blocks must round-trip exactly (field equality,
    //    order preserved, existing content untouched). The existing
    //    TextBlock serializes first as a learn block, then the agent's.
    expect(learnBlocks).toHaveLength(4);
    expect(evaluateBlocks).toHaveLength(3);

    expect(learnBlocks[0]).toEqual({
      id: "existing-1",
      type: "text",
      content: "Existing intro text.",
      metadata: null,
    });
    expect(learnBlocks[1]).toEqual({
      id: "learn-1",
      type: "text",
      content: "Gravity pulls objects toward Earth.",
      metadata: null,
    });
    expect(learnBlocks[2]).toEqual({
      id: "learn-2",
      type: "formula",
      content: "F = G(m1 m2)/r^2",
      metadata: null,
    });
    expect(learnBlocks[3]).toEqual({
      id: "learn-3",
      type: "image",
      content: "https://cdn.example.com/gravity.png",
      metadata: "Diagram of falling objects",
    });

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
      type: "drag_and_drop",
      question: "Match each planet to its gravity strength.",
      options: null,
      correctAnswer: "Earth: 9.8, Moon: 1.6",
      explanation: "Larger mass means stronger gravity.",
      metadata: null,
    });
  });

  it("reloading the saved wave reproduces the same Puck blocks (editor reload path)", () => {
    // Simulate: agent blocks inserted -> saved -> wave fetched again -> the
    // editor rebuilds Puck data via waveDataToPuck. Nothing may be lost.
    const { learnBlocks, evaluateBlocks } = puckToWaveData({
      content: [
        ...agentBlocksToPuckItems(AGENT_LEARN, AGENT_EVALUATE),
      ],
      root: {},
      zones: {},
    });

    const rebuilt = waveDataToPuck(learnBlocks, evaluateBlocks);
    expect(rebuilt.content).toHaveLength(6);
    expect(rebuilt.content[0]).toMatchObject({ type: "TextBlock", props: { id: "learn-1", content: AGENT_LEARN[0].content } });
    expect(rebuilt.content[1]).toMatchObject({ type: "MathViz", props: { id: "learn-2", formula: AGENT_LEARN[1].content } });
    expect(rebuilt.content[2]).toMatchObject({ type: "ImageBlock", props: { id: "learn-3", src: AGENT_LEARN[2].content } });
    expect(rebuilt.content[3]).toMatchObject({ type: "MCQBlock", props: { id: "eval-1", question: AGENT_EVALUATE[0].question } });
    expect(rebuilt.content[4]).toMatchObject({ type: "FillBlankBlock", props: { id: "eval-2", question: AGENT_EVALUATE[1].question } });
    expect(rebuilt.content[5]).toMatchObject({ type: "DragDropBlock", props: { id: "eval-3", question: AGENT_EVALUATE[2].question } });
  });
});
