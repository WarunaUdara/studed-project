import { describe, expect, it } from "vitest";
import { LearnBlockRenderer } from "@/components/learn/LearnBlockRenderer";
import { getScene } from "./animationRegistry";
import { simplifyFraction } from "./FractionBarScene";

describe("fraction bar", () => {
  it("reduces a fraction the way a teacher would say it", () => {
    expect(simplifyFraction(2, 4)).toEqual([1, 2]);
    expect(simplifyFraction(6, 8)).toEqual([3, 4]);
    expect(simplifyFraction(3, 5)).toEqual([3, 5]);
  });

  it("leaves zero and whole bars alone", () => {
    expect(simplifyFraction(0, 6)).toEqual([0, 6]);
    expect(simplifyFraction(4, 4)).toEqual([1, 1]);
  });

  it("is injectable as an animation scene and renders as a learn block", () => {
    expect(getScene("fraction-bar")).not.toBeNull();
    const el = LearnBlockRenderer({
      block: { id: "f1", type: "fraction_lab", content: "Cut the bar." },
    });
    expect(el.type.name).toBe("FractionLabBlock");
  });
});
