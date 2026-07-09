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
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { StreakFlame } from "@/components/gamification/StreakFlame";
import { XPBar } from "@/components/gamification/XPBar";
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
 * settings and the courses catalog. The global top Navbar still renders the
 * brand + XP bar; this shell adds the contextual navigation chrome.
 */
export function StudentShell({ children, banner, className }: StudentShellProps) {
  const { user } = useAuthStore();
  const matchRoute = useMatchRoute();

  return (
    <div className={cn("mx-auto max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:flex", className)}>
      {/* Sidebar — desktop */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-20 space-y-4">
          <div className="rounded-2xl border bg-sidebar p-3 text-sidebar-foreground shadow-sm">
            <div className="flex items-center gap-3 px-1 pb-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 font-bold text-primary-foreground"
                aria-hidden
              >
                {user?.fullName?.charAt(0).toUpperCase() ?? "S"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user?.fullName ?? "Learner"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.grade ?? "—"} · {user?.preferredLanguage.toUpperCase() ?? "EN"}
                </p>
              </div>
            </div>

            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const active = matchRoute({ to: item.matchPrefix, fuzzy: true });
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-sidebar-foreground hover:bg-sidebar-accent",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-3 border-t border-sidebar-border pt-3">
              <XPBar totalXp={user?.totalXp ?? 0} compact />
              <div className="mt-2 flex items-center justify-between gap-2">
                <StreakFlame dayCount={0} size="sm" />
                <LogoutButton size="sm" variant="ghost" />
              </div>
            </div>
          </div>

          <p className="px-2 text-[11px] text-muted-foreground">Grade 1–11 · O/L · A/L</p>
        </div>
      </aside>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-6 pb-24 lg:pb-0">
        {banner}
        {children}
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur lg:hidden"
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
                  "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="tabular-nums">{item.label}</span>
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
  ctaTo = "/settings",
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
