import { describe, expect, it } from "vitest";

describe("PixelBlast component", () => {
  it("exports valid PixelBlast component", async () => {
    const mod = await import("./PixelBlast");
    expect(mod.PixelBlast).toBeDefined();
    expect(typeof mod.PixelBlast).toBe("function");
  });
});
