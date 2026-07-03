import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/educator/_layout")({
  component: EducatorLayout,
});

function EducatorLayout() {
  return (
    <ProtectedRoute allowedRoles={["EDUCATOR", "HEAD_EDUCATOR", "ADMIN"]}>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <Link to="/educator/courses" className="text-lg font-semibold hover:text-primary">
              Educator Portal
            </Link>
            <LogoutButton />
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-6">
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
}
