import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/educator/_layout/courses/$courseId")({
  component: () => <Outlet />,
});
