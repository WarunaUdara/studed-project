import { rankBadgeGlyph } from "@/lib/gamification";
import { cn } from "@/lib/utils";

export type RankBadgeVariant = "gold" | "silver" | "bronze" | "star" | "crown" | "gem" | "none";

export interface RankBadgeProps {
  rank: number;
  total?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * RankBadge — renders the spec-defined glyph (🥇🥈🥉⭐👑💎) for a leaderboard
 * rank, sized appropriately. The glyphs are part of the design spec
 * (05-Gamification/Leaderboards.md) and are the only emojis used in code.
 */
export function RankBadge({ rank, total, size = "md", className }: RankBadgeProps) {
  const glyph = rankBadgeGlyph(rank, total);
  const sizeCls = size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-lg";

  if (!glyph) {
    return (
      <span className={cn("font-bold tabular-nums text-muted-foreground", sizeCls, className)}>
        #{rank}
      </span>
    );
  }

  return (
    <span
      className={cn("inline-block leading-none align-middle", sizeCls, className)}
      role="img"
      aria-label={`Rank ${rank}`}
    >
      {glyph}
    </span>
  );
}
