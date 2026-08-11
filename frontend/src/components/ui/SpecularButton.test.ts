import { describe, expect, it } from "vitest";
import { SpecularButton } from "@/components/ui/SpecularButton";

describe("SpecularButton component", () => {
  it("exports SpecularButton component function", () => {
    expect(SpecularButton).toBeDefined();
    expect(typeof SpecularButton).toBe("function");
  });
});
