import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ThemePullCord } from "@/components/layout/ThemePullCord";

describe("ThemePullCord Component", () => {
  it("exports a valid ThemePullCord React component", () => {
    expect(typeof ThemePullCord).toBe("function");
  });

  it("keeps the decorative cord out of mobile and tablet content", () => {
    const markup = renderToStaticMarkup(createElement(ThemePullCord));

    expect(markup).toContain("hidden select-none lg:block");
    expect(markup).toContain('aria-label="Toggle dark and light theme"');
  });
});
