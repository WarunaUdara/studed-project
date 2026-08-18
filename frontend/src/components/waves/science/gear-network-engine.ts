export type GearDirection = 1 | -1;

export interface GearNode {
  id: string;
  x: number;
  y: number;
  radius: number;
  teeth: number;
  color?: string;
  shadowColor?: string;
  isDriver?: boolean;
  isTarget?: boolean;
  label?: string;
}

export interface GearEdge {
  from: string;
  to: string;
}

export interface GearNetworkPuzzle {
  id: string;
  title: string;
  subtitle: string;
  type: "multiple_choice" | "tap_to_select" | "learn_demo";
  nodes: GearNode[];
  edges: GearEdge[];
  driverId: string;
  targetId?: string; // For multiple_choice questions (e.g. blue gear)
  driverDirection?: GearDirection; // Default -1 (counter-clockwise)
  teachingNote?: string;
  options?: { label: string; isCorrect: boolean }[];
  explanation: {
    title: string;
    steps: string[];
    rule: string;
  };
}

/**
 * Breadth-First Search (BFS) solver to compute the exact rotation direction
 * and distance (depth) of every gear in any planar gear network graph.
 */
export function solveGearDirections(
  nodes: GearNode[],
  edges: GearEdge[],
  driverId: string,
  driverDir: GearDirection = -1,
): { directions: Record<string, GearDirection>; depths: Record<string, number> } {
  const directions: Record<string, GearDirection> = { [driverId]: driverDir };
  const depths: Record<string, number> = { [driverId]: 0 };

  // Build adjacency list
  const adj: Record<string, string[]> = {};
  nodes.forEach((n) => (adj[n.id] = []));
  edges.forEach((e) => {
    adj[e.from]?.push(e.to);
    adj[e.to]?.push(e.from);
  });

  const queue: string[] = [driverId];
  const visited = new Set<string>([driverId]);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currDir = directions[curr]!;
    const currDepth = depths[curr]!;

    for (const neighbor of adj[curr] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        // Adjacent meshed gear rotates in the opposite direction
        directions[neighbor] = (currDir === 1 ? -1 : 1) as GearDirection;
        depths[neighbor] = currDepth + 1;
        queue.push(neighbor);
      }
    }
  }

  return { directions, depths };
}

/**
 * Unique Science Curated Puzzles (from simple 2-gear adjacent up to complex 7-gear cluster & pinwheel)
 */
export const SCIENCE_GEAR_PUZZLES: GearNetworkPuzzle[] = [
  // Puzzle 0: Learn Demo — 3-Gear Rotating Intro
  {
    id: "intro-chain",
    title: "Connecting Gears",
    subtitle: "Let's use intuition to predict the behavior of a chain of gears.",
    type: "learn_demo",
    driverId: "g0",
    nodes: [
      { id: "g0", x: 60, y: 120, radius: 46, teeth: 14, color: "#84cc16", shadowColor: "#65a30d", isDriver: true },
      { id: "g1", x: 135, y: 120, radius: 46, teeth: 14, color: "#06b6d4", shadowColor: "#0891b2" },
      { id: "g2", x: 210, y: 120, radius: 46, teeth: 14, color: "#94a3b8", shadowColor: "#64748b" },
    ],
    edges: [
      { from: "g0", to: "g1" },
      { from: "g1", to: "g2" },
    ],
    teachingNote: "In any system of gears, each gear spins opposite its neighbors.",
    explanation: {
      title: "How Gears Interact",
      steps: [
        "When you rotate the first gear, its teeth push against the adjacent gear.",
        "Because of the interlocking teeth, the adjacent gear must turn in the opposite direction.",
      ],
      rule: "Adjacent gears always rotate in opposite directions.",
    },
  },

  // Puzzle 1: 3-Gear Linear Prediction
  {
    id: "three-gear-prediction",
    title: "3-Gear Chain Prediction",
    subtitle: "When the yellow gear is turned in one direction, which way does the blue gear turn?",
    type: "multiple_choice",
    driverId: "g0",
    targetId: "g2",
    nodes: [
      { id: "g0", x: 60, y: 110, radius: 44, teeth: 14, color: "#eab308", shadowColor: "#ca8a04", isDriver: true },
      { id: "g1", x: 132, y: 110, radius: 44, teeth: 14, color: "#94a3b8", shadowColor: "#64748b" },
      { id: "g2", x: 204, y: 110, radius: 44, teeth: 14, color: "#3b82f6", shadowColor: "#1d4ed8", isTarget: true },
    ],
    edges: [
      { from: "g0", to: "g1" },
      { from: "g1", to: "g2" },
    ],
    options: [
      { label: "In the same direction.", isCorrect: true },
      { label: "In the opposite direction.", isCorrect: false },
    ],
    explanation: {
      title: "3-Gear Parity",
      steps: [
        "1. Yellow gear rotates Counter-Clockwise (↺).",
        "2. Middle Grey idler gear rotates Clockwise (↻).",
        "3. Blue gear rotates Counter-Clockwise (↺).",
      ],
      rule: "Odd-numbered gears in a simple chain rotate in the SAME direction as the driver!",
    },
  },

  // Puzzle 2: 5-Gear Linear Tap-to-Select
  {
    id: "five-gear-tap",
    title: "5-Gear Chain Synchronization",
    subtitle: "Which gears turn in the same direction as the yellow gear? Tap a gear to select it.",
    type: "tap_to_select",
    driverId: "g0",
    nodes: [
      { id: "g0", x: 45, y: 110, radius: 36, teeth: 12, color: "#eab308", shadowColor: "#ca8a04", isDriver: true },
      { id: "g1", x: 104, y: 110, radius: 36, teeth: 12, color: "#94a3b8", shadowColor: "#64748b" },
      { id: "g2", x: 163, y: 110, radius: 36, teeth: 12, color: "#94a3b8", shadowColor: "#64748b" },
      { id: "g3", x: 222, y: 110, radius: 36, teeth: 12, color: "#94a3b8", shadowColor: "#64748b" },
      { id: "g4", x: 281, y: 110, radius: 36, teeth: 12, color: "#94a3b8", shadowColor: "#64748b" },
    ],
    edges: [
      { from: "g0", to: "g1" },
      { from: "g1", to: "g2" },
      { from: "g2", to: "g3" },
      { from: "g3", to: "g4" },
    ],
    explanation: {
      title: "5-Gear Alternating Sequence",
      steps: [
        "Gear 1 (Yellow): ↺ Same",
        "Gear 2: ↻ Opposite",
        "Gear 3: ↺ Same (Selected ✓)",
        "Gear 4: ↻ Opposite",
        "Gear 5: ↺ Same (Selected ✓)",
      ],
      rule: "Gears at odd positions (1st, 3rd, 5th) match the driver's rotation direction.",
    },
  },

  // Puzzle 3: Curved 6-Gear Arch (Even Parity -> Opposite)
  {
    id: "curved-six-gear-arch",
    title: "Curved 6-Gear Arch",
    subtitle: "When the yellow gear is turned, which direction does the blue gear rotate?",
    type: "multiple_choice",
    driverId: "g0",
    targetId: "g5",
    nodes: [
      { id: "g0", x: 60, y: 60, radius: 34, teeth: 12, color: "#eab308", shadowColor: "#ca8a04", isDriver: true },
      { id: "g1", x: 114, y: 48, radius: 34, teeth: 12, color: "#94a3b8", shadowColor: "#64748b" },
      { id: "g2", x: 168, y: 58, radius: 34, teeth: 12, color: "#94a3b8", shadowColor: "#64748b" },
      { id: "g3", x: 212, y: 92, radius: 34, teeth: 12, color: "#94a3b8", shadowColor: "#64748b" },
      { id: "g4", x: 236, y: 144, radius: 34, teeth: 12, color: "#94a3b8", shadowColor: "#64748b" },
      { id: "g5", x: 224, y: 198, radius: 34, teeth: 12, color: "#3b82f6", shadowColor: "#1d4ed8", isTarget: true },
    ],
    edges: [
      { from: "g0", to: "g1" },
      { from: "g1", to: "g2" },
      { from: "g2", to: "g3" },
      { from: "g3", to: "g4" },
      { from: "g4", to: "g5" },
    ],
    options: [
      { label: "In the same direction.", isCorrect: false },
      { label: "In the opposite direction.", isCorrect: true },
    ],
    explanation: {
      title: "6-Gear Arch Parity",
      steps: [
        "Curving the gear train doesn't alter the adjacency rule.",
        "Since the chain has 6 gears (an EVEN number):",
        "Gear 1 (Yellow) is ↺, so Gear 6 (Blue) must be ↻ (opposite)!",
      ],
      rule: "Even-numbered gears in any chain always rotate in the OPPOSITE direction as the first gear.",
    },
  },

  // Puzzle 4: 7-Gear Tree Cluster (Branching Network)
  {
    id: "seven-gear-cluster",
    title: "7-Gear Branched Cluster",
    subtitle: "Which gears turn in the same direction as the yellow gear? Tap all matching gears.",
    type: "tap_to_select",
    driverId: "g0",
    nodes: [
      { id: "g0", x: 70, y: 180, radius: 32, teeth: 12, color: "#eab308", shadowColor: "#ca8a04", isDriver: true },
      { id: "g1", x: 95, y: 130, radius: 32, teeth: 12, color: "#94a3b8", shadowColor: "#64748b" },
      { id: "g2", x: 50, y: 90, radius: 32, teeth: 12, color: "#94a3b8", shadowColor: "#64748b" },
      { id: "g3", x: 145, y: 110, radius: 32, teeth: 12, color: "#94a3b8", shadowColor: "#64748b" },
      { id: "g4", x: 145, y: 55, radius: 32, teeth: 12, color: "#94a3b8", shadowColor: "#64748b" },
      { id: "g5", x: 195, y: 105, radius: 32, teeth: 12, color: "#94a3b8", shadowColor: "#64748b" },
      { id: "g6", x: 235, y: 145, radius: 32, teeth: 12, color: "#94a3b8", shadowColor: "#64748b" },
    ],
    edges: [
      { from: "g0", to: "g1" },
      { from: "g1", to: "g2" },
      { from: "g1", to: "g3" },
      { from: "g3", to: "g4" },
      { from: "g3", to: "g5" },
      { from: "g5", to: "g6" },
    ],
    explanation: {
      title: "Branching Network Rule",
      steps: [
        "In a branching tree, find the step distance (depth) from the yellow driver.",
        "Depth 0 (g0): Driver (↺ Same)",
        "Depth 1 (g1): ↻ Opposite",
        "Depth 2 (g2, g3): ↺ Same (Selected ✓)",
        "Depth 3 (g4, g5): ↻ Opposite",
        "Depth 4 (g6): ↺ Same (Selected ✓)",
      ],
      rule: "Any gear at an EVEN depth (0, 2, 4...) rotates in the SAME direction as the driver gear!",
    },
  },

  // Puzzle 5: Pinwheel Cross Mechanism (Master Kinetic Engine)
  {
    id: "pinwheel-cross",
    title: "Master Pinwheel Mechanism",
    subtitle: "Sometimes simple rules predict the behavior of complex mechanical systems.",
    type: "learn_demo",
    driverId: "center",
    nodes: [
      { id: "center", x: 150, y: 150, radius: 36, teeth: 12, color: "#eab308", shadowColor: "#ca8a04", isDriver: true },
      // North Branch
      { id: "n1", x: 150, y: 92, radius: 32, teeth: 12, color: "#14b8a6", shadowColor: "#0f766e" },
      { id: "n2", x: 150, y: 40, radius: 32, teeth: 12, color: "#eab308", shadowColor: "#ca8a04" },
      // South Branch
      { id: "s1", x: 150, y: 208, radius: 32, teeth: 12, color: "#14b8a6", shadowColor: "#0f766e" },
      { id: "s2", x: 150, y: 260, radius: 32, teeth: 12, color: "#eab308", shadowColor: "#ca8a04" },
      // West Branch
      { id: "w1", x: 92, y: 150, radius: 32, teeth: 12, color: "#14b8a6", shadowColor: "#0f766e" },
      { id: "w2", x: 40, y: 150, radius: 32, teeth: 12, color: "#eab308", shadowColor: "#ca8a04" },
      // East Branch
      { id: "e1", x: 208, y: 150, radius: 32, teeth: 12, color: "#14b8a6", shadowColor: "#0f766e" },
      { id: "e2", x: 260, y: 150, radius: 32, teeth: 12, color: "#eab308", shadowColor: "#ca8a04" },
    ],
    edges: [
      { from: "center", to: "n1" },
      { from: "n1", to: "n2" },
      { from: "center", to: "s1" },
      { from: "s1", to: "s2" },
      { from: "center", to: "w1" },
      { from: "w1", to: "w2" },
      { from: "center", to: "e1" },
      { from: "e1", to: "e2" },
    ],
    explanation: {
      title: "Symmetric Pinwheel Symmetry",
      steps: [
        "The central yellow gear drives all four intermediate teal gears simultaneously.",
        "Each outer yellow gear spins in the same direction as the central core!",
      ],
      rule: "Mechanisms with central drive distribute synchronized torque evenly across all arms.",
    },
  },
];
