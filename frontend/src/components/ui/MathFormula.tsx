import katex from "katex";
import "katex/dist/katex.min.css";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface MathProps {
  formula: string;
  displayMode?: boolean;
  className?: string;
}

/**
 * Renders a LaTeX formula with KaTeX. Falls back to the raw string (styled
 * as inline code) if the formula fails to parse — students should never see
 * a blank block just because an author mistyped a command.
 */
export function MathFormula({ formula, displayMode = true, className }: MathProps) {
  const html = useMemo(() => {
    if (!formula?.trim()) return null;
    try {
      return katex.renderToString(formula, {
        displayMode,
        throwOnError: false,
        strict: "ignore",
        output: "htmlAndMathml",
      });
    } catch {
      return null;
    }
  }, [formula, displayMode]);

  if (!html) {
    return (
      <code className={cn("font-mono text-sm text-muted-foreground", className)}>
        {formula || "No formula provided"}
      </code>
    );
  }

  return (
    <div
      aria-label={formula}
      role="img"
      className={cn("katex-block", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
