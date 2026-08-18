import { createFileRoute } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DailySparkModal } from "@/components/daily-spark/DailySparkModal";
import { DashboardAITutorNudge } from "@/components/dashboard/DashboardAITutorNudge";
import { DashboardLeagueWidget } from "@/components/dashboard/DashboardLeagueWidget";
import { DashboardStreakWidget } from "@/components/dashboard/DashboardStreakWidget";
import { BilateralCardDeck } from "@/components/gamification/BilateralCardDeck";
import { StudentShell } from "@/components/layout/StudentShell";
import { Button } from "@/components/ui/button";
import { levelFromXp } from "@/lib/gamification";
import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuthStore();
  const [dailySparkOpen, setDailySparkOpen] = useState(false);

  const totalXp = user?.totalXp ?? 0;
  const { level, xpIntoLevel, xpForNextLevel } = levelFromXp(totalXp);
  const xpToNextLevel = xpForNextLevel - xpIntoLevel;

  // Auto-prompt daily spark if not completed today
  useEffect(() => {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const isCompleted = localStorage.getItem(`daily_spark_${user?.id ?? "guest"}_${todayStr}`);
      if (!isCompleted) {
        const timer = setTimeout(() => setDailySparkOpen(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore
    }
  }, [user?.id]);

  const firstName = user?.fullName?.split(" ")[0] ?? "Learner";

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <StudentShell>
        <div className="space-y-6 pb-12">
          {/* Main 2-Column Responsive Dashboard Layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Sidebar Column (Widgets: Streak, League Standing) */}
            <div className="space-y-5 lg:col-span-4">
              {/* Daily Streak Widget */}
              <DashboardStreakWidget />

              {/* League Standing Widget */}
              <DashboardLeagueWidget />
            </div>

            {/* Right Main Column (Focus & 3D Depth Deck) */}
            <div className="space-y-6 lg:col-span-8">
              {/* Clean Greeting & Warmup Banner */}
              <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-sm backdrop-blur-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-normal font-serif text-foreground">
                    Good evening, {firstName}.
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                    You're <span className="font-bold text-foreground">{xpToNextLevel} XP</span> from Level {level + 1}. ({totalXp.toLocaleString()} XP total)
                  </p>
                </div>

                <div className="shrink-0">
                  <Button
                    onClick={() => setDailySparkOpen(true)}
                    className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-5 shadow-sm"
                  >
                    <Zap className="size-4 fill-white mr-1.5" /> Start Warmup (+55 XP)
                  </Button>
                </div>
              </div>

              {/* AI Tutor Nudge Prompt */}
              <DashboardAITutorNudge />

              {/* Bilateral Swappable Course Card Stack */}
              <BilateralCardDeck />
            </div>
          </div>
        </div>

        {/* Daily Spark Modal Interstitial */}
        <DailySparkModal
          isOpen={dailySparkOpen}
          onClose={() => setDailySparkOpen(false)}
        />
      </StudentShell>
    </ProtectedRoute>
  );
}
