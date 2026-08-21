import { Link } from "@tanstack/react-router";
import { ChevronRight, Maximize2, Shield } from "lucide-react";
import { useMemo } from "react";
import { BlobAvatar } from "@/components/ui/BlobAvatar";
import { buildDemoLeaderboard } from "@/lib/demoData";
import { getLeagueInfo, privateLeaderboardName } from "@/lib/gamification";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

export function DashboardLeagueWidget() {
  const { user } = useAuthStore();
  const youId = user?.id ?? "demo-student-id";
  const userName = user?.fullName ?? "Demo Student";
  const totalXp = user?.totalXp ?? 425;

  const league = useMemo(() => getLeagueInfo(totalXp), [totalXp]);

  const { competitorAbove, currentUser, competitorBelow } = useMemo(() => {
    const list = buildDemoLeaderboard(youId, totalXp, userName, "WEEKLY");
    const userIndex = list.findIndex((e) => e.user.id === youId);
    const u = list[userIndex] ?? { rank: 6, user: { id: youId, fullName: userName }, totalXp };
    const above = userIndex > 0 ? list[userIndex - 1] : list[1] ?? null;
    const below = userIndex < list.length - 1 ? list[userIndex + 1] : list[list.length - 1] ?? null;

    return {
      competitorAbove: above,
      currentUser: u,
      competitorBelow: below,
    };
  }, [youId, totalXp, userName]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-5 shadow-sm backdrop-blur-sm transition-all hover:border-border">
      {/* League Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* League Shield */}
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-xs",
              league.badgeBg
            )}
          >
            <Shield className="size-5 fill-current/20" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-foreground">
              {league.name}
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Top {league.promotionCutoff} advance · 6 days left
            </p>
          </div>
        </div>

        <Link
          to="/leaderboard"
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Open Full Leaderboard"
        >
          <Maximize2 className="size-3.5" />
        </Link>
      </div>

      {/* Leaderboard Standing Row */}
      <div className="mt-4 space-y-2 pt-2 border-t border-border/40">
        {/* Competitor Above */}
        {competitorAbove && (
          <div className="flex items-center justify-between text-xs text-muted-foreground px-2 py-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-4 font-bold text-center shrink-0">{competitorAbove.rank}</span>
              <BlobAvatar
                name={competitorAbove.user.id}
                size={22}
                title={competitorAbove.user.fullName}
              />
              <span className="font-medium text-foreground truncate">
                {privateLeaderboardName(competitorAbove.user.fullName)}
              </span>
            </div>
            <span className="font-semibold text-muted-foreground tabular-nums shrink-0">
              {competitorAbove.totalXp.toLocaleString()} XP
            </span>
          </div>
        )}

        {/* Current Active User Standing */}
        <div className="flex items-center justify-between rounded-xl bg-primary/10 border border-primary/30 px-3 py-2 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-4 font-extrabold text-primary text-center shrink-0">
              {currentUser.rank}
            </span>
            <BlobAvatar name={youId} size={24} title={userName} />
            <span className="font-bold text-foreground truncate">
              {privateLeaderboardName(userName)}
            </span>
          </div>
          <span className="font-bold text-primary tabular-nums shrink-0">
            {totalXp.toLocaleString()} XP
          </span>
        </div>

        {/* Competitor Below */}
        {competitorBelow && (
          <div className="flex items-center justify-between text-xs text-muted-foreground px-2 py-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-4 font-bold text-center shrink-0">{competitorBelow.rank}</span>
              <BlobAvatar
                name={competitorBelow.user.id}
                size={22}
                title={competitorBelow.user.fullName}
              />
              <span className="font-medium text-foreground truncate">
                {privateLeaderboardName(competitorBelow.user.fullName)}
              </span>
            </div>
            <span className="font-semibold text-muted-foreground tabular-nums shrink-0">
              {competitorBelow.totalXp.toLocaleString()} XP
            </span>
          </div>
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
