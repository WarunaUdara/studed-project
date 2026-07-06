import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/educator/_layout")({
  component: EducatorLayout,
});

function EducatorLayout() {
  return (
    <ProtectedRoute allowedRoles={["EDUCATOR", "HEAD_EDUCATOR", "ADMIN"]}>
      <main className="mx-auto max-w-6xl p-4 sm:p-6">
        <Outlet />
      </main>
    </ProtectedRoute>
  );
}
