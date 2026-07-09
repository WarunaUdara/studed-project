import { Outlet } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { ToastProvider } from "@/components/ui/Toast";

export function App() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Ambient gradient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[400px] w-[400px] rounded-full bg-purple/10 blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 h-[300px] w-[300px] rounded-full bg-gold/5 blur-[80px]" />
      </div>
      <ToastProvider>
        <Navbar />
        <main>
          <Outlet />
        </main>
        <Footer />
      </ToastProvider>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t bg-card/50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Stud<span className="font-bold text-primary">Ed</span> — Premium learning for Sri Lankan
            schools
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span>Grade 1–11 · O/L · A/L</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
