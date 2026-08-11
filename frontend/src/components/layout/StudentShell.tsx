import { Link, useMatchRoute } from "@tanstack/react-router";
import {
  BookOpen,
  Crown,
  Home,
  LayoutGrid,
  Settings as SettingsIcon,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { StreakFlame } from "@/components/gamification/StreakFlame";
import { XPBar } from "@/components/gamification/XPBar";
import { HelmetCompanion } from "@/components/mascot/HelmetCompanion";
import { StreakCelebrationModal } from "@/components/scenes/StreakCelebrationModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  matchPrefix: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: Home, matchPrefix: "/dashboard" },
  { to: "/courses", label: "My Courses", icon: BookOpen, matchPrefix: "/courses" },
  { to: "/leaderboard", label: "Leaderboard", icon: Users, matchPrefix: "/leaderboard" },
  { to: "/achievements", label: "Achievements", icon: TrendingUp, matchPrefix: "/achievements" },
  { to: "/subscription", label: "Subscription", icon: Crown, matchPrefix: "/subscription" },
  { to: "/settings", label: "Settings", icon: SettingsIcon, matchPrefix: "/settings" },
];

const MOBILE_TABS: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: Home, matchPrefix: "/dashboard" },
  { to: "/courses", label: "Courses", icon: LayoutGrid, matchPrefix: "/courses" },
  { to: "/leaderboard", label: "Ranks", icon: Crown, matchPrefix: "/leaderboard" },
  { to: "/achievements", label: "Stats", icon: TrendingUp, matchPrefix: "/achievements" },
  { to: "/settings", label: "Profile", icon: SettingsIcon, matchPrefix: "/settings" },
];

export interface StudentShellProps {
  children: ReactNode;
  /** Optional banner (e.g. subscription paywall) rendered above the content. */
  banner?: ReactNode;
  className?: string;
}

/**
 * StudentShell — the per-page student layout: left sidebar (desktop) +
 * bottom tab bar (mobile). Used by dashboard, leaderboard, achievements,
 * settings and the courses catalog.
 *
 * Navigation and identity only. Progression state (XP, level, streak) and the
 * logout action live in the global Navbar and the dashboard greeting band; the
 * sidebar deliberately does not repeat them.
 */
export function StudentShell({ children, banner, className }: StudentShellProps) {
  const { user } = useAuthStore();
  const matchRoute = useMatchRoute();
  const [showStreakModal, setShowStreakModal] = useState(false);

  return (
    <div className={cn("mx-auto max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:flex", className)}>
      {/* Sidebar — desktop */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-24 space-y-4 z-45">
          <div className="relative z-45 rounded-2xl border bg-card/70 backdrop-blur-md p-3 text-sidebar-foreground shadow-sm">
            {/* Peeking Helmet Companion */}
            <HelmetCompanion peeking size="sm" mood="neutral" className="right-3 -top-10 z-50" />

            <div className="flex items-center gap-3 px-1 pb-3 pt-1 border-b border-border/40">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 font-bold text-xs text-primary-foreground shadow-xs"
                aria-hidden
              >
                {user?.fullName?.charAt(0).toUpperCase() ?? "S"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-foreground">{user?.fullName ?? "Learner"}</p>
                <p className="truncate text-[10px] text-muted-foreground font-mono">
                  {user?.grade ?? "—"} · {user?.preferredLanguage.toUpperCase() ?? "EN"}
                </p>
              </div>
            </div>

            <nav className="space-y-1 mt-2">
              {NAV_ITEMS.map((item) => {
                const active = matchRoute({ to: item.matchPrefix, fuzzy: true });
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150",
                      active
                        ? "bg-primary text-primary-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-3 border-t border-border/40 pt-3 space-y-2">
              <XPBar totalXp={user?.totalXp ?? 0} compact />
              <div className="flex items-center justify-between gap-2 pt-1">
                <StreakFlame 
                  dayCount={user?.streak ?? 0} 
                  size="sm" 
                  onClick={() => setShowStreakModal(true)}
                />
                <LogoutButton size="sm" variant="ghost" />
              </div>
            </div>
          </div>
        </div>
        <StreakCelebrationModal
          isOpen={showStreakModal}
          onClose={() => setShowStreakModal(false)}
          streakCount={user?.streak ?? 7}
          longestStreak={Math.max(user?.streak ?? 7, 12)}
        />
      </aside>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-6 pb-28 sm:pb-24 lg:pb-0">
        {banner}
        {children}
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
        aria-label="Primary mobile navigation"
      >
        <div className="mx-auto flex max-w-3xl items-stretch justify-between">
          {MOBILE_TABS.map((item) => {
            const active = matchRoute({ to: item.matchPrefix, fuzzy: true });
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 min-h-[48px] text-xs transition-colors active:bg-accent/50 touch-manipulation",
                  active ? "text-primary font-semibold" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="tabular-nums text-[11px] leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/** Helper to render a subscription paywall banner slot. */
export function PaywallBanner({
  title,
  message,
  ctaTo = "/subscription",
}: {
  title: string;
  message: string;
  ctaTo?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-r from-gold/15 via-gold/8 to-card px-4 py-3 shadow-sm sm:px-5 sm:py-4">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Crown className="h-7 w-7 shrink-0 text-gold" />
          <div>
            <p className="font-semibold text-gold-foreground dark:text-gold">{title}</p>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
        <Link to={ctaTo}>
          <Button size="sm" className="bg-gold text-gold-foreground hover:bg-gold/90">
            Manage subscription
          </Button>
        </Link>
      </div>
    </div>
  );
}
