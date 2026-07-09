import { Crown, Gem, GraduationCap, Sparkles, Star, Target, Trophy, Waves } from "lucide-react";
import type { BadgeEarned } from "@/lib/gamification";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof Star> = {
  waves: Waves,
  target: Target,
  book: GraduationCap,
  star: Star,
  sparkles: Sparkles,
  graduation: GraduationCap,
  crown: Crown,
  trophy: Trophy,
};

const TIER_STYLES: Record<BadgeEarned["tier"], { earned: string; unearned: string }> = {
  bronze: {
    earned: "border-amber-300/50 bg-amber-50 text-amber-700",
    unearned: "border-border bg-muted text-muted-foreground",
  },
  silver: {
    earned: "border-slate-300/60 bg-slate-50 text-slate-700",
    unearned: "border-border bg-muted text-muted-foreground",
  },
  gold: {
    earned: "border-gold/40 bg-gold/10 text-gold",
    unearned: "border-border bg-muted text-muted-foreground",
  },
  purple: {
    earned: "border-purple/40 bg-purple/10 text-purple",
    unearned: "border-border bg-muted text-muted-foreground",
  },
};

export interface BadgeCardProps {
  badge: BadgeEarned;
  className?: string;
}

export function BadgeCard({ badge, className }: BadgeCardProps) {
  const Icon = ICONS[badge.icon] ?? Sparkles;
  const tier = TIER_STYLES[badge.tier];
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all",
        badge.earned ? tier.earned : tier.unearned,
        badge.earned && "shadow-sm",
        !badge.earned && "opacity-60 grayscale",
        className,
      )}
      title={badge.description}
    >
      <Icon className={cn("h-7 w-7", badge.earned && "drop-shadow-sm")} />
      <div className="space-y-0.5">
        <p className="text-xs font-semibold leading-tight">{badge.label}</p>
        <p className="text-[10px] leading-tight text-muted-foreground">{badge.description}</p>
      </div>
    </div>
  );
}

export interface BadgeGridProps {
  badges: BadgeEarned[];
  className?: string;
}

export function BadgeGrid({ badges, className }: BadgeGridProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4", className)}>
      {badges.map((b) => (
        <BadgeCard key={b.id} badge={b} />
      ))}
    </div>
  );
}

export function GemIcon() {
  return <Gem className="h-4 w-4" />;
}
