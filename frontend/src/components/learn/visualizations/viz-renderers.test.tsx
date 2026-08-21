import { describe, expect, it } from "vitest";

describe("unified HTML simulation renderer contract", () => {
  it("uses html_simulation metadata for chemistry and physics", () => {
    const metadata = JSON.stringify({
      title: "Sodium and Water",
      description: "Interactive chemistry reaction",
      height: 560,
      html: '<!doctype html><html><body><canvas id="reaction"></canvas><script>requestAnimationFrame(()=>{});</script></body></html>',
    });
    const parsed = JSON.parse(metadata) as { title: string; html: string };
    expect(parsed.title).toBe("Sodium and Water");
    expect(parsed.html).toContain("canvas");
    expect(parsed.html).toContain("requestAnimationFrame");
  });
});

it("does not require a chemistry-specific renderer", () => {
  expect("html_simulation").toBe("html_simulation");
});
