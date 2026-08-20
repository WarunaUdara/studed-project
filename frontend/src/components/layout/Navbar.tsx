import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  BookOpen,
  Brain,
  Code,
  Compass,
  Crown,
  Flame,
  GraduationCap,
  Key,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LoginModal } from "@/components/auth/LoginModal";
import { Button } from "@/components/ui/button";
import { FloatingCardNav, type MegaMenuItem } from "@/components/ui/CardNav";
import { SearchAskModal } from "@/components/search/SearchAskModal";
import { levelFromXp } from "@/lib/gamification";
import { useAuthStore } from "@/stores/auth";
import { useUiPrefs } from "@/stores/uiPrefs";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const theme = useUiPrefs((s) => s.theme);
  const toggleTheme = useUiPrefs((s) => s.toggleTheme);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pathname = useRouterState().location.pathname;
  const isLandingPage = pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);

  const streak = Math.max(1, user?.streak ?? 1);
  const keys = 2;
  const totalXp = Math.max(0, user?.totalXp ?? 140);
  const levelInfo = levelFromXp(totalXp);

  // Detect scroll state for landing page
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [userDropdownOpen]);

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

  // Landing Page Unauthenticated Navbar: Floating minimal pill capsule with fully curved ends
  if (isLandingPage && !isAuthenticated) {
    return (
      <>
        <div className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6 pointer-events-none">
          <header className="pointer-events-auto mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full border border-border/60 bg-background/80 px-6 backdrop-blur-xl shadow-xs transition-all duration-300">
            {/* Left: Text Logo */}
            <Link
              to="/"
              className="flex items-center gap-1 font-serif text-2xl font-bold tracking-tight text-foreground hover:opacity-90 transition-opacity"
            >
              Stud<span className="italic text-primary">Ed</span>
            </Link>

            {/* Right: Sign in (always) + Get started (revealed on scroll) */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLoginModalOpen(true)}
                className="rounded-full border-border/80 px-5 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Sign in
              </Button>

              <AnimatePresence>
                {isScrolled && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, width: 0 }}
                    animate={{ opacity: 1, scale: 1, width: "auto" }}
                    exit={{ opacity: 0, scale: 0.9, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <Button
                      asChild
                      size="sm"
                      className="rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 shadow-xs"
                    >
                      <Link to="/register">Get started</Link>
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </header>
        </div>

        {/* Modals */}
        <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
        <SearchAskModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
      </>
    );
  }

  // Clean, focused navigation categories
  const NAV_ITEMS: MegaMenuItem[] = [
    {
      id: "courses",
      label: "Courses",
      href: "/courses",
      links: [
        {
          label: "Scientific Thinking (Gears)",
          href: "/courses/science-thinking",
          description: "Interactive 3D gears, mechanical physics & parity",
          icon: <Brain className="size-4 text-amber-500" />,
          badge: "Science",
        },
        {
          label: "Thinking in Python & Coding",
          href: "/courses",
          description: "Algorithmic logic mazes & Blob mascot",
          icon: <Code className="size-4 text-emerald-500" />,
          badge: "Coding",
        },
        {
          label: "Mathematics Foundations",
          href: "/courses",
          description: "Visual fractions, geometry & coordinate proofs",
          icon: <Compass className="size-4 text-blue-500" />,
        },
        {
          label: "All Learning Paths",
          href: "/courses",
          description: "Browse the full catalog across all grade levels",
          icon: <LayoutGrid className="size-4 text-purple-500" />,
        },
      ],
      previewCards: [
        {
          title: "Scientific Thinking",
          subtitle: "Explore gear train physics, angular velocity, and mechanical parity with interactive 3D simulations.",
          href: "/courses/science-thinking",
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
          badge: "Top 5",
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
          label: "Streak Momentum",
          href: "/dashboard",
          description: "Maintain your continuous daily learning streak",
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
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Search Trigger Icon Button */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="flex size-9 items-center justify-center rounded-full border border-border/80 bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-2xs"
              title="Search topics & waves (⌘K)"
              aria-label="Search topics and lessons"
            >
              <Search className="size-4 text-foreground/80" />
            </button>

            {/* Combined Compact Gamification Stats Pill */}
            {isAuthenticated && (
              <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-2.5 py-1 text-xs font-bold shadow-2xs">
                {/* XP Level */}
                <Link
                  to="/achievements"
                  className="flex items-center gap-1 text-emerald-600 dark:text-emerald-300 hover:opacity-80 transition-opacity"
                  title={`Level ${levelInfo.level} · ${totalXp} XP`}
                >
                  <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-black uppercase">
                    LVL {levelInfo.level}
                  </span>
                  <span>{totalXp}</span>
                  <span className="text-[10px]">✦</span>
                </Link>

                <span className="text-border">|</span>

                {/* Keys Balance */}
                <Link
                  to="/subscription"
                  className="flex items-center gap-0.5 text-amber-600 dark:text-amber-300 hover:opacity-80 transition-opacity"
                  title={`${keys} Keys Available`}
                >
                  <span>{keys}</span>
                  <span className="text-xs">🗝️</span>
                </Link>

                <span className="text-border">|</span>

                {/* Streak */}
                <Link
                  to="/dashboard"
                  className="flex items-center gap-0.5 text-orange-600 dark:text-orange-300 hover:opacity-80 transition-opacity"
                  title={`${streak} Day Streak`}
                >
                  <span>{streak}</span>
                  <span className="text-xs">⚡</span>
                </Link>
              </div>
            )}

            {/* Go Premium CTA */}
            <Link to="/subscription" className="hidden md:inline-flex">
              <button
                type="button"
                className="rounded-full border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold text-xs px-3 py-1.5 transition-all shadow-2xs"
              >
                Go Premium
              </button>
            </Link>

            {/* User Profile Avatar with Comprehensive Dropdown */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex size-9 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs border border-primary/40 hover:scale-105 transition-transform"
                  aria-label="User profile menu"
                >
                  {user?.fullName?.slice(0, 1).toUpperCase() || "S"}
                </button>

                {/* Profile Menu Dropdown */}
                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-2xl border border-border/80 bg-card p-2 shadow-2xl backdrop-blur-xl"
                    >
                      {/* User Info Header */}
                      <div className="border-b border-border/50 px-3 py-2.5">
                        <p className="text-xs font-bold text-foreground truncate">
                          {user?.fullName || "Student"}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {user?.email || "student@studed.lk"}
                        </p>
                      </div>

                      {/* Navigation Links */}
                      <div className="py-1 space-y-0.5">
                        <Link
                          to="/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                        >
                          <LayoutDashboard className="size-3.5 text-primary" />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          to="/courses"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                        >
                          <BookOpen className="size-3.5 text-amber-500" />
                          <span>My Courses</span>
                        </Link>
                        <Link
                          to="/achievements"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                        >
                          <Award className="size-3.5 text-rose-500" />
                          <span>Achievements</span>
                        </Link>
                        <Link
                          to="/subscription"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                        >
                          <Crown className="size-3.5 text-amber-400" />
                          <span>Subscription &amp; Keys</span>
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                        >
                          <Settings className="size-3.5 text-neutral-400" />
                          <span>Settings &amp; Profile</span>
                        </Link>

                        {(user?.role === "EDUCATOR" ||
                          user?.role === "HEAD_EDUCATOR" ||
                          user?.role === "ADMIN") && (
                          <Link
                            to="/educator"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                          >
                            <GraduationCap className="size-3.5 text-emerald-500" />
                            <span>Educator Portal</span>
                          </Link>
                        )}
                      </div>

                      {/* Theme Toggle in Dropdown */}
                      <div className="border-t border-border/50 pt-1 pb-1">
                        <button
                          type="button"
                          onClick={() => {
                            toggleTheme();
                          }}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                        >
                          <span className="flex items-center gap-2.5">
                            {theme === "dark" ? (
                              <Sun className="size-3.5 text-amber-400" />
                            ) : (
                              <Moon className="size-3.5 text-muted-foreground" />
                            )}
                            <span>Appearance</span>
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">
                            {theme}
                          </span>
                        </button>
                      </div>

                      {/* Log Out */}
                      <div className="border-t border-border/50 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            logout();
                            window.location.assign("/");
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
                        >
                          <LogOut className="size-3.5" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
