import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface StudentShellProps {
  children: ReactNode;
  /** Optional banner (e.g. subscription paywall) rendered above the content. */
  banner?: ReactNode;
  className?: string;
}

/**
 * StudentShell — the clean, spacious per-page student layout container.
 * Navigation is unified globally in the top CardNav header.
 */
export function StudentShell({ children, banner, className }: StudentShellProps) {
  return (
    <div className={cn("mx-auto max-w-7xl px-4 py-6 sm:px-6 min-h-[calc(100vh-64px)]", className)}>
      {banner}
      {children}
    </div>
  );
}

/** Helper to render a subscription paywall banner slot. */
export function PaywallBanner({
  title,
  message,
  ctaTo = "/subscription",
}: {
  title: string;
  message: string;
  ctaTo?: string;
}) {
  return (
    <div
      role="region"
      aria-label="Subscription upgrade required"
      className="mb-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 sm:flex-row sm:items-center sm:p-5"
    >
      <div>
        <h3 className="text-sm font-bold text-amber-700 dark:text-amber-300 sm:text-base">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground sm:text-sm">{message}</p>
      </div>
      <a
        href={ctaTo}
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-600 transition-colors"
      >
        Upgrade to Pro
      </a>
    </div>
  );
}
