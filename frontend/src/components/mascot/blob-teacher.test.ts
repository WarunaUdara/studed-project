import { describe, expect, it } from "vitest";
import { LearnBlockRenderer } from "@/components/learn/LearnBlockRenderer";
import { dialogSpeechScript } from "./BlobTeacher";

describe("blob teacher dialog", () => {
  it("exposes one stable speakable string per line for TTS", () => {
    expect(
      dialogSpeechScript([
        { id: "l1", text: "A push makes things move." },
        { id: "l2", text: " Yaay, you got it! ", mood: "cheer" },
      ]),
    ).toEqual(["A push makes things move.", "Yaay, you got it!"]);
  });

  it("skips empty lines rather than speaking silence", () => {
    expect(dialogSpeechScript([{ id: "l1", text: "   " }])).toEqual([]);
  });

  it("renders blob_dialog learn blocks through the teacher", () => {
    const el = LearnBlockRenderer({
      block: {
        id: "b1",
        type: "blob_dialog",
        content: "Hello",
        metadata: JSON.stringify({ version: 1, lines: [{ id: "l1", text: "Hello" }] }),
      },
    });
    expect(el.type.name).toBe("BlobDialogBlock");
  });
});
