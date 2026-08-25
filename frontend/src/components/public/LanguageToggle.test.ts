import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LanguageToggle } from "./LanguageToggle";

describe("LanguageToggle", () => {
  it("provides an accessible touch-sized language control", () => {
    const markup = renderToStaticMarkup(createElement(LanguageToggle));

    expect(markup).toContain('aria-label="Toggle language"');
    expect(markup).toContain("min-h-11");
    expect(markup).toContain("focus-visible:ring-2");
  });
});
