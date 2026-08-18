import { motion } from "framer-motion";
import { Check, RotateCcw, X as XIcon } from "lucide-react";
import { generateGearPath } from "./GearTrainSvg";

export interface InteractiveGearTrainProps {
  gearCount?: number;
  selectedIndices: number[];
  onToggleGear?: (index: number) => void;
  onReset?: () => void;
  isRotating?: boolean;
  driverDirection?: 1 | -1;
  evaluated?: "correct" | "incorrect" | null;
  wrongIndices?: number[];
  className?: string;
}

export function InteractiveGearTrain({
  gearCount = 5,
  selectedIndices,
  onToggleGear,
  onReset,
  isRotating = false,
  driverDirection = -1,
  evaluated = null,
  wrongIndices = [],
  className = "",
}: InteractiveGearTrainProps) {
  const radius = 38;
  const teeth = 14;
  const gearSize = (radius + radius * 0.22) * 2;
  const gearPath = generateGearPath(teeth, radius);

  // Colors based on state
  const getGearColors = (index: number) => {
    if (index === 0) {
      // Driver Gear: Always Yellow
      return { fill: "#eab308", shadow: "#ca8a04", ring: "border-amber-400" };
    }

    const isSelected = selectedIndices.includes(index);
    const isWrong = wrongIndices.includes(index);

    if (evaluated === "correct" && isSelected) {
      // Correct state: Green
      return { fill: "#22c55e", shadow: "#15803d", ring: "border-emerald-400" };
    }

    if (isWrong) {
      // Wrong state: Amber / Red
      return { fill: "#f59e0b", shadow: "#d97706", ring: "border-rose-500" };
    }

    if (isSelected) {
      // Selected by student: Blue
      return { fill: "#3b82f6", shadow: "#1d4ed8", ring: "border-blue-400" };
    }

    // Default Unselected: Neutral Grey
    return { fill: "#94a3b8", shadow: "#64748b", ring: "border-neutral-500" };
  };

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`.trim()}>
      {/* 5-Gear Train Row */}
      <div className="relative flex items-center justify-center py-6 px-4">
        {Array.from({ length: gearCount }).map((_, idx) => {
          const { fill, shadow } = getGearColors(idx);
          const isSelected = selectedIndices.includes(idx);
          const isWrong = wrongIndices.includes(idx);
          const isDriver = idx === 0;

          // Meshed gear direction flips on every neighbor:
          // idx 0 -> driverDirection (-1)
          // idx 1 -> -driverDirection (+1)
          // idx 2 -> driverDirection (-1) ...
          const gearDir = idx % 2 === 0 ? driverDirection : -driverDirection;

          return (
            <div
              key={idx}
              className={`relative cursor-pointer transition-transform duration-200 ${
                idx > 0 ? "-ml-4" : ""
              } ${isDriver ? "cursor-default" : "hover:scale-105 active:scale-95"}`}
              style={{ zIndex: isSelected ? 20 : 10 - idx }}
              onClick={() => {
                if (!isDriver && onToggleGear && evaluated !== "correct") {
                  onToggleGear(idx);
                }
              }}
              role="button"
              aria-label={`Gear ${idx + 1}`}
              tabIndex={isDriver ? -1 : 0}
            >
              {/* Badge Icon on top of gear */}
              {isSelected && evaluated === "correct" && (
                <div className="absolute -top-1 -right-1 z-30 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
                  <Check className="size-3 stroke-[3]" />
                </div>
              )}

              {isWrong && (
                <div className="absolute -top-1 -right-1 z-30 flex size-5 items-center justify-center rounded-full bg-black text-amber-400 border border-amber-400 shadow-md">
                  <XIcon className="size-3 stroke-[3]" />
                </div>
              )}

              {/* Rotating Gear SVG */}
              <motion.svg
                viewBox={`0 0 ${gearSize} ${gearSize}`}
                className="overflow-visible drop-shadow-xl"
                style={{ width: gearSize, height: gearSize }}
                animate={
                  isRotating
                    ? { rotate: gearDir === 1 ? [0, 360] : [0, -360] }
                    : { rotate: 0 }
                }
                transition={
                  isRotating
                    ? { repeat: Infinity, duration: 4, ease: "linear" }
                    : { duration: 0.3 }
                }
              >
                <g transform={`translate(${gearSize / 2 - radius}, ${gearSize / 2 - radius})`}>
                  {/* 3D Depth Shadow */}
                  <path d={gearPath} fill={shadow} transform="translate(0, 3.5)" />
                  {/* Outer Gear */}
                  <path d={gearPath} fill={fill} />

                  {/* Inner Hub */}
                  <circle cx={radius} cy={radius} r={radius * 0.38} fill={shadow} opacity="0.35" />
                  <circle cx={radius} cy={radius} r={radius * 0.3} fill={fill} />
                  <circle cx={radius} cy={radius} r={radius * 0.2} fill="#334155" />
                  <circle cx={radius} cy={radius} r={radius * 0.12} fill="#64748b" />
                  <circle cx={radius} cy={radius} r={radius * 0.06} fill="#0f172a" />

                  {/* Radius marker line */}
                  <line
                    x1={radius}
                    y1={radius}
                    x2={radius + radius * 0.8}
                    y2={radius}
                    stroke="#475569"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                </g>
              </motion.svg>
            </div>
          );
        })}
      </div>

      {/* Start Over Reset Button */}
      {onReset && evaluated !== "correct" && (
        <div className="flex w-full justify-end pr-6">
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
