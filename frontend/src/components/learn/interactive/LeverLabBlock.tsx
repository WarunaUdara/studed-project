import { useState } from "react";
import type { LeverLabConfig } from "@/lib/content/interactiveBlocks";
import { parseBlockConfig } from "@/lib/content/interactiveBlocks";
import { playClickSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { LeverBalanceScene, type LeverLoad, moment } from "./LeverBalanceScene";

interface LeverLabBlockProps {
  content: string;
  metadata?: string | object | null;
}

const DEFAULT_WEIGHTS = [2, 4, 6];

/**
 * The see-saw. A student picks a weight and a notch on each side and watches
 * the beam answer. Balancing a light weight far out against a heavy weight
 * close in is the whole idea of a moment, and it lands faster from the beam
 * than from the formula.
 */
export function LeverLabBlock({ content, metadata }: LeverLabBlockProps) {
  const config = parseBlockConfig<LeverLabConfig>(metadata);
  const notches = config?.notches ?? 4;
  const weights = config?.weights?.length ? config.weights : DEFAULT_WEIGHTS;

  const [left, setLeft] = useState<LeverLoad | null>(config?.left ?? { position: -3, weight: 4 });
  const [right, setRight] = useState<LeverLoad | null>(config?.right ?? null);
  const [weight, setWeight] = useState(weights[0]);

  const place = (position: number) => {
    playClickSound();
    const load: LeverLoad = { position, weight };
    if (position < 0) {
      setLeft((prev) => (prev?.position === position && prev.weight === weight ? null : load));
      return;
    }
    setRight((prev) => (prev?.position === position && prev.weight === weight ? null : load));
  };

  const balanced = moment(left) === moment(right) && moment(left) > 0;
  const positions = Array.from({ length: notches * 2 + 1 }, (_, index) => index - notches).filter(
    (position) => position !== 0,
  );

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      {content && <p className="text-sm font-medium text-foreground">{content}</p>}

      <LeverBalanceScene left={left} right={right} notches={notches} />

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-foreground">Choose a weight</legend>
        <div className="flex flex-wrap gap-2">
          {weights.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setWeight(option);
                playClickSound();
              }}
              aria-pressed={weight === option}
              className={cn(
                "min-h-11 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                weight === option
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {option} N
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-foreground">Hang it on a notch</legend>
        <div className="flex flex-wrap gap-2">
          {positions.map((position) => {
            const occupied =
              (position < 0 && left?.position === position) ||
              (position > 0 && right?.position === position);
            return (
              <button
                key={position}
                type="button"
                onClick={() => place(position)}
                aria-label={`${Math.abs(position)} notches ${position < 0 ? "left" : "right"} of the pivot`}
                aria-pressed={occupied}
                className={cn(
                  "min-h-11 min-w-11 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  occupied
                    ? "border-warning bg-warning/15 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted",
                )}
              >
                {position < 0 ? `L${Math.abs(position)}` : `R${position}`}
              </button>
            );
          })}
        </div>
      </fieldset>

      <p
        aria-live="polite"
        className={cn(
          "rounded-xl border p-3 text-sm font-medium",
          balanced
            ? "border-success/40 bg-success/10 text-success"
            : "border-border bg-muted/40 text-muted-foreground",
        )}
      >
        {balanced
          ? "Balanced. Both sides have the same turning effect."
          : "Not balanced yet. Try a heavier weight, or the same weight further from the pivot."}
      </p>

      {config?.caption && <p className="text-sm text-muted-foreground">{config.caption}</p>}
    </section>
  );
}
