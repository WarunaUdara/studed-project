import { describe, expect, it } from "vitest";
import {
  CardStackCarousel,
  DEFAULT_STUDENT_CARDS,
} from "@/components/ui/CardStackCarousel";

describe("CardStackCarousel (GSAP Card Swipe Stack)", () => {
  it("exports CardStackCarousel component", () => {
    expect(CardStackCarousel).toBeDefined();
    expect(typeof CardStackCarousel).toBe("function");
  });

  it("contains rich default student course cards", () => {
    expect(DEFAULT_STUDENT_CARDS).toBeDefined();
    expect(DEFAULT_STUDENT_CARDS.length).toBeGreaterThanOrEqual(4);

    for (const card of DEFAULT_STUDENT_CARDS) {
      expect(card.id).toBeDefined();
      expect(card.title).toBeDefined();
      expect(card.levelName).toBeDefined();
      expect(card.steps.length).toBeGreaterThan(0);
      expect(card.illustrationSvg).toBeDefined();
    }
  });
});
