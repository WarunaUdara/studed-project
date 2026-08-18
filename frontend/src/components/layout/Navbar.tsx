import { Link, useRouterState } from "@tanstack/react-router";
import {
  Award,
  Brain,
  Code,
  Compass,
  Crown,
  Flame,
  GraduationCap,
  Info,
  Key,
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
import { FloatingCardNav, type MegaMenuItem } from "@/components/ui/CardNav";
import { useAuthStore } from "@/stores/auth";
import { useUiPrefs } from "@/stores/uiPrefs";

export function Navbar() {
  const { user, isAuthenticated } = useAuthStore();
  const theme = useUiPrefs((s) => s.theme);
  const toggleTheme = useUiPrefs((s) => s.toggleTheme);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const pathname = useRouterState().location.pathname;
  const streak = Math.max(1, user?.streak ?? 1);
  const keys = 2;

  const NAV_ITEMS: MegaMenuItem[] = [
    {
      id: "courses",
      label: "Courses",
      href: "/courses",
      links: [
        {
          label: "Scientific Thinking",
          href: "/courses",
          description: "Interactive 3D gears, physics & mechanics",
          icon: <Brain className="size-4 text-amber-500" />,
          badge: "Popular",
        },
        {
          label: "Thinking in Python",
          href: "/courses",
          description: "Code logic, algorithms & grid mazes",
          icon: <Code className="size-4 text-emerald-500" />,
          badge: "New",
        },
        {
          label: "Mathematics Foundations",
          href: "/courses",
          description: "Visual fractions, algebra & geometry",
          icon: <Compass className="size-4 text-blue-500" />,
        },
        {
          label: "All Learning Paths",
          href: "/courses",
          description: "Explore the full curriculum library",
          icon: <LayoutGrid className="size-4 text-purple-500" />,
        },
      ],
      previewCards: [
        {
          title: "Scientific Thinking",
          subtitle: "Explore gear train physics, angular velocity, and mechanical parity with interactive 3D simulations.",
          href: "/courses",
          gradient: "bg-gradient-to-tr from-amber-600/30 via-orange-500/20 to-yellow-400/20",
          icon: <span className="text-xl">💡⚙️</span>,
        },
        {
          title: "Thinking in Python",
          subtitle: "Master algorithmic thinking by guiding the Blob Mascot through dynamic code mazes.",
          href: "/courses",
          gradient: "bg-gradient-to-tr from-emerald-600/30 via-teal-500/20 to-cyan-400/20",
          icon: <span className="text-xl">🐍</span>,
        },
      ],
    },
    {
      id: "leagues",
      label: "Leagues",
      href: "/leaderboard",
      links: [
        {
          label: "Hydrogen League",
          href: "/leaderboard",
          description: "Weekly competitive league standings",
          icon: <Trophy className="size-4 text-amber-500" />,
        },
        {
          label: "Global Leaderboard",
          href: "/leaderboard",
          description: "All-time student rankings across Sri Lanka",
          icon: <Users className="size-4 text-indigo-500" />,
        },
        {
          label: "Achievements & Badges",
          href: "/achievements",
          description: "Milestones, trophies & special unlocks",
          icon: <Award className="size-4 text-rose-500" />,
        },
      ],
      previewCards: [
        {
          title: "Weekly Hydrogen League",
          subtitle: "You're in the Top 5 this week! Complete today's daily wave to earn promotion into Helium League.",
          href: "/leaderboard",
          gradient: "bg-gradient-to-tr from-indigo-600/30 via-purple-500/20 to-pink-500/20",
          icon: <Trophy className="size-6 text-amber-400" />,
        },
      ],
    },
    {
      id: "quests",
      label: "Quests",
      href: "/dashboard",
      links: [
        {
          label: "Daily Spark Warmup",
          href: "/dashboard",
          description: "Quick 2-minute daily cognitive booster",
          icon: <Zap className="size-4 text-lime-500" />,
          badge: "+15 XP",
        },
        {
          label: "Daily Keys Refill",
          href: "/subscription",
          description: "2 free keys refreshed every 24 hours",
          icon: <Key className="size-4 text-amber-400" />,
        },
        {
          label: "Streak Protection",
          href: "/dashboard",
          description: "Keep your daily learning momentum alive",
          icon: <Flame className="size-4 text-orange-500" />,
        },
      ],
      previewCards: [
        {
          title: "Daily Spark Challenge",
          subtitle: "Earn extra XP and maintain your 7-day study streak with daily bite-sized puzzles.",
          href: "/dashboard",
          gradient: "bg-gradient-to-tr from-lime-600/30 via-emerald-500/20 to-teal-400/20",
          icon: <Zap className="size-6 text-lime-400" />,
        },
      ],
    },
    {
      id: "portal",
      label: "Platform",
      links: [
        {
          label: "About StudEd",
          href: "/",
          description: "School, rewritten as a game you can win",
          icon: <Info className="size-4 text-blue-500" />,
        },
        {
          label: "Subscription & Pro",
          href: "/subscription",
          description: "Unlimited keys, offline waves & analytics",
          icon: <Crown className="size-4 text-amber-500" />,
        },
        ...(user?.role === "EDUCATOR" ||
        user?.role === "HEAD_EDUCATOR" ||
        user?.role === "ADMIN"
          ? [
              {
                label: "Educator Portal",
                href: "/educator",
                description: "Curriculum authoring & class telemetry",
                icon: <GraduationCap className="size-4 text-emerald-500" />,
              },
            ]
          : []),
        {
          label: "Profile & Settings",
          href: "/settings",
          description: "Manage avatar, notifications & language",
          icon: <Settings className="size-4 text-neutral-400" />,
        },
      ],
      previewCards: [
        {
          title: "StudEd Pro Membership",
          subtitle: "Unlock unlimited daily keys, deep performance insights, and custom wave challenges.",
          href: "/subscription",
          gradient: "bg-gradient-to-tr from-amber-600/30 via-purple-500/20 to-pink-500/20",
          icon: <Crown className="size-6 text-amber-400" />,
        },
      ],
    },
  ];

  return (
    <>
      <FloatingCardNav
        activePath={pathname}
        items={NAV_ITEMS}
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

            {/* Keys Balance Pill */}
            <Link to="/subscription">
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300 text-xs font-bold transition-transform hover:scale-105"
                title={`${keys} Keys Available`}
              >
                <span>{keys}</span>
                <span>🗝️</span>
              </div>
            </Link>

            {/* Streak Counter Pill */}
            <Link to="/dashboard">
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-300 text-xs font-bold transition-transform hover:scale-105"
                title={`${streak} Day Streak`}
              >
                <span>{streak}</span>
                <span>⚡</span>
              </div>
            </Link>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4" />}
            </button>

            {/* User Profile / Auth Actions */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/settings">
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs border border-primary/40 hover:scale-105 transition-transform">
                    {user?.fullName?.slice(0, 1).toUpperCase() || "S"}
                  </div>
                </Link>
                <div className="hidden lg:block">
                  <LogoutButton />
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => setLoginModalOpen(true)}
                className="rounded-full font-bold text-xs px-4"
              >
                Log In
              </Button>
            )}
          </div>
        }
      />

      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
  );
}
