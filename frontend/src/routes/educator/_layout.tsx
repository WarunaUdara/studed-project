import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EducatorShell } from "@/components/layout/EducatorShell";

export const Route = createFileRoute("/educator/_layout")({
  component: EducatorLayout,
});

function EducatorLayout() {
  return (
    <ProtectedRoute allowedRoles={["EDUCATOR", "HEAD_EDUCATOR", "ADMIN"]}>
      <EducatorShell>
        <Outlet />
      </EducatorShell>
    </ProtectedRoute>
  );
}
