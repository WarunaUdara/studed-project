import { Link, useMatchRoute } from "@tanstack/react-router";
import {
  BookOpen,
  Crown,
  Home,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  Settings as SettingsIcon,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { BlobAvatar } from "@/components/ui/BlobAvatar";
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
  {
    to: "/educator/courses",
    label: "My Courses",
    icon: BookOpen,
    matchPrefix: "/educator/courses",
  },
  {
    to: "/educator/leaderboard",
    label: "Leaderboard",
    icon: Users,
    matchPrefix: "/educator/leaderboard",
  },
  {
    to: "/educator/achievements",
    label: "Achievements",
    icon: TrendingUp,
    matchPrefix: "/educator/achievements",
  },
  {
    to: "/educator/settings",
    label: "Settings",
    icon: SettingsIcon,
    matchPrefix: "/educator/settings",
  },
];

const MOBILE_TABS: NavItem[] = [
  { to: "/educator", label: "Home", icon: Home, matchPrefix: "/educator" },
  { to: "/educator/courses", label: "Courses", icon: LayoutGrid, matchPrefix: "/educator/courses" },
  {
    to: "/educator/leaderboard",
    label: "Ranks",
    icon: Crown,
    matchPrefix: "/educator/leaderboard",
  },
  {
    to: "/educator/achievements",
    label: "Stats",
    icon: TrendingUp,
    matchPrefix: "/educator/achievements",
  },
  {
    to: "/educator/settings",
    label: "Profile",
    icon: SettingsIcon,
    matchPrefix: "/educator/settings",
  },
];

const SIDEBAR_STORAGE_KEY = "studed:educator-sidebar-collapsed";

function loadSidebarState(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export interface EducatorShellProps {
  children: ReactNode;
  className?: string;
}

export function EducatorShell({ children, className }: EducatorShellProps) {
  const { user } = useAuthStore();
  const matchRoute = useMatchRoute();

  // Notion-style collapsible side panel. Persisted so the educator's choice
  // survives navigation — collapsing it gives the wave editor (and other
  // pages) the full remaining width.
  const [collapsed, setCollapsed] = useState(loadSidebarState);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // storage unavailable (private mode) — state still works per session
    }
  }, [collapsed]);

  return (
    <div className={cn("mx-auto max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:flex", className)}>
      {/* Sidebar - desktop */}
      <aside
        className={cn(
          "hidden shrink-0 lg:block transition-[width] duration-200 ease-out",
          collapsed ? "w-[4.25rem]" : "w-60",
        )}
      >
        <div className="sticky top-20 space-y-4">
          <div className="rounded-2xl border bg-sidebar p-3 text-sidebar-foreground shadow-sm">
            {/* Collapse toggle + profile */}
            <div
              className={cn(
                "flex items-center gap-3 pb-3",
                collapsed ? "justify-center px-0" : "px-1",
              )}
            >
              <Link
                to="/educator/settings"
                title="View Profile & Settings"
                className={cn(
                  "flex items-center gap-3 pb-3 transition-opacity hover:opacity-80 group",
                  collapsed ? "justify-center px-0" : "px-1",
                )}
              >
                <BlobAvatar
                  name={user?.id ?? "educator"}
                  size={40}
                  title={user?.fullName ?? "Educator"}
                  className="shrink-0 group-hover:scale-105 transition-transform"
                />
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold group-hover:text-primary transition-colors">
                      {user?.fullName ?? "Educator"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user?.role === "HEAD_EDUCATOR" ? "Head Educator" : "Educator"} ·{" "}
                      {user?.preferredLanguage?.toUpperCase() ?? "EN"}
                    </p>
                  </div>
                )}
              </Link>
              <button
                onClick={() => setCollapsed((c) => !c)}
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
                  collapsed && "absolute -right-2.5 top-3 z-10 h-6 w-6 rounded-full border bg-background shadow-sm",
                )}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <PanelLeftOpen className="h-3.5 w-3.5" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </button>
            </div>

            <nav className={cn("space-y-1", collapsed && "mt-1")}>
              {NAV_ITEMS.map((item) => {
                // Fuzzy match for nested courses links
                const active = matchRoute({
                  to: item.matchPrefix,
                  fuzzy: item.matchPrefix !== "/educator",
                });
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      collapsed && "justify-center px-0",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-sidebar-foreground hover:bg-sidebar-accent",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-3 border-t border-sidebar-border pt-3">
              <div className={cn("flex", collapsed ? "justify-center" : "items-center justify-end")}>
                <LogoutButton size="sm" variant="ghost" compact={collapsed} />
              </div>
            </div>
          </div>

          {!collapsed && (
            <p className="px-2 text-[11px] text-muted-foreground">
              Educator Portal · Curriculum Management
            </p>
          )}
        </div>
      </aside>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-6 pb-28 sm:pb-24 lg:pb-0">{children}</div>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
        aria-label="Primary mobile navigation"
      >
        <div className="mx-auto flex max-w-3xl items-stretch justify-between">
          {MOBILE_TABS.map((item) => {
            const active = matchRoute({
              to: item.matchPrefix,
              fuzzy: item.matchPrefix !== "/educator",
            });
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
