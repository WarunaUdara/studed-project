import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle, Info, X, XCircle } from "lucide-react";
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

interface ToastContextValue {
  toast: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const TOAST_STYLES: Record<
  ToastType,
  { icon: typeof Info; ring: string; bg: string; iconColor: string }
> = {
  success: {
    icon: CheckCircle,
    ring: "ring-success/30",
    bg: "bg-success/10",
    iconColor: "text-success",
  },
  error: {
    icon: XCircle,
    ring: "ring-destructive/30",
    bg: "bg-destructive/10",
    iconColor: "text-destructive",
  },
  warning: {
    icon: AlertCircle,
    ring: "ring-orange/30",
    bg: "bg-orange/10",
    iconColor: "text-orange",
  },
  info: { icon: Info, ring: "ring-primary/30", bg: "bg-primary/10", iconColor: "text-primary" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const newToast: Toast = { id, duration: 5000, ...t };
      setToasts((prev) => [...prev, newToast]);
      if (t.duration !== 0) {
        setTimeout(() => dismiss(id), t.duration ?? 5000);
      }
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => {
            const style = TOAST_STYLES[t.type];
            const Icon = style.icon;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 40, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={cn(
                  "pointer-events-auto flex items-start gap-3 rounded-xl border bg-card/95 p-4 shadow-lg ring-1 backdrop-blur",
                  style.ring,
                )}
                role="alert"
              >
                <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", style.iconColor)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{t.title}</p>
                  {t.message && <p className="mt-0.5 text-sm text-muted-foreground">{t.message}</p>}
                  {t.action && (
                    <button
                      onClick={() => {
                        t.action?.onClick();
                        dismiss(t.id);
                      }}
                      type="button"
                      className="mt-2 text-sm font-medium text-primary hover:underline"
                    >
                      {t.action.label}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  type="button"
                  className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
