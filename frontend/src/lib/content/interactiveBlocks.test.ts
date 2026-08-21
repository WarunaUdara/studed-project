import { describe, expect, it } from "vitest";
import {
  CONTENT_BLOCK_VERSION,
  decodeDragAnswer,
  decodeOrderAnswer,
  decodeSwitchAnswer,
  decodeTapAnswer,
  encodeDragAnswer,
  encodeOrderAnswer,
  encodeSliderAnswer,
  encodeSwitchAnswer,
  encodeTapAnswer,
  isInteractiveEvaluateType,
  isInteractiveLearnType,
  parseBlockConfig,
} from "./interactiveBlocks";

describe("interactive block contract", () => {
  it("pins the block schema version", () => {
    expect(CONTENT_BLOCK_VERSION).toBe(1);
  });

  it("recognizes interactive block types case-insensitively", () => {
    expect(isInteractiveEvaluateType("drag_drop")).toBe(true);
    expect(isInteractiveEvaluateType("TAP_TARGET")).toBe(true);
    expect(isInteractiveEvaluateType("multiple_choice")).toBe(false);
    expect(isInteractiveLearnType("circuit_lab")).toBe(true);
    expect(isInteractiveLearnType("text")).toBe(false);
  });
});

describe("parseBlockConfig", () => {
  it("passes through objects and parses JSON strings", () => {
    expect(parseBlockConfig<{ a: number }>({ a: 1 })).toEqual({ a: 1 });
    expect(parseBlockConfig<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
  });

  it("returns null for missing or malformed metadata instead of throwing", () => {
    expect(parseBlockConfig(null)).toBeNull();
    expect(parseBlockConfig(undefined)).toBeNull();
    expect(parseBlockConfig("   ")).toBeNull();
    expect(parseBlockConfig("{not json")).toBeNull();
    expect(parseBlockConfig("42")).toBeNull();
  });
});

describe("canonical answer encoding", () => {
  it("encodes taps order-independently so selection order cannot fail a student", () => {
    expect(encodeTapAnswer(["wire-right", "wire-left"])).toBe("wire-left+wire-right");
    expect(encodeTapAnswer(["Wire-Left"])).toBe("wire-left");
    expect(encodeTapAnswer([])).toBe("");
  });

  it("round-trips tap answers", () => {
    expect(decodeTapAnswer(encodeTapAnswer(["b", "a"]))).toEqual(["a", "b"]);
    expect(decodeTapAnswer("")).toEqual([]);
  });

  it("encodes drag placements sorted by slot and skips empty slots", () => {
    expect(encodeDragAnswer({ "slot-2": "bulb", "slot-1": "battery", "slot-3": "" })).toBe(
      "slot-1:battery,slot-2:bulb",
    );
  });

  it("round-trips drag placements", () => {
    const placements = { "slot-1": "battery", "slot-2": "bulb" };
    expect(decodeDragAnswer(encodeDragAnswer(placements))).toEqual(placements);
  });

  it("keeps ordering answers sequence-sensitive", () => {
    expect(encodeOrderAnswer(["a", "b", "c"])).toBe("a>b>c");
    expect(encodeOrderAnswer(["c", "b", "a"])).not.toBe(encodeOrderAnswer(["a", "b", "c"]));
    expect(decodeOrderAnswer("a>b>c")).toEqual(["a", "b", "c"]);
  });

  it("encodes every switch including the off ones", () => {
    expect(encodeSwitchAnswer({ s2: false, s1: true })).toBe("s1=on,s2=off");
    expect(decodeSwitchAnswer("s1=on,s2=off")).toEqual({ s1: true, s2: false });
  });

  it("maps a slider position onto its band so near-misses still count", () => {
    const bands = [
      { value: "too-little", upTo: 3 },
      { value: "just-right", upTo: 7 },
      { value: "too-much" },
    ];
    expect(encodeSliderAnswer(0, bands)).toBe("too-little");
    expect(encodeSliderAnswer(3, bands)).toBe("too-little");
    expect(encodeSliderAnswer(5, bands)).toBe("just-right");
    expect(encodeSliderAnswer(7, bands)).toBe("just-right");
    expect(encodeSliderAnswer(9, bands)).toBe("too-much");
  });

  it("falls back to the last band when no band matches", () => {
    expect(encodeSliderAnswer(5, [{ value: "low", upTo: 1 }])).toBe("low");
    expect(encodeSliderAnswer(5, [])).toBe("");
  });
});
