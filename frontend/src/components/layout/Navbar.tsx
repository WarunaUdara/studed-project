import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Moon, Sun, X, Zap } from "lucide-react";
import { useState } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { XPBar } from "@/components/gamification/XPBar";
import { Button } from "@/components/ui/button";
import { PointsBadge } from "@/components/ui/points-badge";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { useUiPrefs } from "@/stores/uiPrefs";

export function Navbar() {
  const { user, isAuthenticated } = useAuthStore();
  const isStudent = isAuthenticated && user?.role === "STUDENT";
  const theme = useUiPrefs((s) => s.theme);
  const toggleTheme = useUiPrefs((s) => s.toggleTheme);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pathname = useRouterState().location.pathname;
  const isHome = pathname === "/";

  return (
    <header
      className={cn(
        "z-40 transition-all",
        isHome
          ? "absolute top-0 left-0 right-0 bg-transparent border-none shadow-none"
          : "sticky top-0 glass border-x-0 border-t-0 border-b border-border/40",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link
          to="/"
          className="text-2xl font-serif font-normal tracking-tight hover:text-primary shrink-0"
          onClick={() => setMobileMenuOpen(false)}
        >
          Stud<span className="text-primary italic">Ed</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-4">
          <Link to="/courses">
            <Button variant="ghost" size="sm">
              Courses
            </Button>
          </Link>

          {isAuthenticated && user?.role === "STUDENT" && (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Link to="/leaderboard">
                <Button variant="ghost" size="sm">
                  Leaderboard
                </Button>
              </Link>
            </>
          )}

          {isAuthenticated &&
            (user?.role === "EDUCATOR" ||
              user?.role === "HEAD_EDUCATOR" ||
              user?.role === "ADMIN") && (
              <Link to="/educator">
                <Button variant="ghost" size="sm">
                  Educator Portal
                </Button>
              </Link>
            )}

          {isStudent && user && (
            <div className="flex items-center gap-3">
              <PointsBadge name="XP" total={user.totalXp} size="sm" icon={Zap} />
              <div className="hidden lg:block min-w-[140px]">
                <XPBar totalXp={user.totalXp} compact />
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="rounded-full shrink-0"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-warning" />
            ) : (
              <Moon className="h-4 w-4 text-primary" />
            )}
          </Button>

          {!isAuthenticated ? (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="hidden lg:inline text-sm text-muted-foreground truncate max-w-[120px]">
                {user?.fullName}
              </span>
              <LogoutButton size="sm" />
            </div>
          )}
        </nav>

        {/* Mobile Header Quick Actions & Menu Toggle */}
        <div className="flex md:hidden items-center gap-1.5 sm:gap-2">
          {isStudent && user && <PointsBadge name="XP" total={user.totalXp} size="sm" icon={Zap} />}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="rounded-full h-9 w-9"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-warning" />
            ) : (
              <Moon className="h-4 w-4 text-primary" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            className="rounded-lg h-9 w-9"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b bg-background/98 backdrop-blur-md px-4 pt-2 pb-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-2">
            <Link
              to="/courses"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
            >
              Courses
            </Link>

            {isAuthenticated && user?.role === "STUDENT" && (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/leaderboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                >
                  Leaderboard
                </Link>
                <Link
                  to="/achievements"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                >
                  Achievements
                </Link>
                <Link
                  to="/subscription"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                >
                  Subscription
                </Link>
              </>
            )}

            {isAuthenticated &&
              (user?.role === "EDUCATOR" ||
                user?.role === "HEAD_EDUCATOR" ||
                user?.role === "ADMIN") && (
                <Link
                  to="/educator"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors text-primary"
                >
                  Educator Portal
                </Link>
              )}

            <div className="my-1 border-t border-border/60" />

            {!isAuthenticated ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center">
                    Log in
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full justify-center">Sign up</Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between px-2 pt-1">
                <span className="text-xs text-muted-foreground font-medium truncate max-w-[180px]">
                  Signed in as {user?.fullName}
                </span>
                <LogoutButton size="sm" />
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
