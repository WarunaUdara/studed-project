import { Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { PomodoroInitializer } from "@/components/gamification/PomodoroInitializer";
import { Navbar } from "@/components/layout/Navbar";
import { ThemePullCord } from "@/components/layout/ThemePullCord";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
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
    <div className="relative min-h-[100dvh] bg-background text-foreground">
      <ToastProvider>
        {/* biome-ignore lint/a11y/useValidAnchor: this skip link targets the page's main landmark */}
        <a
          href="#main-content"
          onClick={() => document.getElementById("main-content")?.focus()}
          className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Skip to main content
        </a>
        <ThemePullCord />
        <OfflineBanner />
        {!hideChrome && <Navbar />}
        <main id="main-content" tabIndex={-1} className="focus:outline-none">
          <Outlet />
        </main>
        <PomodoroInitializer />
      </ToastProvider>
    </div>
  );
}
