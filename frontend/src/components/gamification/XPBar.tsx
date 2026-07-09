import { levelFromXp } from "@/lib/gamification";
import { cn } from "@/lib/utils";

export interface XPBarProps {
  totalXp: number;
  className?: string;
  compact?: boolean;
}

export function XPBar({ totalXp, className, compact = false }: XPBarProps) {
  const { level, xpIntoLevel, xpForNextLevel, progress } = levelFromXp(totalXp);
  const pct = Math.round(progress * 100);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 font-bold text-primary-foreground",
          compact ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm",
        )}
        role="img"
        aria-label={`Level ${level}`}
      >
        {level}
      </span>
      <div className="min-w-0 flex-1">
        {compact ? (
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
              {xpIntoLevel}/{xpForNextLevel}
            </span>
          </div>
        ) : (
          <>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Level {level}</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {xpIntoLevel} / {xpForNextLevel} XP
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
