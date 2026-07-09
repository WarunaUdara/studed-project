import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiPrefs } from "@/stores/uiPrefs";

export interface LanguageToggleProps {
  className?: string;
  /** Render a glassmorphism variant suitable for the split-screen brand panels. */
  variant?: "default" | "glass";
  /** Optional accessible label override. */
  label?: string;
}

/**
 * LanguageToggle — globe icon + EN/සි pill that flips the public-page locale.
 * Renders in both the default (text masked) and glass (white-on-blur) variants.
 */
export function LanguageToggle({
  className,
  variant = "default",
  label = "Toggle language",
}: LanguageToggleProps) {
  const language = useUiPrefs((s) => s.language);
  const toggleLanguage = useUiPrefs((s) => s.toggleLanguage);
  const isSinhala = language === "SI";

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={label}
      aria-pressed={isSinhala}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
        variant === "default"
          ? "border border-border bg-card text-foreground hover:bg-accent"
          : "border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20",
        className,
      )}
    >
      <Globe className="h-3.5 w-3.5" aria-hidden />
      <span aria-hidden>{isSinhala ? "සිං" : "EN"}</span>
      <span className="sr-only">{isSinhala ? "English වෙත මාරු කරන්න" : "Switch to Sinhala"}</span>
    </button>
  );
}
