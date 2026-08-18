import { motion } from "framer-motion";
import type { PolygonRegion } from "./types";

export const TRIANGLE_REGIONS: PolygonRegion[] = [
  {
    id: "top",
    name: "Top Quarter",
    points: "200,20 120,170 280,170",
    areaFraction: 0.25,
  },
  {
    id: "center_inverted",
    name: "Center Quarter",
    points: "120,170 280,170 200,320",
    areaFraction: 0.25,
  },
  {
    id: "bottom_right",
    name: "Bottom-Right Quarter",
    points: "280,170 200,320 360,320",
    areaFraction: 0.25,
  },
  {
    id: "bottom_left_outer",
    name: "Bottom-Left Outer Eighth",
    points: "40,320 120,170 120,320",
    areaFraction: 0.125,
  },
  {
    id: "bottom_left_inner",
    name: "Bottom-Left Inner Eighth",
    points: "120,170 120,320 200,320",
    areaFraction: 0.125,
  },
];

interface FractionTriangleProps {
  selectedIds: Set<string>;
  onToggleRegion: (id: string) => void;
  disabled?: boolean;
  isCorrect?: boolean;
}

export function FractionTriangle({
  selectedIds,
  onToggleRegion,
  disabled = false,
  isCorrect = false,
}: FractionTriangleProps) {
  return (
    <div className="relative mx-auto flex w-full max-w-sm items-center justify-center p-2">
      <svg
        viewBox="0 0 400 350"
        className="w-full max-w-[340px] drop-shadow-md select-none"
        aria-label="Interactive partitioned geometric triangle"
      >
        <g stroke="#ffffff" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          {TRIANGLE_REGIONS.map((region) => {
            const isSelected = selectedIds.has(region.id);

            // Fill colors:
            // - Unselected: dark slate grey (#2b303a)
            // - Selected during edit: navy blue (#1e293b / #1e3a8a)
            // - Selected & Correct: vibrant royal blue (#2563eb / #3b82f6)
            let fillColor = "#2b303a";
            if (isSelected) {
              fillColor = isCorrect ? "#3b82f6" : "#1e3a8a";
            }

            return (
              <motion.polygon
                key={region.id}
                points={region.points}
                fill={fillColor}
                onClick={() => {
                  if (!disabled) onToggleRegion(region.id);
                }}
                className={`transition-colors duration-150 ${
                  disabled ? "cursor-default" : "cursor-pointer hover:brightness-125"
                }`}
                whileTap={disabled ? undefined : { scale: 0.98 }}
                style={{
                  transformOrigin: "center center",
                }}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
