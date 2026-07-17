import { Link } from "@tanstack/react-router";
import { Moon, Sun, Zap } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { XPBar } from "@/components/gamification/XPBar";
import { Button } from "@/components/ui/button";
import { PointsBadge } from "@/components/ui/points-badge";
import { useAuthStore } from "@/stores/auth";
import { useUiPrefs } from "@/stores/uiPrefs";

export function Navbar() {
  const { user, isAuthenticated } = useAuthStore();
  const isStudent = isAuthenticated && user?.role === "STUDENT";
  const theme = useUiPrefs((s) => s.theme);
  const toggleTheme = useUiPrefs((s) => s.toggleTheme);

  return (
    <header className="sticky top-0 z-40 glass border-x-0 border-t-0 border-b border-border/40">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="text-2xl font-serif font-normal tracking-tight hover:text-primary">
          Stud<span className="text-primary italic">Ed</span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
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
            <div className="hidden items-center gap-3 sm:flex">
              <PointsBadge name="XP" total={user.totalXp} size="sm" icon={Zap} />
              <div className="hidden min-w-[140px] md:block">
                <XPBar totalXp={user.totalXp} compact />
              </div>
            </div>
          )}

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
              <span className="hidden text-sm text-muted-foreground md:inline">
                {user?.fullName}
              </span>
              <LogoutButton size="sm" />
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
