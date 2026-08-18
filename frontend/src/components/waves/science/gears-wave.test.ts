import { describe, expect, it } from "vitest";
import { GearGraphSvg } from "./GearGraphSvg";
import {
  SCIENCE_GEAR_PUZZLES,
  solveGearDirections,
} from "./gear-network-engine";
import { generateGearPath, GearTrainSvg, SingleGear } from "./GearTrainSvg";
import { InteractiveGearTrain } from "./InteractiveGearTrain";
import { ScienceGearsWave } from "./ScienceGearsWave";
import { ScientificThinkingGearsMaster } from "./ScientificThinkingGearsMaster";

describe("Science Gears Graph & Wave Engine", () => {
  it("exports all science gear components and master wave runner", () => {
    expect(typeof GearTrainSvg).toBe("function");
    expect(typeof SingleGear).toBe("function");
    expect(typeof InteractiveGearTrain).toBe("function");
    expect(typeof GearGraphSvg).toBe("function");
    expect(typeof ScienceGearsWave).toBe("function");
    expect(typeof ScientificThinkingGearsMaster).toBe("function");
  });

  it("solves BFS gear rotation directions for branched networks correctly", () => {
    const puzzle = SCIENCE_GEAR_PUZZLES.find((p) => p.id === "curved-six-gear-arch")!;
    const { directions, depths } = solveGearDirections(
      puzzle.nodes,
      puzzle.edges,
      puzzle.driverId,
      -1,
    );

    expect(directions["g0"]).toBe(-1); // Driver (Counter-Clockwise)
    expect(directions["g1"]).toBe(1);  // Clockwise
    expect(directions["g2"]).toBe(-1); // Counter-Clockwise
    expect(directions["g3"]).toBe(1);  // Clockwise
    expect(directions["g4"]).toBe(-1); // Counter-Clockwise
    expect(directions["g5"]).toBe(1);  // Clockwise (Opposite!)

    expect(depths["g5"]).toBe(5);
  });

  it("generates closed SVG path for gear teeth", () => {
    const path = generateGearPath(14, 38);
    expect(typeof path).toBe("string");
    expect(path.startsWith("M")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
  });
});
