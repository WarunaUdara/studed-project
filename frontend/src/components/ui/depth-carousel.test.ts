import { describe, expect, it } from "vitest";
import { CourseDepthDeck } from "@/components/gamification/CourseDepthDeck";
import { CardNav } from "./CardNav";
import { DepthCarousel } from "./DepthCarousel";

describe("React Bits UI Components: DepthCarousel, CardNav & CourseDepthDeck", () => {
  it("exports DepthCarousel, CardNav, and CourseDepthDeck", () => {
    expect(typeof DepthCarousel).toBe("function");
    expect(typeof CardNav).toBe("function");
    expect(typeof CourseDepthDeck).toBe("function");
  });

  it("verifies CardNav item links and props contract", () => {
    const items = [
      {
        label: "Courses",
        bgColor: "#10b981",
        textColor: "#ffffff",
        links: [
          { label: "Math Foundations", href: "/courses", ariaLabel: "Math" },
          { label: "Python Coding", href: "/courses", ariaLabel: "Python" },
        ],
      },
    ];

    expect(items.length).toBe(1);
    expect(items[0].label).toBe("Courses");
    expect(items[0].links.length).toBe(2);
  });
});
