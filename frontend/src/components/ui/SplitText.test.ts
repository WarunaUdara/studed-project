import { describe, expect, it } from "vitest";

describe("SplitText component exports", () => {
  it("exports valid SplitText component", async () => {
    const mod = await import("./SplitText");
    expect(mod.SplitText).toBeDefined();
    expect(typeof mod.SplitText).toBe("function");
  }, 15000);
});
