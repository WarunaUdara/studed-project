import { Link, useRouterState } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  Compass,
  Crown,
  GraduationCap,
  Home,
  LayoutGrid,
  Moon,
  Settings,
  Sun,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { LoginModal } from "@/components/auth/LoginModal";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Button } from "@/components/ui/button";
import { CardNav, type CardNavItem } from "@/components/ui/CardNav";
import { useAuthStore } from "@/stores/auth";
import { useUiPrefs } from "@/stores/uiPrefs";

export function Navbar() {
  const { user, isAuthenticated } = useAuthStore();
  const theme = useUiPrefs((s) => s.theme);
  const toggleTheme = useUiPrefs((s) => s.toggleTheme);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const pathname = useRouterState().location.pathname;
  const isHome = pathname === "/" || pathname === "/dashboard";
  const isCourses = pathname.startsWith("/courses");

  const streak = Math.max(1, user?.streak ?? 1);

  const CARD_NAV_ITEMS: CardNavItem[] = [
    {
      label: "Learning Paths & Curriculums",
      links: [
        {
          label: "Mathematics Foundations",
          href: "/courses",
          icon: <BookOpen className="size-4 text-emerald-500" />,
        },
        {
          label: "Thinking in Python & Coding",
          href: "/courses",
          icon: <Compass className="size-4 text-purple-500" />,
        },
        {
          label: "All Learning Paths",
          href: "/courses",
          icon: <LayoutGrid className="size-4 text-blue-500" />,
        },
      ],
    },
    {
      label: "Leagues & Competition",
      links: [
        {
          label: "Hydrogen League",
          href: "/leaderboard",
          icon: <Trophy className="size-4 text-amber-500" />,
        },
        {
          label: "Global Leaderboard",
          href: "/leaderboard",
          icon: <Users className="size-4 text-indigo-500" />,
        },
        {
          label: "Achievements & Badges",
          href: "/achievements",
          icon: <Award className="size-4 text-rose-500" />,
        },
      ],
    },
    {
      label: "Quests, Stats & Portal",
      links: [
        {
          label: "Daily Spark Warmup",
          href: "/dashboard",
          icon: <Zap className="size-4 text-lime-500" />,
        },
        {
          label: "Subscription & Premium",
          href: "/subscription",
          icon: <Crown className="size-4 text-amber-400" />,
        },
        {
          label: "Profile & Settings",
          href: "/settings",
          icon: <Settings className="size-4 text-neutral-400" />,
        },
        ...(user?.role === "EDUCATOR" ||
        user?.role === "HEAD_EDUCATOR" ||
        user?.role === "ADMIN"
          ? [
              {
                label: "Educator Portal",
                href: "/educator",
                icon: <GraduationCap className="size-4 text-primary" />,
              },
            ]
          : []),
      ],
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full">
      <CardNav
        logoNode={
          <Link
            to="/"
            className="text-2xl font-serif font-bold tracking-tight hover:text-primary transition-colors flex items-center gap-1 text-foreground"
          >
            Stud<span className="text-primary italic">Ed</span>
          </Link>
        }
        centerNode={
          <div className="flex items-center gap-1 ml-4">
            <Link
              to={isAuthenticated ? "/dashboard" : "/"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                isHome
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Home className="size-3.5" />
              <span>Home</span>
            </Link>

            <Link
              to="/courses"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                isCourses
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <BookOpen className="size-3.5" />
              <span>Courses</span>
            </Link>
          </div>
        }
        rightNode={
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Go Premium CTA Pill */}
            <Link to="/subscription">
              <button
                type="button"
                className="hidden sm:inline-flex rounded-full border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold text-xs px-3.5 py-1.5 transition-all shadow-2xs"
              >
                Go Premium
              </button>
            </Link>

            {/* XP Points Pill */}
            {isAuthenticated && (
              <div className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/60 px-2.5 py-1 text-xs font-bold text-foreground">
                <span className="font-extrabold text-amber-500">2</span>
                <span className="text-amber-500">🗝️</span>
              </div>
            )}

            {/* Streak & Battery Indicator */}
            {isAuthenticated && (
              <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/60 px-2.5 py-1 text-xs font-bold text-foreground">
                <span className="font-extrabold">{streak}</span>
                <Zap className="size-3.5 fill-amber-400 text-amber-400" />
              </div>
            )}

            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="size-8 rounded-full"
            >
              {theme === "dark" ? (
                <Sun className="size-4 text-warning" />
              ) : (
                <Moon className="size-4 text-primary" />
              )}
            </Button>

            {/* Auth Buttons / Profile Avatar */}
            {!isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLoginModalOpen(true)}
                  className="rounded-full text-xs font-bold"
                >
                  Log in
                </Button>
                <Link to="/register">
                  <Button size="sm" className="rounded-full text-xs font-bold px-4">
                    Sign up
                  </Button>
                </Link>
                <LoginModal
                  isOpen={loginModalOpen}
                  onClose={() => setLoginModalOpen(false)}
                />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/settings" title="Profile Settings">
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary font-bold text-xs text-primary-foreground shadow-xs hover:scale-105 transition-transform">
                    {user?.fullName?.charAt(0).toUpperCase() ?? "S"}
                  </div>
                </Link>
                <LogoutButton size="sm" variant="ghost" className="hidden lg:inline-flex" />
              </div>
            )}
          </div>
        }
        items={CARD_NAV_ITEMS}
      />
    </header>
  );
}
