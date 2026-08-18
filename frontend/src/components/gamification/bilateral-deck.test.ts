import { describe, expect, it } from "vitest";
import { BilateralCardDeck } from "./BilateralCardDeck";

describe("BilateralCardDeck Stack Component", () => {
  it("exports BilateralCardDeck component function", () => {
    expect(typeof BilateralCardDeck).toBe("function");
  });
});
