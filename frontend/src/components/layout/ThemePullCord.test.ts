import { describe, expect, it } from "vitest";
import { ThemePullCord } from "@/components/layout/ThemePullCord";

describe("ThemePullCord Component", () => {
  it("exports a valid ThemePullCord React component", () => {
    expect(typeof ThemePullCord).toBe("function");
  });
});
