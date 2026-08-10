import { motion, useReducedMotion } from "framer-motion";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StreakFlameProps {
  dayCount: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * StreakFlame — subtle pulsing flame animation with day count.
 * The pulse is driven by framer-motion, so it is gated on useReducedMotion;
 * the global CSS keyframe gate only covers CSS animations, not JS-driven ones.
 */
export function StreakFlame({
  dayCount,
  size = "md",
  showLabel = true,
  className,
  onClick,
}: StreakFlameProps) {
  const reduce = useReducedMotion();
  const dim = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-7 w-7" : "h-5 w-5";
  const isActive = dayCount > 0;
  const label = dayCount === 0 ? "Start today" : `${dayCount}-day streak`;

  return (
    <span
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 font-semibold transition-transform active:scale-95",
        onClick ? "cursor-pointer hover:opacity-90" : "",
        isActive
          ? "bg-orange/12 text-orange ring-1 ring-orange/30"
          : "bg-muted text-muted-foreground ring-1 ring-border",
        className,
      )}
      role={onClick ? "button" : "img"}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      aria-label={label}
      title={label}
    >
      {isActive && (
        <motion.span
          animate={reduce ? undefined : { scale: [1, 1.18, 1] }}
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
