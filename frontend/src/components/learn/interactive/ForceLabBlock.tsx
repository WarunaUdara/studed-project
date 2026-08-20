import { useState } from "react";
import type { ForceLabConfig } from "@/lib/content/interactiveBlocks";
import { parseBlockConfig } from "@/lib/content/interactiveBlocks";
import { playClickSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { ForceArrowsScene } from "./ForceArrowsScene";

interface ForceLabBlockProps {
  content: string;
  metadata?: string | object | null;
}

const DEFAULT_SURFACES: NonNullable<ForceLabConfig["surfaces"]> = [
  { id: "ice", label: "Slippery ice", friction: 0.1 },
  { id: "floor", label: "Smooth floor", friction: 0.4 },
  { id: "carpet", label: "Fluffy carpet", friction: 0.85 },
];

/**
 * The push-pull toy. A child moves one slider and switches the surface, and the
 * arrows plus the cart's speed answer the question the lesson asks: a bigger
 * push means more force, and a rougher surface eats that force up.
 */
export function ForceLabBlock({ content, metadata }: ForceLabBlockProps) {
  const config = parseBlockConfig<ForceLabConfig>(metadata);
  const surfaces = config?.surfaces?.length ? config.surfaces : DEFAULT_SURFACES;
  const minForce = config?.minForce ?? 0;
  const maxForce = config?.maxForce ?? 10;

  const [push, setPush] = useState(Math.round((minForce + maxForce) / 2));
  const [surfaceId, setSurfaceId] = useState(surfaces[0].id);

  const surface = surfaces.find((s) => s.id === surfaceId) ?? surfaces[0];

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      {content && <p className="text-sm font-medium text-foreground">{content}</p>}

      <ForceArrowsScene push={push} friction={surface.friction} label={config?.label} />

      <div className="space-y-2">
        <label htmlFor="force-lab-push" className="text-sm font-semibold text-foreground">
          How hard do you push?
        </label>
        <input
          id="force-lab-push"
          type="range"
          min={minForce}
          max={maxForce}
          step={1}
          value={push}
          onChange={(event) => setPush(Number(event.target.value))}
          onPointerUp={() => playClickSound()}
          className="h-11 w-full cursor-pointer accent-primary touch-manipulation"
        />
        <p className="text-sm text-muted-foreground">
          {push === 0
            ? "No push at all, so nothing moves."
            : `A push of ${push} newtons on ${surface.label.toLowerCase()}.`}
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-foreground">What is under the wheels?</legend>
        <div className="flex flex-wrap gap-2">
          {surfaces.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setSurfaceId(option.id);
                playClickSound();
              }}
              aria-pressed={option.id === surface.id}
              className={cn(
                "min-h-11 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                option.id === surface.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      {config?.caption && <p className="text-sm text-muted-foreground">{config.caption}</p>}
    </section>
  );
}
