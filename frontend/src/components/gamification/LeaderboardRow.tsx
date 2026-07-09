import { Link } from "@tanstack/react-router";
import { Bot, User as UserIcon } from "lucide-react";
import type { LeaderboardEntry } from "@/components/gamification/LeaderboardTable";
import { RankBadge } from "@/components/gamification/RankBadge";
import { privateLeaderboardName } from "@/lib/gamification";
import { cn } from "@/lib/utils";

export interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isYou: boolean;
  total?: number;
  showXp?: boolean;
  to?: string;
  className?: string;
}

/**
 * LeaderboardRow — single leaderboard row per the spec. Highlighted when `isYou`
 * with a 👤 indicator (spec: "You are #42"). The top-3 row uses the gold/silver/
 * bronze rank background, and rank ≥ 4 shows the spec glyph (⭐👑💎).
 */
export function LeaderboardRow({
  entry,
  isYou,
  total,
  showXp = true,
  to,
  className,
}: LeaderboardRowProps) {
  const rank = entry.rank;
  const isBot = entry.user.id.startsWith("bot-");

  const rowCls = cn(
    "flex items-center gap-3 rounded-xl px-3 py-2 transition-all",
    isYou
      ? "bg-primary/10 ring-1 ring-primary/40 shadow-sm"
      : rank <= 3
        ? "bg-gradient-to-r from-gold/8 via-card to-card hover:from-gold/12"
        : "hover:bg-muted/60",
    className,
  );

  const content = (
    <>
      <span className="flex w-9 items-center justify-center">
        <RankBadge rank={rank} total={total} size={rank <= 3 ? "lg" : "md"} />
      </span>
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isYou ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        {isBot ? <Bot className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm",
          isYou ? "font-bold text-primary" : "font-medium text-foreground",
        )}
      >
        {privateLeaderboardName(entry.user.fullName)}
        {isYou && (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            👤 <span className="text-primary">(You)</span>
          </span>
        )}
      </span>
      {showXp && (
        <span className="shrink-0 text-sm font-bold tabular-nums">
          {entry.totalXp.toLocaleString()}
          <span className="ml-1 text-xs font-normal text-muted-foreground">XP</span>
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <li>
        <Link to={to} className={rowCls}>
          {content}
        </Link>
      </li>
    );
  }
  return <li className={rowCls}>{content}</li>;
}
