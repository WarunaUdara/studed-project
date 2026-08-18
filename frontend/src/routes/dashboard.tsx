import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DailySparkModal } from "@/components/daily-spark/DailySparkModal";
import { DashboardLeagueWidget } from "@/components/dashboard/DashboardLeagueWidget";
import { DashboardPremiumCard } from "@/components/dashboard/DashboardPremiumCard";
import { DashboardStreakWidget } from "@/components/dashboard/DashboardStreakWidget";
import { BilateralCardDeck } from "@/components/gamification/BilateralCardDeck";
import { StudentShell } from "@/components/layout/StudentShell";
import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuthStore();
  const [dailySparkOpen, setDailySparkOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.assign(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <StudentShell>
        <div className="mx-auto max-w-6xl py-2 pb-16">
          {/* 2-Column Clean Grid Layout */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 items-start">
            {/* Left Rail: Search & Widgets */}
            <div className="space-y-4 md:col-span-5 lg:col-span-5">
              {/* Search Bar Input */}
              <form
                onSubmit={handleSearchSubmit}
                className="relative flex items-center rounded-full border border-border/70 bg-card px-4 py-2 shadow-xs transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
              >
                <Search className="size-4 text-muted-foreground mr-2 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What do you want to learn?"
                  className="w-full bg-transparent text-xs sm:text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  className="rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground px-3 py-1 text-xs font-bold transition-colors ml-1 shrink-0"
                >
                  Ask
                </button>
              </form>

              {/* 1. Streak Tracker Widget */}
              <DashboardStreakWidget />

              {/* 2. Unlock Premium Showcase Card */}
              <DashboardPremiumCard />

              {/* 3. Hydrogen League Standings Widget */}
              <DashboardLeagueWidget />
            </div>

            {/* Right Main Rail: 3D Bilateral Swappable Card Deck */}
            <div className="md:col-span-7 lg:col-span-7 flex flex-col items-center justify-center">
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
