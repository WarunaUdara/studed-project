import { Crown, Gem, Medal, Star } from "lucide-react";
import { rankBadge, rankMedal } from "@/lib/gamification";
import { cn } from "@/lib/utils";

export interface LeaderboardEntry {
  rank: number;
  user: { id: string; fullName: string };
  totalXp: number;
}

export interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  total?: number;
  className?: string;
  showRankBadges?: boolean;
  limit?: number;
}

function MedalCell({ rank }: { rank: number }) {
  const medal = rankMedal(rank);
  if (!medal)
    return <span className="text-sm font-semibold tabular-nums text-muted-foreground">{rank}</span>;
  const styles: Record<string, string> = {
    gold: "bg-gold/15 text-gold",
    silver: "bg-slate-200 text-slate-700",
    bronze: "bg-amber-100 text-amber-800",
  };
  return (
    <span
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-full font-bold",
        styles[medal],
      )}
    >
      <Medal className="h-4 w-4" />
    </span>
  );
}

function RankTag({ rank, total }: { rank: number; total: number }) {
  const tag = rankBadge(rank, total);
  if (!tag) return null;
  const map = {
    star: { icon: Star, cls: "text-gold" },
    crown: { icon: Crown, cls: "text-purple" },
    gem: { icon: Gem, cls: "text-primary" },
  } as const;
  const { icon: Icon, cls } = map[tag as keyof typeof map];
  return <Icon className={cn("h-3.5 w-3.5", cls)} />;
}

export function LeaderboardTable({
  entries,
  currentUserId,
  total,
  className,
  showRankBadges = true,
  limit,
}: LeaderboardTableProps) {
  const rows = typeof limit === "number" ? entries.slice(0, limit) : entries;
  return (
    <ol className={cn("space-y-1.5", className)}>
      {rows.map((entry) => {
        const isYou = currentUserId != null && entry.user.id === currentUserId;
        return (
          <li
            key={`${entry.rank}-${entry.user.id}`}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
              isYou ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/60",
            )}
          >
            <span className="flex w-8 items-center justify-center">
              <MedalCell rank={entry.rank} />
            </span>
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-sm",
                isYou ? "font-bold text-primary" : "font-medium text-foreground",
              )}
            >
              {entry.user.fullName}
              {isYou && <span className="ml-1.5 text-xs font-normal">(You)</span>}
            </span>
            {showRankBadges && <RankTag rank={entry.rank} total={total ?? entries.length} />}
            <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
              {entry.totalXp.toLocaleString()}
              <span className="ml-1 text-xs font-normal text-muted-foreground">XP</span>
            </span>
          </li>
        );
      })}
      {rows.length === 0 && (
        <li className="py-6 text-center text-sm text-muted-foreground">No entries yet.</li>
      )}
    </ol>
  );
}
