import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const GSAP_COMPONENTS = [
  "../components/gamification/Confetti.tsx",
  "../components/gamification/StreakFlame.tsx",
  "../components/waves/science/LessonCompleteCelebration.tsx",
] as const;

describe("GSAP easing vocabulary", () => {
  it.each(GSAP_COMPONENTS)("does not pass Framer Motion easing names to %s", (path) => {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");

    expect(source).toContain('from "gsap"');
    expect(source).not.toMatch(/ease:\s*["']ease(?:In|Out|InOut)["']/);
  });
});
