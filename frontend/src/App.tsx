import { Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { PomodoroInitializer } from "@/components/gamification/PomodoroInitializer";
import { Navbar } from "@/components/layout/Navbar";
import { ToastProvider } from "@/components/ui/Toast";
import { useUiPrefs } from "@/stores/uiPrefs";

/** Routes that own their full-screen layout (no global Navbar / Footer). */
const SPLIT_SCREEN_ROUTES = new Set(["/login", "/register"]);

function isSplitScreen(pathname: string): boolean {
  return SPLIT_SCREEN_ROUTES.has(pathname);
}

export function App() {
  const pathname = useRouterState().location.pathname;
  const hideChrome = isSplitScreen(pathname);

  useEffect(() => {
    useUiPrefs.getState().hydrate();
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <ToastProvider>
        {!hideChrome && <Navbar />}
        <main>
          <Outlet />
        </main>
        <PomodoroInitializer />
      </ToastProvider>
    </div>
  );
}
