import { describe, expect, it } from "vitest";

describe("ScrollExpand component", () => {
  it("exports valid ScrollExpand component", async () => {
    const mod = await import("./ScrollExpand");
    expect(mod.ScrollExpand).toBeDefined();
    expect(typeof mod.ScrollExpand).toBe("function");
  });
});
