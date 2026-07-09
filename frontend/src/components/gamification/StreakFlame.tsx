import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StreakFlameProps {
  dayCount: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

/**
 * StreakFlame — subtle pulsing flame animation with day count.
 * Respects prefers-reduced-motion (the CSS keyframe gate handles it globally).
 */
export function StreakFlame({
  dayCount,
  size = "md",
  showLabel = true,
  className,
}: StreakFlameProps) {
  const dim = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-7 w-7" : "h-5 w-5";
  const isActive = dayCount > 0;
  const label =
    dayCount === 0 ? "Start today" : `${dayCount}-day streak${dayCount >= 7 ? " 🔥" : ""}`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-semibold",
        isActive
          ? "bg-orange/12 text-orange ring-1 ring-orange/30"
          : "bg-muted text-muted-foreground ring-1 ring-border",
        className,
      )}
      role="img"
      aria-label={label}
      title={label}
    >
      {isActive && (
        <motion.span
          animate={isActive ? { scale: [1, 1.18, 1] } : undefined}
          transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
          className="inline-block"
        >
          <Flame
            className={cn(dim, isActive ? "fill-orange/30 text-orange" : "text-muted-foreground")}
          />
        </motion.span>
      )}
      {!isActive && <Flame className={cn(dim, "text-muted-foreground")} />}
      {showLabel && (
        <span
          className={cn(
            "tabular-nums",
            size === "sm" ? "text-[10px]" : size === "lg" ? "text-sm" : "text-xs",
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}
