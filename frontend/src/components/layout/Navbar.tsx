import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  Brain,
  Code,
  Compass,
  Crown,
  Flame,
  GraduationCap,
  Home,
  Key,
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
import { useMutation } from "urql";
import { LogoutConfirmModal } from "@/components/auth/LogoutConfirmModal";
import { SearchAskModal } from "@/components/search/SearchAskModal";
import { BlobAvatar } from "@/components/ui/BlobAvatar";
import { Button } from "@/components/ui/button";
import { FloatingCardNav, type MegaMenuItem } from "@/components/ui/CardNav";
import { LOGOUT_MUTATION } from "@/graphql/auth";
import { levelFromXp } from "@/lib/gamification";
import { useAuthStore } from "@/stores/auth";
import { useUiPrefs } from "@/stores/uiPrefs";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const theme = useUiPrefs((s) => s.theme);
  const toggleTheme = useUiPrefs((s) => s.toggleTheme);
  const [, logoutMutation] = useMutation(LOGOUT_MUTATION);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutMutation({});
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      logout();
      setIsLoggingOut(false);
      setLogoutModalOpen(false);
      window.location.assign("/");
    }
  };

  const pathname = useRouterState().location.pathname;
  const isLandingPage = pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);

  const isEducator =
    user?.role === "EDUCATOR" || user?.role === "HEAD_EDUCATOR" || user?.role === "ADMIN";
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
                asChild
                variant="outline"
                size="sm"
                className="rounded-full border-border/80 px-5 text-sm font-semibold text-foreground hover:bg-muted"
              >
                <Link to="/login">Sign in</Link>
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

        {/* Search Modal */}
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
    },
    {
      id: "leagues",
      label: "Leagues",
      href: "/leaderboard",
      links: [
        {
          label: "Weekly League",
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
    },
  ];

  return (
    <>
      <FloatingCardNav
        activePath={pathname}
        items={NAV_ITEMS}
        logoNode={
          <Link
            to={isAuthenticated ? (isEducator ? "/educator" : "/dashboard") : "/"}
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
                  <Key className="size-3.5 text-amber-500 dark:text-amber-300" />
                </Link>

                <span className="text-border">|</span>

                {/* Streak */}
                <Link
                  to="/dashboard"
                  className="flex items-center gap-0.5 text-orange-600 dark:text-orange-300 hover:opacity-80 transition-opacity"
                  title={`${streak} Day Streak`}
                >
                  <span>{streak}</span>
                  <Zap className="size-3.5 text-orange-500 dark:text-orange-300" />
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
                  className="flex items-center justify-center rounded-full border border-primary/40 hover:scale-105 transition-transform"
                  aria-label="User profile menu"
                >
                  <BlobAvatar
                    name={user?.id ?? "guest"}
                    size={36}
                    animate="hover"
                    title={user?.fullName ?? "Your profile"}
                  />
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
                        {!isEducator && (
                          <Link
                            to="/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                          >
                            <Home className="size-3.5 text-primary" />
                            <span>Home</span>
                          </Link>
                        )}
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
                          <span>Subscription Plan</span>
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
                            setLogoutModalOpen(true);
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
              <Button asChild size="sm" className="rounded-full font-bold text-xs px-4">
                <Link to="/login">Log In</Link>
              </Button>
            )}
          </div>
        }
      />

      {/* Modals */}
      <LogoutConfirmModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleLogout}
        isSubmitting={isLoggingOut}
      />
      <SearchAskModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </>
  );
}
