import { describe, expect, it } from "vitest";
import { SEARCH_KNOWLEDGE_BASE, SearchAskModal } from "./SearchAskModal";

describe("Search & Ask Engine", () => {
  it("exports SearchAskModal component", () => {
    expect(typeof SearchAskModal).toBe("function");
  });

  it("contains indexed course and wave knowledge items", () => {
    expect(SEARCH_KNOWLEDGE_BASE.length).toBeGreaterThanOrEqual(5);

    const gearItem = SEARCH_KNOWLEDGE_BASE.find((k) => k.title.includes("Connecting Gears"));
    expect(gearItem).toBeDefined();
    expect(gearItem?.category).toBe("Science");
    expect(gearItem?.type).toBe("wave");

    const pythonItem = SEARCH_KNOWLEDGE_BASE.find((k) => k.title.includes("Blob Mascot"));
    expect(pythonItem).toBeDefined();
    expect(pythonItem?.category).toBe("Python");
  });

  it("includes valid navigation links for all items", () => {
    for (const item of SEARCH_KNOWLEDGE_BASE) {
      expect(item.href).toMatch(/^\/(waves|courses)/);
      expect(item.keywords.length).toBeGreaterThan(0);
    }
  });
});
