import { Outlet, useRouterState } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { ToastProvider } from "@/components/ui/Toast";

/** Routes that own their full-screen layout (no global Navbar / Footer). */
const SPLIT_SCREEN_ROUTES = new Set(["/login", "/register"]);

function isSplitScreen(pathname: string): boolean {
  return SPLIT_SCREEN_ROUTES.has(pathname);
}

export function App() {
  const pathname = useRouterState().location.pathname;
  const hideChrome = isSplitScreen(pathname);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Ambient gradient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[400px] w-[400px] rounded-full bg-purple/10 blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 h-[300px] w-[300px] rounded-full bg-gold/5 blur-[80px]" />
      </div>
      <ToastProvider>
        {!hideChrome && <Navbar />}
        <main>
          <Outlet />
        </main>
      </ToastProvider>
    </div>
  );
}
