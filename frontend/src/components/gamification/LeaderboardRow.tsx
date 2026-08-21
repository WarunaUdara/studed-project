import { Link } from "@tanstack/react-router";
import { Bot, User as UserIcon } from "lucide-react";
import { RankBadge } from "@/components/gamification/RankBadge";
import { leaderboardDisplayName } from "@/lib/gamification";
import { cn } from "@/lib/utils";

/**
 * One place on a leaderboard, exactly as the API returns it. The name arrives
 * already masked from the gateway.
 */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  totalXp: number;
  isMe: boolean;
}

export interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  /** Everyone ranked in this scope, so top-1% and top-10% badges are real. */
  total?: number;
  showXp?: boolean;
  to?: string;
  className?: string;
}

/**
 * LeaderboardRow — the single leaderboard row used everywhere a ranking is
 * shown: the standings page, the dashboard widget, the daily spark summary and
 * the marketing preview. There were six separate row renderings before this,
 * four of which displayed invented people.
 *
 * Highlighted when the row is the viewer's (spec: "You are #42"). The top three
 * take the gold/silver/bronze treatment; rank 4 and below show the spec glyph.
 */
export function LeaderboardRow({
  entry,
  total,
  showXp = true,
  to,
  className,
}: LeaderboardRowProps) {
  const { rank, isMe } = entry;
  const isBot = entry.userId.startsWith("bot-");
  const name = leaderboardDisplayName(entry.displayName);

  const rowCls = cn(
    "flex items-center gap-3 rounded-xl px-3 py-2 transition-all",
    isMe
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
          isMe ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        {isBot ? <Bot className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm",
          isMe ? "font-bold text-primary" : "font-medium text-foreground",
        )}
      >
        {name}
        {isMe && (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            <span className="text-primary">(You)</span>
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
