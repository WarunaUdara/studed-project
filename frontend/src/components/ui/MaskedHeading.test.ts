import { describe, expect, it } from "vitest";
import { MaskedHeading } from "@/components/ui/MaskedHeading";

describe("MaskedHeading component", () => {
  it("exports MaskedHeading component function", () => {
    expect(MaskedHeading).toBeDefined();
    expect(typeof MaskedHeading).toBe("function");
  });
});
