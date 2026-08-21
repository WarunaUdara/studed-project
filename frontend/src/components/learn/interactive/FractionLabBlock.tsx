import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import type { FractionLabConfig } from "@/lib/content/interactiveBlocks";
import { parseBlockConfig } from "@/lib/content/interactiveBlocks";
import { playClickSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { FractionBarScene } from "./FractionBarScene";

interface FractionLabBlockProps {
  content: string;
  metadata?: string | object | null;
}

const STEPPER_CLASS = cn(
  "flex h-11 w-11 items-center justify-center rounded-xl border transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40",
);

/**
 * Cut the bar, shade the parts. A child changes the bottom number and watches
 * the pieces get smaller, which is the fact that trips most learners up when
 * they meet fractions as symbols first.
 */
export function FractionLabBlock({ content, metadata }: FractionLabBlockProps) {
  const config = parseBlockConfig<FractionLabConfig>(metadata);
  const maxParts = config?.maxParts ?? 12;

  const [parts, setParts] = useState(config?.parts ?? 4);
  const [shaded, setShaded] = useState(config?.shaded ?? 1);

  const setPartCount = (next: number) => {
    playClickSound();
    const clamped = Math.min(maxParts, Math.max(1, next));
    setParts(clamped);
    setShaded((prev) => Math.min(prev, clamped));
  };

  const setShadedCount = (next: number) => {
    playClickSound();
    setShaded(Math.min(parts, Math.max(0, next)));
  };

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      {content && <p className="text-sm font-medium text-foreground">{content}</p>}

      <FractionBarScene parts={parts} shaded={shaded} label={config?.label} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Cut the bar into</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPartCount(parts - 1)}
              disabled={parts <= 1}
              aria-label="Fewer parts"
              className={STEPPER_CLASS}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-16 text-center text-base font-semibold text-foreground">
              {parts} parts
            </span>
            <button
              type="button"
              onClick={() => setPartCount(parts + 1)}
              disabled={parts >= maxParts}
              aria-label="More parts"
              className={STEPPER_CLASS}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Shade</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShadedCount(shaded - 1)}
              disabled={shaded <= 0}
              aria-label="Shade one part fewer"
              className={STEPPER_CLASS}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-16 text-center text-base font-semibold text-foreground">
              {shaded} shaded
            </span>
            <button
              type="button"
              onClick={() => setShadedCount(shaded + 1)}
              disabled={shaded >= parts}
              aria-label="Shade one part more"
              className={STEPPER_CLASS}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {config?.caption && <p className="text-sm text-muted-foreground">{config.caption}</p>}
    </section>
  );
}
