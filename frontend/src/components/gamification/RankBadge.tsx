import { Crown, Gem, Medal, Star } from "lucide-react";
import { rankBadgeGlyph } from "@/lib/gamification";
import { cn } from "@/lib/utils";

export type RankBadgeVariant = "gold" | "silver" | "bronze" | "star" | "crown" | "gem" | "none";

export interface RankBadgeProps {
  rank: number;
  total?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const GLYPH_ICONS: Record<string, { icon: typeof Medal; className: string }> = {
  "medal-gold": { icon: Medal, className: "text-gold" },
  "medal-silver": { icon: Medal, className: "text-muted-foreground" },
  "medal-bronze": { icon: Medal, className: "text-orange" },
  star: { icon: Star, className: "text-gold" },
  crown: { icon: Crown, className: "text-purple" },
  gem: { icon: Gem, className: "text-purple" },
};

/**
 * RankBadge - renders the leaderboard rank glyph via lucide icons. Top-3 ranks
 * show a tinted medal, rank >= 4 shows the spec star/crown/gem per the
 * leaderboard design (05-Gamification/Leaderboards.md).
 */
export function RankBadge({ rank, total, size = "md", className }: RankBadgeProps) {
  const glyphKey = rankBadgeGlyph(rank, total);
  const sizeCls = size === "sm" ? "size-4" : size === "lg" ? "size-7" : "size-5";

  if (!glyphKey) {
    return (
      <span className={cn("font-bold tabular-nums text-muted-foreground", sizeCls, className)}>
        #{rank}
      </span>
    );
  }

  const { icon: Icon, className: iconColor } = GLYPH_ICONS[glyphKey] ?? GLYPH_ICONS["star"];

  return (
    <span
      className={cn("inline-block leading-none align-middle", className)}
      role="img"
      aria-label={`Rank ${rank}`}
    >
      <Icon className={cn(sizeCls, iconColor)} fill="currentColor" strokeWidth={0} />
    </span>
  );
}
