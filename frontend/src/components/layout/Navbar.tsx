import { Link } from "@tanstack/react-router";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/auth";

export function Navbar() {
  const { user, isAuthenticated } = useAuthStore();

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="text-xl font-bold tracking-tight hover:text-primary">
          StudEd
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
              <span className="hidden text-sm text-muted-foreground sm:inline">
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
