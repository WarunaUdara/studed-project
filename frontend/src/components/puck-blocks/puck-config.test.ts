import { describe, expect, it } from "vitest";

import {
  agentBlocksToPuckItems,
  applyBlockOpsToData,
  type EvaluateBlockRaw,
  type LearnBlockRaw,
  type PuckData,
  puckToWaveData,
  waveDataToPuck,
} from "@/components/puck-blocks/puck-config";

// Realistic agent output covering EVERY learn and evaluate type the agent
// can generate (matches the ai-service block catalog).
const AGENT_LEARN: LearnBlockRaw[] = [
  { id: "learn-1", type: "text", content: "Gravity pulls objects toward Earth." },
  { id: "learn-2", type: "math", content: "F = G(m1 m2)/r^2" },
  {
    id: "learn-3",
    type: "image",
    content: "https://cdn.example.com/gravity.png",
    metadata: "Diagram of falling objects",
  },
  {
    id: "learn-4",
    type: "video",
    content: "https://www.youtube.com/watch?v=abc123",
    metadata: "Gravity explained",
  },
  { id: "learn-5", type: "callout", content: "Remember: mass attracts mass." },
  { id: "learn-6", type: "example", content: "A 70kg person weighs 686N on Earth." },
  {
    id: "learn-7",
    type: "mathviz_manim",
    content: "Pendulum animation",
    metadata: JSON.stringify({
      title: "Pendulum",
      scene_spec: { beats: [{ time: 0, action: "create" }] },
    }),
  },
  {
    id: "learn-8",
    type: "html_simulation",
    content: "Water molecule",
    metadata: JSON.stringify({
      title: "Sodium and water",
      html: "<!doctype html><html><body><canvas></canvas></body></html>",
    }),
  },
  {
    id: "learn-9",
    type: "elecsim_tscircuit",
    content: "LED circuit",
    metadata: JSON.stringify({ title: "LED", circuit_code: "..." }),
  },
  {
    id: "learn-10",
    type: "html_simulation",
    content: "Bouncing ball",
    metadata: JSON.stringify({
      title: "Ball",
      html: "<!doctype html><html><body><canvas></canvas><script>requestAnimationFrame(()=>{});</script></body></html>",
    }),
  },
];

const AGENT_EVALUATE: EvaluateBlockRaw[] = [
  {
    id: "eval-1",
    type: "mcq",
    question: "What does gravity do?",
    options: [
      "Pulls objects together",
      "Pushes objects apart",
      "Does nothing",
      "Makes things float",
    ],
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
      agentBlocksToPuckItems(
        undefined as unknown as LearnBlockRaw[],
        undefined as unknown as EvaluateBlockRaw[],
      ),
    ).toHaveLength(0);
  });
});

describe("insert-then-save round trip (the chat agent auto-insert flow)", () => {
  it("all agent block types survive save serialization with field parity", () => {
    const existing: PuckData = {
      content: [
        { type: "TextBlock", props: { id: "existing-1", content: "Existing intro text." } },
      ],
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
    expect(learnBlocks[4]).toEqual({
      id: "learn-4",
      type: "video",
      content: "https://www.youtube.com/watch?v=abc123",
      metadata: "Gravity explained",
    });
    expect(learnBlocks[5]).toEqual({
      id: "learn-5",
      type: "callout",
      content: "Remember: mass attracts mass.",
      metadata: null,
    });
    expect(learnBlocks[6]).toEqual({
      id: "learn-6",
      type: "example",
      content: "A 70kg person weighs 686N on Earth.",
      metadata: null,
    });
    expect(learnBlocks[7].type).toBe("mathviz_manim");
    expect(learnBlocks[7].metadata).toContain("Pendulum");
    expect(learnBlocks[8].type).toBe("html_simulation");
    expect(learnBlocks[9].type).toBe("elecsim_tscircuit");
    expect(learnBlocks[10].type).toBe("html_simulation");

    expect(evaluateBlocks[0]).toEqual({
      id: "eval-1",
      type: "multiple_choice",
      question: "What does gravity do?",
      options: [
        "Pulls objects together",
        "Pushes objects apart",
        "Does nothing",
        "Makes things float",
      ],
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
    const manimViz = rebuilt.content.find(
      (i) => i.type === "VizBlock" && i.props.vizType === "mathviz_manim",
    );
    expect(manimViz?.props.vizType).toBe("mathviz_manim");
    expect(manimViz?.props.id).toBe("learn-7");
    // All interactive simulations use the unified HtmlSimulationBlock.
    const chemViz = rebuilt.content.find(
      (i) => i.type === "HtmlSimulationBlock" && i.props.id === "learn-8",
    );
    expect(chemViz?.type).toBe("HtmlSimulationBlock");
    const circuitViz = rebuilt.content.find(
      (i) => i.type === "CircuitBlock" && i.props.vizType === "elecsim_tscircuit",
    );
    expect(circuitViz?.props.vizType).toBe("elecsim_tscircuit");
    expect(circuitViz?.props.circuitCode).toBe("...");
    const physicsViz = rebuilt.content.find((i) => i.type === "HtmlSimulationBlock");
    expect(physicsViz?.type).toBe("HtmlSimulationBlock");
    expect(byType.get("MCQBlock")?.props.question).toBe(AGENT_EVALUATE[0].question);
    expect(byType.get("FillBlankBlock")?.props.question).toBe(AGENT_EVALUATE[1].question);
    expect(byType.get("TrueFalseBlock")?.props.correctAnswer).toBe("True");
    expect(byType.get("NumericBlock")?.props.correctAnswer).toBe("9.8");
    expect(byType.get("DragDropBlock")?.props.question).toBe(AGENT_EVALUATE[4].question);
  });
});

// ---------------------------------------------------------------------------
// Block operations (agent edit / delete) applied to a Puck document
// ---------------------------------------------------------------------------

function sampleDoc(): PuckData {
  return waveDataToPuck(
    [
      { id: "l1", type: "text", content: "Intro" },
      { id: "l2", type: "callout", content: "Tip" },
    ],
    [{ id: "q1", type: "mcq", question: "Which?", options: ["A", "B"], correctAnswer: "A" }],
  );
}

describe("applyBlockOpsToData", () => {
  it("deletes blocks by id", () => {
    const doc = sampleDoc();
    const next = applyBlockOpsToData(doc, { deleteIDs: ["l1", "q1"] });
    expect(next.content.map((i) => i.props.id)).toEqual(["l2"]);
  });

  it("updates existing blocks in place by id", () => {
    const doc = sampleDoc();
    const next = applyBlockOpsToData(doc, {
      upsertLearn: [{ id: "l1", type: "text", content: "Updated intro" }],
    });
    expect(next.content).toHaveLength(3);
    const l1 = next.content.find((i) => i.props.id === "l1");
    expect(l1?.props.content).toBe("Updated intro");
    // unchanged blocks keep their position/content
    expect(next.content.map((i) => i.props.id)).toEqual(["l1", "l2", "q1"]);
  });

  it("appends new blocks and preserves order", () => {
    const doc = sampleDoc();
    const next = applyBlockOpsToData(doc, {
      upsertLearn: [{ id: "l3", type: "example", content: "New example" }],
      upsertEval: [{ id: "q2", type: "true_false", question: "True?", correctAnswer: "True" }],
    });
    expect(next.content.map((i) => i.props.id)).toEqual(["l1", "l2", "q1", "l3", "q2"]);
  });

  it("combines delete + upsert in one op set", () => {
    const doc = sampleDoc();
    const next = applyBlockOpsToData(doc, {
      deleteIDs: ["q1"],
      upsertLearn: [{ id: "l2", type: "callout", content: "Better tip" }],
    });
    expect(next.content.map((i) => i.props.id)).toEqual(["l1", "l2"]);
    expect(next.content.find((i) => i.props.id === "l2")?.props.content).toBe("Better tip");
  });

  it("is a no-op for empty ops", () => {
    const doc = sampleDoc();
    const next = applyBlockOpsToData(doc, {});
    expect(next.content).toEqual(doc.content);
  });
});

// Interactive content must survive a trip through the educator editor. Before
// these blocks were mapped, opening a physics wave and saving it rewrote every
// lab as plain text and every manipulation as a generic drag and drop.
describe("interactive blocks round-trip through the editor", () => {
  const INTERACTIVE_LEARN: LearnBlockRaw[] = [
    {
      id: "lb-dialog",
      type: "blob_dialog",
      content: "Hello! I am Blobby.",
      metadata: JSON.stringify({ version: 1, lines: [{ id: "l1", text: "Hello! I am Blobby." }] }),
    },
    {
      id: "lb-force",
      type: "force_lab",
      content: "Push the cart.",
      metadata: JSON.stringify({ version: 1, label: "Toy cart" }),
    },
    {
      id: "lb-circuit",
      type: "circuit_lab",
      content: "Light the bulb.",
      metadata: JSON.stringify({ version: 1, solution: { "slot-top": "wire" } }),
    },
    {
      id: "lb-water",
      type: "water_flow",
      content: "Watch the drops.",
      metadata: JSON.stringify({ version: 1 }),
    },
    {
      id: "lb-anim",
      type: "animation",
      content: "force-arrows",
      metadata: JSON.stringify({ version: 1, scene: "force-arrows", params: { push: 8 } }),
    },
  ];

  const INTERACTIVE_EVALUATE: EvaluateBlockRaw[] = [
    {
      id: "eb-tap",
      type: "tap_target",
      question: "Which one is a pull?",
      correctAnswer: "drawer",
      explanation: "It comes towards you.",
      metadata: JSON.stringify({
        version: 1,
        targets: [{ id: "drawer", label: "Opening a drawer" }],
      }),
    },
    {
      id: "eb-order",
      type: "order_steps",
      question: "Put these in order.",
      correctAnswer: "push>roll",
      explanation: "You push first.",
      metadata: JSON.stringify({ version: 1, steps: [{ id: "push", label: "Push" }] }),
    },
  ];

  it("maps each interactive type to its own editor block", () => {
    const data = waveDataToPuck(INTERACTIVE_LEARN, INTERACTIVE_EVALUATE);
    const types = data.content.map((item) => item.type);
    expect(types).toEqual([
      "BlobDialogBlock",
      "PhysicsLabBlock",
      "PhysicsLabBlock",
      "PhysicsLabBlock",
      "AnimationBlock",
      "InteractiveQuestionBlock",
      "InteractiveQuestionBlock",
    ]);
  });

  it("preserves type, content and metadata when saved back", () => {
    const saved = puckToWaveData(waveDataToPuck(INTERACTIVE_LEARN, INTERACTIVE_EVALUATE));

    expect(saved.learnBlocks.map((block) => block.type)).toEqual([
      "blob_dialog",
      "force_lab",
      "circuit_lab",
      "water_flow",
      "animation",
    ]);
    for (const original of INTERACTIVE_LEARN) {
      const round = saved.learnBlocks.find((block) => block.id === original.id);
      expect(round?.content).toBe(original.content);
      expect(JSON.parse(round?.metadata ?? "{}")).toMatchObject(
        JSON.parse(original.metadata ?? "{}"),
      );
    }

    expect(saved.evaluateBlocks.map((block) => block.type)).toEqual(["tap_target", "order_steps"]);
    for (const original of INTERACTIVE_EVALUATE) {
      const round = saved.evaluateBlocks.find((block) => block.id === original.id);
      expect(round?.question).toBe(original.question);
      expect(round?.correctAnswer).toBe(original.correctAnswer);
      expect(round?.explanation).toBe(original.explanation);
      expect(round?.metadata).toBe(original.metadata);
    }
  });

  it("keeps the scene the educator picked when saving an animation", () => {
    const data = waveDataToPuck([INTERACTIVE_LEARN[4]], []);
    data.content[0].props.scene = "water-flow";
    const saved = puckToWaveData(data);
    expect(saved.learnBlocks[0].content).toBe("water-flow");
    expect(JSON.parse(saved.learnBlocks[0].metadata ?? "{}").scene).toBe("water-flow");
  });
});
