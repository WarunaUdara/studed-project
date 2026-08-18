import { Link, useRouterState } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  Brain,
  Code,
  Compass,
  Crown,
  Flame,
  GraduationCap,
  Home,
  Info,
  Key,
  LayoutDashboard,
  LayoutGrid,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { LoginModal } from "@/components/auth/LoginModal";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Button } from "@/components/ui/button";
import { FloatingCardNav, type MegaMenuItem } from "@/components/ui/CardNav";
import { SearchAskModal } from "@/components/search/SearchAskModal";
import { levelFromXp } from "@/lib/gamification";
import { useAuthStore } from "@/stores/auth";
import { useUiPrefs } from "@/stores/uiPrefs";

export function Navbar() {
  const { user, isAuthenticated } = useAuthStore();
  const theme = useUiPrefs((s) => s.theme);
  const toggleTheme = useUiPrefs((s) => s.toggleTheme);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const pathname = useRouterState().location.pathname;
  const streak = Math.max(1, user?.streak ?? 1);
  const keys = 2;
  const totalXp = Math.max(0, user?.totalXp ?? 140);
  const levelInfo = levelFromXp(totalXp);

  // Global Cmd+K / Ctrl+K keyboard shortcut for Search & Ask
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const NAV_ITEMS: MegaMenuItem[] = [
    ...(isAuthenticated
      ? [
          {
            id: "dashboard",
            label: "Dashboard",
            href: "/dashboard",
            links: [
              {
                label: "Student Overview",
                href: "/dashboard",
                description: "Continue where you left off and complete daily waves",
                icon: <LayoutDashboard className="size-4 text-primary" />,
                badge: "Active",
              },
              {
                label: "Daily Spark Warmup",
                href: "/dashboard",
                description: "Quick 2-minute daily cognitive booster (+15 XP)",
                icon: <Zap className="size-4 text-lime-500" />,
              },
              {
                label: "Course Progress Map",
                href: "/courses",
                description: "View all enrolled tracks and pedagogical milestones",
                icon: <BookOpen className="size-4 text-amber-500" />,
              },
            ],
            previewCards: [
              {
                title: "Student Dashboard",
                subtitle: "Resume your active learning track, solve kinetic gear puzzles, and protect your 7-day streak.",
                href: "/dashboard",
                gradient: "bg-gradient-to-tr from-primary/30 via-emerald-500/20 to-teal-400/20",
                icon: <Sparkles className="size-6 text-primary" />,
              },
            ],
          },
        ]
      : [
          {
            id: "home",
            label: "Home",
            href: "/",
            links: [
              {
                label: "Overview",
                href: "/",
                description: "School, rewritten as a game you can win",
                icon: <Home className="size-4 text-primary" />,
              },
              {
                label: "Explore Curriculum",
                href: "/courses",
                description: "Browse interactive STEM and language courses",
                icon: <BookOpen className="size-4 text-amber-500" />,
              },
            ],
          },
        ]),
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
        logoNode={
          <Link
            to={isAuthenticated ? "/dashboard" : "/"}
            className="flex items-center gap-1 font-serif text-2xl font-bold tracking-tight text-foreground hover:opacity-90 transition-opacity"
          >
            Stud<span className="italic text-primary">Ed</span>
          </Link>
        }
        rightNode={
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Instant Search & AI Ask Trigger Button */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="flex items-center gap-2 rounded-full border border-border/80 bg-card/60 hover:bg-muted px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-all shadow-2xs"
              title="Search topics & waves (⌘K)"
            >
              <Search className="size-3.5 text-primary" />
              <span className="hidden md:inline font-medium">Search / Ask</span>
              <kbd className="hidden lg:inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold border border-border/80 text-muted-foreground">
                ⌘K
              </kbd>
            </button>

            {/* Go Premium CTA Pill */}
            <Link to="/subscription">
              <button
                type="button"
                className="hidden sm:inline-flex rounded-full border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold text-xs px-3.5 py-1.5 transition-all shadow-2xs"
              >
                Go Premium
              </button>
            </Link>

            {/* XP & Level Badge Pill */}
            <Link to="/achievements">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-xs font-bold transition-transform hover:scale-105"
                title={`Level ${levelInfo.level} · ${totalXp} XP (${Math.round(levelInfo.progress * 100)}% to Level ${levelInfo.level + 1})`}
              >
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 px-1.5 py-0.5 rounded-full text-emerald-700 dark:text-emerald-300">
                  LVL {levelInfo.level}
                </span>
                <span>{totalXp}</span>
                <span className="text-emerald-500 text-xs">✦</span>
              </div>
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

      {/* Modals */}
      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
      <SearchAskModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </>
  );
}
