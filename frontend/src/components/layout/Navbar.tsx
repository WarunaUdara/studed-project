import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Moon, Sun, X, Zap } from "lucide-react";
import { useState } from "react";
import { LoginModal } from "@/components/auth/LoginModal";
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
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const pathname = useRouterState().location.pathname;
  const isHome = pathname === "/";

  return (
    <header
      className={cn(
        "z-40 transition-all border-b border-border/20 dark:border-border/10",
        isHome
          ? "absolute top-0 left-0 right-0 bg-transparent border-none shadow-none"
          : "sticky top-0 glass",
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
          <Button asChild variant="ghost" size="sm">
            <Link to="/courses">Courses</Link>
          </Button>

          {isAuthenticated && user?.role === "STUDENT" && (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/leaderboard">Leaderboard</Link>
              </Button>
            </>
          )}

          {isAuthenticated &&
            (user?.role === "EDUCATOR" ||
              user?.role === "HEAD_EDUCATOR" ||
              user?.role === "ADMIN") && (
              <Button asChild variant="ghost" size="sm">
                <Link to="/educator">Educator Portal</Link>
              </Button>
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
              <Button variant="ghost" size="sm" onClick={() => setLoginModalOpen(true)}>
                Log in
              </Button>
              <Button asChild size="sm">
                <Link to="/register">Sign up</Link>
              </Button>
              <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
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

        {/* Mobile Navigation Controls */}
        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="rounded-full"
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
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            className="rounded-full"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border/80 bg-background/95 backdrop-blur-md px-4 py-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-2">
            <Link
              to="/courses"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
            >
              Courses
            </Link>

            {isAuthenticated && user?.role === "STUDENT" && (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/leaderboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
                >
                  Leaderboard
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
                  className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
                >
                  Educator Portal
                </Link>
              )}

            <div className="my-1 border-t border-border/60" />

            {!isAuthenticated ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button asChild variant="outline" className="w-full justify-center">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
                </Button>
                <Button asChild className="w-full justify-center">
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>Sign up</Link>
                </Button>
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
