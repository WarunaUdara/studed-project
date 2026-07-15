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
  { to: "/educator", label: "Dashboard", icon: Home, matchPrefix: "/educator" },
  { to: "/educator/courses", label: "My Courses", icon: BookOpen, matchPrefix: "/educator/courses" },
  { to: "/educator/leaderboard", label: "Leaderboard", icon: Users, matchPrefix: "/educator/leaderboard" },
  { to: "/educator/achievements", label: "Achievements", icon: TrendingUp, matchPrefix: "/educator/achievements" },
  { to: "/educator/settings", label: "Settings", icon: SettingsIcon, matchPrefix: "/educator/settings" },
];

const MOBILE_TABS: NavItem[] = [
  { to: "/educator", label: "Home", icon: Home, matchPrefix: "/educator" },
  { to: "/educator/courses", label: "Courses", icon: LayoutGrid, matchPrefix: "/educator/courses" },
  { to: "/educator/leaderboard", label: "Ranks", icon: Crown, matchPrefix: "/educator/leaderboard" },
  { to: "/educator/achievements", label: "Stats", icon: TrendingUp, matchPrefix: "/educator/achievements" },
  { to: "/educator/settings", label: "Profile", icon: SettingsIcon, matchPrefix: "/educator/settings" },
];

export interface EducatorShellProps {
  children: ReactNode;
  className?: string;
}

export function EducatorShell({ children, className }: EducatorShellProps) {
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
                {user?.fullName?.charAt(0).toUpperCase() ?? "E"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user?.fullName ?? "Educator"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.role === "HEAD_EDUCATOR" ? "Head Educator" : "Educator"} · {user?.preferredLanguage?.toUpperCase() ?? "EN"}
                </p>
              </div>
            </div>

            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                // Fuzzy match for nested courses links
                const active = matchRoute({ to: item.matchPrefix, fuzzy: item.matchPrefix !== "/educator" });
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
              <div className="flex items-center justify-end">
                <LogoutButton size="sm" variant="ghost" />
              </div>
            </div>
          </div>

          <p className="px-2 text-[11px] text-muted-foreground">Educator Portal · Curriculum Management</p>
        </div>
      </aside>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-6 pb-24 lg:pb-0">
        {children}
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur lg:hidden"
        aria-label="Primary mobile navigation"
      >
        <div className="mx-auto flex max-w-3xl items-stretch justify-between">
          {MOBILE_TABS.map((item) => {
            const active = matchRoute({ to: item.matchPrefix, fuzzy: item.matchPrefix !== "/educator" });
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
