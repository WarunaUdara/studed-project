export type CoordinatePlaneMode = "move_axis" | "move_plane" | "select_point" | "vector_demo";

export interface Point {
  x: number;
  y: number;
}

export interface CoordinatePlaneStep {
  id: string;
  title: string;
  instruction: string;
  mode: CoordinatePlaneMode;
  axis?: "x" | "y";
  initial?: Point;
  target: Point;
  candidatePoints?: Point[];
  explanation: string;
}

export interface GridBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface CoordinatePlaneConfig {
  title?: string;
  grid?: Partial<GridBounds>;
  steps?: CoordinatePlaneStep[];
}

const DEFAULT_GRID: GridBounds = { xMin: 0, xMax: 6, yMin: 0, yMax: 6 };

export const DEFAULT_STEPS: CoordinatePlaneStep[] = [
  {
    id: "step-1",
    title: "1. Horizontal Movement (x-axis)",
    instruction: "Move the point 3 grid steps to the right along the x-axis.",
    mode: "move_axis",
    axis: "x",
    initial: { x: 0, y: 0 },
    target: { x: 3, y: 0 },
    explanation:
      "The horizontal line is the x-axis. Moving right increases the x-coordinate from 0 to 3.",
  },
  {
    id: "step-2",
    title: "2. Vertical Movement (y-axis)",
    instruction: "Now move the point 2 grid steps up along the y-axis.",
    mode: "move_axis",
    axis: "y",
    initial: { x: 0, y: 0 },
    target: { x: 0, y: 2 },
    explanation:
      "The vertical line is the y-axis. Moving up increases the y-coordinate from 0 to 2.",
  },
  {
    id: "step-3",
    title: "3. Moving in Two Dimensions",
    instruction: "Move the point 3 steps right and 2 steps up to reach (3, 2).",
    mode: "move_plane",
    initial: { x: 0, y: 0 },
    target: { x: 3, y: 2 },
    explanation:
      "Combine the two axes: 3 steps right sets x = 3, then 2 steps up sets y = 2. The pair is (3, 2).",
  },
  {
    id: "step-4",
    title: "4. Vector & Displacements",
    instruction:
      "Observe how horizontal and vertical distances reach point (5, 4) from the origin.",
    mode: "vector_demo",
    initial: { x: 0, y: 0 },
    target: { x: 5, y: 4 },
    explanation:
      "From the origin we go 5 steps right along the x-axis, then 4 steps up along the y-axis to reach (5, 4).",
  },
  {
    id: "step-5",
    title: "5. Plotting Coordinate Pairs",
    instruction: "Select the point that is 3 steps right and 1 step up from the origin.",
    mode: "select_point",
    target: { x: 3, y: 1 },
    candidatePoints: [
      { x: 3, y: 3 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
      { x: 3, y: 1 },
    ],
    explanation:
      "Starting at origin (0,0): 3 steps right gives x = 3, 1 step up gives y = 1, so the pair is (3, 1).",
  },
  {
    id: "step-6",
    title: "6. Identifying Coordinates",
    instruction: "Find point (4, 3) on the coordinate grid.",
    mode: "select_point",
    target: { x: 4, y: 3 },
    candidatePoints: [
      { x: 2, y: 4 },
      { x: 4, y: 3 },
      { x: 3, y: 4 },
      { x: 4, y: 2 },
      { x: 1, y: 3 },
    ],
    explanation:
      "Coordinates are written as (x, y). First number = horizontal shift, second = vertical shift.",
  },
];

export function parseConfig(metadata?: string | null): CoordinatePlaneConfig {
  if (!metadata) return {};
  try {
    const parsed = JSON.parse(metadata) as Record<string, unknown>;
    const config: CoordinatePlaneConfig = {};
    if (typeof parsed.title === "string") config.title = parsed.title;
    if (parsed.grid && typeof parsed.grid === "object") {
      config.grid = parsed.grid as Partial<GridBounds>;
    }
    if (Array.isArray(parsed.steps)) {
      config.steps = parsed.steps as CoordinatePlaneStep[];
    }
    return config;
  } catch {
    return {};
  }
}

export function resolveGrid(grid?: Partial<GridBounds>): GridBounds {
  return {
    xMin: grid?.xMin ?? DEFAULT_GRID.xMin,
    xMax: grid?.xMax ?? DEFAULT_GRID.xMax,
    yMin: grid?.yMin ?? DEFAULT_GRID.yMin,
    yMax: grid?.yMax ?? DEFAULT_GRID.yMax,
  };
}

export function isPointInGrid(point: Point, grid: GridBounds): boolean {
  return (
    point.x >= grid.xMin && point.x <= grid.xMax && point.y >= grid.yMin && point.y <= grid.yMax
  );
}

export function stepTargetsMatch(point: Point | null, target: Point | null | undefined): boolean {
  if (!point || !target) return false;
  return point.x === target.x && point.y === target.y;
}
