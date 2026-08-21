import { useEffect, useState } from "react";
import type { CircuitLabConfig } from "@/lib/content/interactiveBlocks";
import { parseBlockConfig } from "@/lib/content/interactiveBlocks";
import { playClickSound, playSuccessSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { ShortCircuitScene } from "./ShortCircuitScene";

interface CircuitLabBlockProps {
  content: string;
  metadata?: string | object | null;
}

type Placements = Record<string, string>;

const DEFAULT_CONFIG: CircuitLabConfig = {
  version: 1,
  slots: [
    { id: "slot-top", label: "Top gap", accepts: "wire" },
    { id: "slot-power", label: "Bottom gap", accepts: "battery" },
    { id: "slot-bypass", label: "Shortcut gap", accepts: "wire" },
  ],
  components: [
    { id: "cell", label: "Battery", kind: "battery" },
    { id: "wire", label: "Wire", kind: "wire" },
  ],
  solution: { "slot-top": "wire", "slot-power": "cell" },
  shortCircuit: { "slot-top": "wire", "slot-power": "cell", "slot-bypass": "wire" },
};

const VIEW_WIDTH = 360;
const VIEW_HEIGHT = 220;

/** Slot hit areas, in SVG user units, matched to the gaps drawn in the circuit. */
const SLOT_GEOMETRY = [
  { x: 140, y: 30, width: 80, height: 40 },
  { x: 120, y: 150, width: 80, height: 40 },
  { x: 232, y: 88, width: 56, height: 44 },
];

/**
 * A placement satisfies a target only when it matches it exactly: every listed
 * slot filled as listed, and nothing extra. Exactness is what separates the
 * working circuit from the short circuit, which is the same wiring plus one
 * shortcut wire.
 */
export function matchesPlacement(target: Placements, placements: Placements): boolean {
  const filled = Object.entries(placements).filter(([, componentId]) => Boolean(componentId));
  const targetEntries = Object.entries(target);
  if (filled.length !== targetEntries.length) return false;
  return targetEntries.every(([slotId, componentId]) => placements[slotId] === componentId);
}

export function CircuitLabBlock({ content, metadata }: CircuitLabBlockProps) {
  const config = parseBlockConfig<CircuitLabConfig>(metadata) ?? DEFAULT_CONFIG;
  const slots = config.slots?.length ? config.slots : DEFAULT_CONFIG.slots;
  const components = config.components?.length ? config.components : DEFAULT_CONFIG.components;

  const [placements, setPlacements] = useState<Placements>({});
  const [selected, setSelected] = useState<string | null>(components[0]?.id ?? null);

  const isShort =
    Boolean(config.shortCircuit) && matchesPlacement(config.shortCircuit ?? {}, placements);
  const isLit = !isShort && matchesPlacement(config.solution ?? {}, placements);

  useEffect(() => {
    if (isLit) playSuccessSound();
  }, [isLit]);

  const handleSlotTap = (slotId: string) => {
    playClickSound();
    setPlacements((prev) => {
      if (prev[slotId]) {
        const { [slotId]: _removed, ...rest } = prev;
        return rest;
      }
      if (!selected) return prev;
      return { ...prev, [slotId]: selected };
    });
  };

  const labelFor = (componentId: string | undefined) =>
    components.find((c) => c.id === componentId)?.label ?? "";

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      {content && <p className="text-sm font-medium text-foreground">{content}</p>}

      <div className="relative">
        <svg viewBox="0 0 360 220" className="w-full" aria-hidden="true">
          <title>Circuit board with gaps to fill</title>

          {/* Loop: top edge, right edge around the bulb, bottom edge, left edge. */}
          <path
            d="M60 50 H140"
            className="fill-none stroke-border"
            strokeWidth={4}
            strokeLinecap="round"
          />
          <path
            d="M220 50 H300"
            className="fill-none stroke-border"
            strokeWidth={4}
            strokeLinecap="round"
          />
          <path
            d="M300 50 V90"
            className="fill-none stroke-border"
            strokeWidth={4}
            strokeLinecap="round"
          />
          <path
            d="M300 130 V170"
            className="fill-none stroke-border"
            strokeWidth={4}
            strokeLinecap="round"
          />
          <path
            d="M300 170 H200"
            className="fill-none stroke-border"
            strokeWidth={4}
            strokeLinecap="round"
          />
          <path
            d="M120 170 H60"
            className="fill-none stroke-border"
            strokeWidth={4}
            strokeLinecap="round"
          />
          <path
            d="M60 170 V50"
            className="fill-none stroke-border"
            strokeWidth={4}
            strokeLinecap="round"
          />

          {/* Shortcut branch: a second path around the bulb, broken by the bypass gap. */}
          <path
            d="M260 50 V88"
            className="fill-none stroke-border/60"
            strokeWidth={3}
            strokeDasharray="6 6"
          />
          <path
            d="M260 132 V170"
            className="fill-none stroke-border/60"
            strokeWidth={3}
            strokeDasharray="6 6"
          />

          {/* Bulb fixture. */}
          {isLit && <circle cx={300} cy={110} r={30} className="fill-warning/15" />}
          <circle
            cx={300}
            cy={110}
            r={20}
            strokeWidth={2.5}
            className={cn(
              isLit ? "fill-warning/40 stroke-warning" : "fill-muted stroke-muted-foreground",
            )}
          />
        </svg>

        {/*
          Slots are real buttons positioned over the diagram in the same
          proportional coordinates as the SVG gaps, so they are focusable,
          keyboard operable, and announced without ARIA patched onto SVG nodes.
        */}
        {slots.map((slot, index) => {
          const geometry = SLOT_GEOMETRY[index] ?? SLOT_GEOMETRY[SLOT_GEOMETRY.length - 1];
          const placed = placements[slot.id];
          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => handleSlotTap(slot.id)}
              aria-pressed={Boolean(placed)}
              aria-label={
                placed
                  ? `${slot.label}: ${labelFor(placed)} placed. Activate to take it out.`
                  : `${slot.label}: empty. Activate to place the selected part.`
              }
              style={{
                left: `${(geometry.x / VIEW_WIDTH) * 100}%`,
                top: `${(geometry.y / VIEW_HEIGHT) * 100}%`,
                width: `${(geometry.width / VIEW_WIDTH) * 100}%`,
                height: `${(geometry.height / VIEW_HEIGHT) * 100}%`,
              }}
              className={cn(
                "absolute flex items-center justify-center rounded-xl border-2 text-sm font-semibold",
                "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                placed
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-dashed border-muted-foreground bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {placed ? labelFor(placed) : "Empty"}
            </button>
          );
        })}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-foreground">
          Pick a part, then tap a gap
        </legend>
        <div className="flex flex-wrap gap-2">
          {components.map((component) => (
            <button
              key={component.id}
              type="button"
              onClick={() => {
                setSelected(component.id);
                playClickSound();
              }}
              aria-pressed={selected === component.id}
              className={cn(
                "min-h-11 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected === component.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {component.label}
            </button>
          ))}
        </div>
      </fieldset>

      <p
        aria-live="polite"
        className={cn(
          "rounded-xl border p-3 text-sm font-medium",
          isLit && "border-success/40 bg-success/10 text-success",
          isShort && "border-destructive/40 bg-destructive/10 text-destructive",
          !isLit && !isShort && "border-border bg-muted/40 text-muted-foreground",
        )}
      >
        {isLit
          ? "The bulb is glowing. The current has one full loop to travel around."
          : isShort
            ? "Short circuit. The current took the shortcut wire and skipped the bulb."
            : "The loop is still broken, so no current can flow yet."}
      </p>

      {isShort && <ShortCircuitScene />}

      {config.caption && <p className="text-sm text-muted-foreground">{config.caption}</p>}
    </section>
  );
}
