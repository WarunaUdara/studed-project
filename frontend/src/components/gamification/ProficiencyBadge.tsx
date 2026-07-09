import { Check, Circle, Clock, Crown, Sparkles, Star } from "lucide-react";
import { type ProficiencyLevel, proficiencyMeta } from "@/lib/gamification";
import { cn } from "@/lib/utils";

const ICONS = {
  circle: Circle,
  clock: Clock,
  check: Check,
  star: Star,
  crown: Crown,
};

export interface ProficiencyBadgeProps {
  level: ProficiencyLevel;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ProficiencyBadge({
  level,
  size = "md",
  showLabel = true,
  className,
}: ProficiencyBadgeProps) {
  const meta = proficiencyMeta(level);
  const Icon = ICONS[meta.icon as keyof typeof ICONS] ?? Sparkles;
  const sizes = {
    sm: { badge: "h-5 px-2 text-[11px] gap-1", icon: "h-3 w-3" },
    md: { badge: "h-6 px-2.5 text-xs gap-1.5", icon: "h-3.5 w-3.5" },
    lg: { badge: "h-8 px-3 text-sm gap-1.5", icon: "h-4 w-4" },
  } as const;
  const s = sizes[size];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold ring-1",
        s.badge,
        meta.textColor,
        meta.bgColor,
        meta.ringColor,
        className,
      )}
    >
      <Icon className={cn(s.icon, meta.color)} />
      {showLabel && meta.label}
    </span>
  );
}
