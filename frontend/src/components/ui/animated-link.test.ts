import { describe, expect, it } from "vitest";
import {
  Link000,
  Link001,
  Link002,
  Link003,
  Link004,
  Link005,
  Skiper40,
} from "@/components/ui/animated-link";

describe("Animated Link Components (Skiper40)", () => {
  it("exports Link000 through Link005 and Skiper40 components", () => {
    expect(Link000).toBeDefined();
    expect(Link001).toBeDefined();
    expect(Link002).toBeDefined();
    expect(Link003).toBeDefined();
    expect(Link004).toBeDefined();
    expect(Link005).toBeDefined();
    expect(Skiper40).toBeDefined();

    expect(typeof Link000).toBe("function");
    expect(typeof Link001).toBe("function");
    expect(typeof Link002).toBe("function");
    expect(typeof Link003).toBe("function");
    expect(typeof Link004).toBe("function");
    expect(typeof Link005).toBe("function");
    expect(typeof Skiper40).toBe("function");
  });
});
