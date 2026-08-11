import { describe, expect, it } from "vitest";
import { MagicBento, MagicBentoCard } from "@/components/ui/MagicBento";

describe("MagicBento component", () => {
  it("exports MagicBento and MagicBentoCard components", () => {
    expect(MagicBento).toBeDefined();
    expect(MagicBentoCard).toBeDefined();
    expect(typeof MagicBento).toBe("function");
    expect(typeof MagicBentoCard).toBe("function");
  });
});
