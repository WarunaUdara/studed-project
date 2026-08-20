import { describe, expect, it } from "vitest";
import { LearnBlockRenderer } from "@/components/learn/LearnBlockRenderer";
import { getScene } from "./animationRegistry";
import { ammeterReading, currentFor } from "./OhmsLawScene";

describe("Ohm's law", () => {
  it("divides voltage by resistance", () => {
    expect(currentFor(12, 4)).toBe(3);
    expect(currentFor(6, 3)).toBe(2);
    expect(currentFor(0, 3)).toBe(0);
  });

  it("treats a resistance of zero as a short rather than a crash", () => {
    expect(currentFor(9, 0)).toBe(Number.POSITIVE_INFINITY);
    expect(ammeterReading(9, 0)).toBe("over range");
  });

  it("reads the meter to two decimals", () => {
    expect(ammeterReading(5, 2)).toBe("2.50 A");
    expect(ammeterReading(1, 3)).toBe("0.33 A");
  });

  it("is available as a learn block and an injectable scene", () => {
    expect(getScene("ohms-law")).not.toBeNull();
    const el = LearnBlockRenderer({
      block: { id: "o1", type: "ohms_law_lab", content: "Set the supply." },
    });
    expect(el.type.name).toBe("OhmsLawLabBlock");
  });
});
