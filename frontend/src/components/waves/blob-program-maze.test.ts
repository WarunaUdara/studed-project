import { describe, expect, it } from "vitest";
import { BlobProgramMaze } from "./BlobProgramMaze";

describe("BlobProgramMaze CS Module Component", () => {
  it("exports BlobProgramMaze component", () => {
    expect(typeof BlobProgramMaze).toBe("function");
  });
});
