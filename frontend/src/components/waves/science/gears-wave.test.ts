import { describe, expect, it } from "vitest";
import { DailyLessonLimitGate } from "./DailyLessonLimitGate";
import { GearGraphSvg } from "./GearGraphSvg";
import { GearTrainSvg, generateGearPath, SingleGear } from "./GearTrainSvg";
import { SCIENCE_GEAR_PUZZLES, solveGearDirections } from "./gear-network-engine";
import { InteractiveGearTrain } from "./InteractiveGearTrain";
import { LessonCompleteCelebration } from "./LessonCompleteCelebration";
import { ScienceGearsWave } from "./ScienceGearsWave";
import { ScientificThinkingGearsMaster } from "./ScientificThinkingGearsMaster";

describe("Science Gears Graph & Wave Engine", () => {
  it("exports all science gear components, celebrations, and master wave runner", () => {
    expect(typeof GearTrainSvg).toBe("function");
    expect(typeof SingleGear).toBe("function");
    expect(typeof InteractiveGearTrain).toBe("function");
    expect(typeof GearGraphSvg).toBe("function");
    expect(typeof ScienceGearsWave).toBe("function");
    expect(typeof ScientificThinkingGearsMaster).toBe("function");
    expect(typeof LessonCompleteCelebration).toBe("function");
    expect(typeof DailyLessonLimitGate).toBe("function");
  });

  it("solves BFS gear rotation directions for the 7-gear cluster correctly", () => {
    const puzzle = SCIENCE_GEAR_PUZZLES.find((p) => p.id === "seven-gear-branched-cluster")!;
    const { directions, depths } = solveGearDirections(
      puzzle.nodes,
      puzzle.edges,
      puzzle.driverId,
      -1,
    );

    // Driver g0 (Yellow) is Counter-Clockwise (-1)
    expect(directions["g0"]).toBe(-1);
    expect(depths["g0"]).toBe(0);

    // g1 is Depth 1 (Clockwise, 1)
    expect(directions["g1"]).toBe(1);
    expect(depths["g1"]).toBe(1);

    // g2 (bottom-left) and g3 (center) are Depth 2 (Counter-Clockwise, -1 -> Same direction!)
    expect(directions["g2"]).toBe(-1);
    expect(depths["g2"]).toBe(2);
    expect(directions["g3"]).toBe(-1);
    expect(depths["g3"]).toBe(2);

    // g6 (top-right) is Depth 4 (Counter-Clockwise, -1 -> Same direction!)
    expect(directions["g6"]).toBe(-1);
    expect(depths["g6"]).toBe(4);
  });

  it("generates closed SVG path for gear teeth", () => {
    const path = generateGearPath(14, 38);
    expect(typeof path).toBe("string");
    expect(path.startsWith("M")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
  });
});
