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
        <g stroke="oklch(1 0 89.9)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          {TRIANGLE_REGIONS.map((region) => {
            const isSelected = selectedIds.has(region.id);

            // Fill colors:
            // - Unselected: dark slate grey (oklch 0.24 0.013 253)
            // - Selected during edit: navy blue (oklch 0.23 0.05 266 / 0.33 0.12 266)
            // - Selected & Correct: vibrant royal blue (oklch 0.49 0.2 264 / 0.6 0.19 256)
            let fillColor = "oklch(0.24 0.013 253)";
            if (isSelected) {
              fillColor = isCorrect ? "oklch(0.6 0.19 256)" : "oklch(0.33 0.12 266)";
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
