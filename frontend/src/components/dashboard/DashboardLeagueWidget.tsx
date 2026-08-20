import { Link } from "@tanstack/react-router";
import { ChevronRight, Maximize2 } from "lucide-react";
import { BlobAvatar } from "@/components/ui/BlobAvatar";
import { useAuthStore } from "@/stores/auth";

export function DashboardLeagueWidget() {
  const { user } = useAuthStore();
  const userName = user?.fullName
    ? user.fullName.split(" ")[0] + " " + (user.fullName.split(" ")[1]?.charAt(0) ?? "U")
    : "Waruna U";
  const totalXp = user?.totalXp ?? 55;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-5 shadow-sm backdrop-blur-sm transition-all hover:border-border">
      {/* League Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Bronze Shield */}
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-xs">
            <svg viewBox="0 0 24 24" className="size-6 text-white" fill="currentColor">
              <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" />
            </svg>
          </div>
          <div>
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-foreground">
              Hydrogen League
            </h4>
            <p className="text-[11px] text-muted-foreground">Top 15 advance · 6 days left</p>
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
        {/* Sample Member Above */}
        <div className="flex items-center justify-between text-xs text-muted-foreground px-2 py-1">
          <div className="flex items-center gap-2.5">
            <span className="w-4 font-bold text-center">5</span>
            <div className="flex size-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
              D
            </div>
            <span className="font-medium text-foreground">David E</span>
          </div>
          <span className="font-semibold text-muted-foreground">200 XP</span>
        </div>

        {/* Current Active User Standing */}
        <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 px-3 py-2 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-4 font-extrabold text-emerald-600 dark:text-emerald-400 text-center">
              6
            </span>
            <BlobAvatar name={user?.id ?? "learner"} size={24} title={userName} />
            <span className="font-bold text-foreground">{userName}</span>
          </div>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {totalXp} XP
          </span>
        </div>

        {/* Sample Member Below */}
        <div className="flex items-center justify-between text-xs text-muted-foreground px-2 py-1">
          <div className="flex items-center gap-2.5">
            <span className="w-4 font-bold text-center">7</span>
            <div className="flex size-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
              J
            </div>
            <span className="font-medium text-foreground">Jeremy L</span>
          </div>
          <span className="font-semibold text-muted-foreground">50 XP</span>
        </div>
      </div>

      <div className="mt-3 pt-2 text-center">
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
