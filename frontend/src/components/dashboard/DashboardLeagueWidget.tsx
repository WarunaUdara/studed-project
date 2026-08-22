import { Link } from "@tanstack/react-router";
import { ChevronRight, Maximize2 } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "urql";
import { LeaderboardRow } from "@/components/gamification/LeaderboardRow";
import { Skeleton } from "@/components/ui/Skeleton";
import { LEADERBOARD_QUERY } from "@/graphql/courses";
import { buildDemoLeaderboard } from "@/lib/demoData";
import { maskStudentName } from "@/lib/gamification";
import type { LeaderboardEntryData, LeaderboardQueryData } from "@/lib/graphqlTypes";
import { useAuthStore } from "@/stores/auth";

/**
 * The student's real weekly standing, with the neighbours immediately above and
 * below them.
 *
 * Shows the weekly board, which resets every Monday.
 */
export function DashboardLeagueWidget() {
  const { user } = useAuthStore();
  const [{ data, fetching }] = useQuery<LeaderboardQueryData>({
    query: LEADERBOARD_QUERY,
    variables: { scope: "WEEKLY", limit: 100 },
  });

  const fallbackEntries: LeaderboardEntryData[] = useMemo(() => {
    const rawDemo = buildDemoLeaderboard(
      user?.id ?? "student-user-id",
      user?.totalXp ?? 425,
      user?.fullName ?? "You",
      "WEEKLY",
    );
    return rawDemo.map((e) => ({
      rank: e.rank,
      userId: e.user.id,
      displayName: maskStudentName(e.user.fullName),
      totalXp: e.totalXp,
      isMe: e.user.id === (user?.id ?? "student-user-id"),
    }));
  }, [user?.id, user?.totalXp, user?.fullName]);

  const board = data?.leaderboard;
  const hasLive = Boolean(board?.entries && board.entries.length > 0);
  const entries = useMemo(
    () => (hasLive ? board!.entries : fallbackEntries),
    [hasLive, board, fallbackEntries],
  );
  const me = hasLive ? (board?.me ?? null) : (fallbackEntries.find((e) => e.isMe) ?? null);
  const totalRanked = hasLive ? board!.totalRanked : fallbackEntries.length;

  // Three rows: the student, and whoever is directly either side of them.
  const window: LeaderboardEntryData[] = useMemo(() => {
    if (!me) return entries.slice(0, 3);
    const index = entries.findIndex((e) => e.isMe);
    if (index === -1) return [me];
    const from = Math.max(0, index - 1);
    return entries.slice(from, from + 3);
  }, [entries, me]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-5 shadow-sm backdrop-blur-sm transition-all hover:border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-xs">
            <svg viewBox="0 0 24 24" className="size-6 text-white" fill="currentColor" role="img">
              <title>Weekly standings</title>
              <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" />
            </svg>
          </div>
          <div>
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-foreground">
              This week
            </h4>
            <p className="text-[11px] text-muted-foreground">
              {totalRanked > 0
                ? `${totalRanked.toLocaleString()} ranked · resets Monday`
                : "Resets every Monday"}
            </p>
          </div>
        </div>

        <Link
          to="/leaderboard"
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Open the full leaderboard"
        >
          <Maximize2 className="size-3.5" />
        </Link>
      </div>

      <div className="mt-4 space-y-1 pt-2 border-t border-border/40">
        {fetching ? (
          [1, 2, 3].map((n) => <Skeleton key={n} className="h-10 w-full rounded-xl" />)
        ) : window.length === 0 ? (
          <p className="py-4 text-center text-[11px] text-muted-foreground">
            No XP earned yet this week. Complete a wave to join the board.
          </p>
        ) : (
          <ul className="space-y-1">
            {window.map((entry) => (
              <LeaderboardRow key={entry.userId} entry={entry} total={totalRanked} />
            ))}
          </ul>
        )}
      </div>

      <div className="mt-3 pt-2 text-center border-t border-border/20">
        <Link
          to="/leaderboard"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
        >
          <span>View all rankings</span>
          <ChevronRight className="size-3" />
        </Link>
      </div>
    </div>
  );
}
