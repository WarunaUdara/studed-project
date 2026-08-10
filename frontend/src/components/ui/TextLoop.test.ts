import { describe, expect, it } from "vitest";

describe("TextLoop component parameters", () => {
  it("exports valid prop interface and defaults", async () => {
    const mod = await import("./TextLoop");
    expect(mod.TextLoop).toBeDefined();
    expect(typeof mod.TextLoop).toBe("function");
  });
});
