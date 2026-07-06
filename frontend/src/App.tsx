import { Outlet } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";

export function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Outlet />
    </div>
  );
}
