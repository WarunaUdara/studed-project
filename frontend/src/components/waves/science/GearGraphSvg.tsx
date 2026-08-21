import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { generateGearPath } from "./GearTrainSvg";
import { type GearNetworkPuzzle, solveGearDirections } from "./gear-network-engine";

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
          style={{
            width: `${Math.min(480, width * 1.3)}px`,
            height: `${Math.min(320, height * 1.2)}px`,
          }}
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
                transform={`translate(${node.x}, ${node.y})`}
                className={`transition-opacity ${isInteractive ? "cursor-pointer" : "cursor-default"}`}
                onClick={() => isInteractive && onToggleNode?.(node.id)}
              >
                {/* Rotating SVG Gear Group centered at local (0, 0) */}
                <motion.g
                  animate={
                    isRotating ? { rotate: dir === 1 ? [0, 360] : [0, -360] } : { rotate: 0 }
                  }
                  transition={
                    isRotating
                      ? { repeat: Infinity, duration: 4, ease: "linear" }
                      : { duration: 0.3 }
                  }
                  style={{
                    transformOrigin: "0px 0px",
                  }}
                >
                  <g transform={`translate(${-node.radius}, ${-node.radius})`}>
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
                    <circle cx={node.radius} cy={node.radius} r={node.radius * 0.28} fill={fill} />
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
                      stroke="#0f172a"
                      strokeWidth="2"
                      strokeDasharray="2 2"
                    />
                  </g>
                </motion.g>

                {/* Fixed center axle pin */}
                <circle cx={0} cy={0} r={4} fill="#1e293b" />
                <circle cx={0} cy={0} r={2} fill="#94a3b8" />

                {/* Driver Rotation Arrow Indicator */}
                {node.isDriver && (
                  <g
                    className="text-white drop-shadow-md pointer-events-none"
                    transform={`translate(0, ${-node.radius - 12})`}
                  >
                    <path
                      d="M -16 0 A 20 20 0 0 1 16 0"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <polygon points="-20,-2 -14,6 -12,-4" fill="#ffffff" />
                  </g>
                )}

                {/* Status Badges: Checkmark or Crossmark */}
                {isSelected && evaluated === "correct" && (
                  <g transform={`translate(${node.radius * 0.6}, ${-node.radius * 0.9})`}>
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
                  <g transform={`translate(${node.radius * 0.6}, ${-node.radius * 0.9})`}>
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
