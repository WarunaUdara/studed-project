import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  const { user, isLoading, isAuthenticated } = useAuthStore();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-4xl font-bold text-primary">StudEd</h1>
      <p className="max-w-md text-center text-muted-foreground">
        Premium e-learning for Sri Lankan schools.
      </p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : isAuthenticated && user ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{user.fullName}</span> (
            {user.role.toLowerCase()})
          </p>
          <div className="flex gap-3">
            {(user.role === "EDUCATOR" ||
              user.role === "HEAD_EDUCATOR" ||
              user.role === "ADMIN") && (
              <Link to="/educator/courses">
                <Button>Educator Portal</Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <Link to="/register">
            <Button>Register</Button>
          </Link>
          <Link to="/login">
            <Button variant="outline">Login</Button>
          </Link>
        </div>
      )}
    </main>
  );
}
