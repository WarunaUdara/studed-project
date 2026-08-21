import { describe, expect, it } from "vitest";
import { LearnBlockRenderer } from "@/components/learn/LearnBlockRenderer";
import { getScene } from "./animationRegistry";
import { moment, tiltAngle } from "./LeverBalanceScene";

describe("lever moments", () => {
  it("multiplies weight by distance from the pivot", () => {
    expect(moment({ position: -3, weight: 4 })).toBe(12);
    expect(moment({ position: 2, weight: 6 })).toBe(12);
    expect(moment(null)).toBe(0);
  });

  it("balances a light weight far out against a heavy weight close in", () => {
    const light = { position: -6, weight: 2 };
    const heavy = { position: 2, weight: 6 };
    expect(tiltAngle(light, heavy)).toBe(0);
  });

  it("tips towards the bigger turning effect", () => {
    expect(tiltAngle({ position: -1, weight: 2 }, { position: 4, weight: 6 })).toBeGreaterThan(0);
    expect(tiltAngle({ position: -4, weight: 6 }, { position: 1, weight: 2 })).toBeLessThan(0);
  });

  it("caps the tilt so a wildly loaded beam still reads as a beam", () => {
    expect(
      Math.abs(tiltAngle({ position: -1, weight: 1 }, { position: 9, weight: 99 })),
    ).toBeLessThanOrEqual(14);
  });

  it("is available as a learn block and as an injectable scene", () => {
    expect(getScene("lever-balance")).not.toBeNull();
    const el = LearnBlockRenderer({
      block: { id: "lv", type: "lever_lab", content: "Balance it." },
    });
    expect(el.type.name).toBe("LeverLabBlock");
  });
});
