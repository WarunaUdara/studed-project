import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import {
  GearNetworkPuzzle,
  solveGearDirections,
} from "./gear-network-engine";
import { generateGearPath } from "./GearTrainSvg";

export interface GearGraphSvgProps {
  puzzle: GearNetworkPuzzle;
  selectedIds: string[];
  onToggleNode?: (nodeId: string) => void;
  onReset?: () => void;
  isRotating?: boolean;
  evaluated?: "correct" | "incorrect" | null;
  wrongIds?: string[];
  className?: string;
}

export function GearGraphSvg({
  puzzle,
  selectedIds,
  onToggleNode,
  onReset,
  isRotating = false,
  evaluated = null,
  wrongIds = [],
  className = "",
}: GearGraphSvgProps) {
  const { directions } = solveGearDirections(
    puzzle.nodes,
    puzzle.edges,
    puzzle.driverId,
    puzzle.driverDirection ?? -1,
  );

  // Compute SVG view box bounds
  const minX = Math.min(...puzzle.nodes.map((n) => n.x - n.radius * 1.3)) - 10;
  const maxX = Math.max(...puzzle.nodes.map((n) => n.x + n.radius * 1.3)) + 10;
  const minY = Math.min(...puzzle.nodes.map((n) => n.y - n.radius * 1.3)) - 10;
  const maxY = Math.max(...puzzle.nodes.map((n) => n.y + n.radius * 1.3)) + 10;

  const width = Math.max(340, maxX - minX);
  const height = Math.max(240, maxY - minY);

  const getGearColors = (nodeId: string) => {
    const node = puzzle.nodes.find((n) => n.id === nodeId)!;

    if (node.isDriver) {
      return {
        fill: node.color || "#eab308",
        shadow: node.shadowColor || "#ca8a04",
      };
    }

    if (node.isTarget && puzzle.type === "multiple_choice") {
      return {
        fill: node.color || "#3b82f6",
        shadow: node.shadowColor || "#1d4ed8",
      };
    }

    const isSelected = selectedIds.includes(nodeId);
    const isWrong = wrongIds.includes(nodeId);

    if (evaluated === "correct" && isSelected) {
      return { fill: "#22c55e", shadow: "#15803d" };
    }

    if (isWrong) {
      return { fill: "#f59e0b", shadow: "#d97706" };
    }

    if (isSelected) {
      return { fill: "#3b82f6", shadow: "#1d4ed8" };
    }

    return {
      fill: node.color || "#94a3b8",
      shadow: node.shadowColor || "#64748b",
    };
  };

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`.trim()}>
      <div className="relative flex items-center justify-center p-2">
        <svg
          viewBox={`${minX} ${minY} ${width} ${height}`}
          className="overflow-visible max-w-full drop-shadow-2xl"
          style={{ width: `${Math.min(480, width * 1.3)}px`, height: `${Math.min(320, height * 1.2)}px` }}
        >
          {/* Render Gears */}
          {puzzle.nodes.map((node) => {
            const { fill, shadow } = getGearColors(node.id);
            const isSelected = selectedIds.includes(node.id);
            const isWrong = wrongIds.includes(node.id);
            const dir = directions[node.id] ?? -1;
            const gearPath = generateGearPath(node.teeth, node.radius);
            const isInteractive =
              !node.isDriver && puzzle.type === "tap_to_select" && evaluated !== "correct";

            return (
              <g
                key={node.id}
                className={`transition-opacity ${isInteractive ? "cursor-pointer" : "cursor-default"}`}
                onClick={() => isInteractive && onToggleNode?.(node.id)}
              >
                {/* Rotating SVG Gear Group centered at (node.x, node.y) */}
                <motion.g
                  animate={
                    isRotating
                      ? { rotate: dir === 1 ? [0, 360] : [0, -360] }
                      : { rotate: 0 }
                  }
                  transition={
                    isRotating
                      ? { repeat: Infinity, duration: 4, ease: "linear" }
                      : { duration: 0.3 }
                  }
                  style={{
                    originX: `${node.x}px`,
                    originY: `${node.y}px`,
                  }}
                >
                  <g transform={`translate(${node.x - node.radius}, ${node.y - node.radius})`}>
                    {/* Shadow 3D Drop */}
                    <path d={gearPath} fill={shadow} transform="translate(0, 3.5)" />
                    {/* Main Gear Surface */}
                    <path d={gearPath} fill={fill} />

                    {/* Central Hub Rings */}
                    <circle
                      cx={node.radius}
                      cy={node.radius}
                      r={node.radius * 0.36}
                      fill={shadow}
                      opacity="0.35"
                    />
                    <circle
                      cx={node.radius}
                      cy={node.radius}
                      r={node.radius * 0.28}
                      fill={fill}
                    />
                    <circle
                      cx={node.radius}
                      cy={node.radius}
                      r={node.radius * 0.18}
                      fill="#334155"
                    />
                    <circle
                      cx={node.radius}
                      cy={node.radius}
                      r={node.radius * 0.1}
                      fill="#64748b"
                    />
                    <circle
                      cx={node.radius}
                      cy={node.radius}
                      r={node.radius * 0.05}
                      fill="#0f172a"
                    />

                    {/* Radius reference line */}
                    <line
                      x1={node.radius}
                      y1={node.radius}
                      x2={node.radius + node.radius * 0.75}
                      y2={node.radius}
                      stroke="#475569"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                  </g>
                </motion.g>

                {/* Driver Rotation Arrow Indicator */}
                {node.isDriver && (
                  <g className="text-white drop-shadow-md pointer-events-none">
                    <path
                      d={`M ${node.x - node.radius * 0.5} ${node.y - node.radius * 0.9} A ${node.radius * 1.1} ${node.radius * 1.1} 0 0 1 ${node.x + node.radius * 0.5} ${node.y - node.radius * 0.9}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <polygon
                      points={`${node.x - node.radius * 0.7},${node.y - node.radius * 0.9} ${node.x - node.radius * 0.4},${node.y - node.radius * 1.1} ${node.x - node.radius * 0.4},${node.y - node.radius * 0.7}`}
                      fill="currentColor"
                    />
                  </g>
                )}

                {/* Status Badges: Checkmark or Crossmark */}
                {isSelected && evaluated === "correct" && (
                  <g transform={`translate(${node.x + node.radius * 0.6}, ${node.y - node.radius * 0.9})`}>
                    <circle cx="0" cy="0" r="9" fill="#22c55e" />
                    <path
                      d="M -3 0 L -1 3 L 4 -3"
                      stroke="#ffffff"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </g>
                )}

                {isWrong && (
                  <g transform={`translate(${node.x + node.radius * 0.6}, ${node.y - node.radius * 0.9})`}>
                    <circle cx="0" cy="0" r="9" fill="#000000" stroke="#f59e0b" strokeWidth="1.5" />
                    <path
                      d="M -2.5 -2.5 L 2.5 2.5 M 2.5 -2.5 L -2.5 2.5"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Start Over Reset Button if interactive */}
      {onReset && puzzle.type === "tap_to_select" && evaluated !== "correct" && (
        <div className="flex w-full justify-end pr-8">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            <RotateCcw className="size-3.5" />
            <span>Start over</span>
          </button>
        </div>
      )}
    </div>
  );
}
