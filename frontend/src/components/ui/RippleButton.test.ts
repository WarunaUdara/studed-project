import { describe, expect, it } from "vitest";
import { RippleButton } from "@/components/ui/RippleButton";

describe("RippleButton component", () => {
  it("exports RippleButton component", () => {
    expect(RippleButton).toBeDefined();
    expect(typeof RippleButton).toBe("object"); // React.forwardRef returns object with $$typeof
  });
});
