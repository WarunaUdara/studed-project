import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { XPBar } from "@/components/gamification/XPBar";
import { Button } from "@/components/ui/button";
import { PointsBadge } from "@/components/ui/points-badge";
import { useAuthStore } from "@/stores/auth";

export function Navbar() {
  const { user, isAuthenticated } = useAuthStore();
  const isStudent = isAuthenticated && user?.role === "STUDENT";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="text-xl font-bold tracking-tight hover:text-primary">
          Stud<span className="text-primary">Ed</span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          <Link to="/courses">
            <Button variant="ghost" size="sm">
              Courses
            </Button>
          </Link>

          {isAuthenticated && user?.role === "STUDENT" && (
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
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
