import { useState } from "react";
import type { OhmsLawLabConfig } from "@/lib/content/interactiveBlocks";
import { parseBlockConfig } from "@/lib/content/interactiveBlocks";
import { playClickSound } from "@/lib/sounds";
import { ammeterReading, OhmsLawScene } from "./OhmsLawScene";

interface OhmsLawLabBlockProps {
  content: string;
  metadata?: string | object | null;
}

/**
 * The Ohm's law bench. A student sets the supply and the resistor; the current
 * is never set directly, because it is the consequence, not the input. That is
 * the misconception this block exists to break.
 */
export function OhmsLawLabBlock({ content, metadata }: OhmsLawLabBlockProps) {
  const config = parseBlockConfig<OhmsLawLabConfig>(metadata);
  const maxVoltage = config?.maxVoltage ?? 12;
  const maxResistance = config?.maxResistance ?? 12;

  const [voltage, setVoltage] = useState(config?.voltage ?? 6);
  const [resistance, setResistance] = useState(config?.resistance ?? 3);

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      {content && <p className="text-sm font-medium text-foreground">{content}</p>}

      <OhmsLawScene voltage={voltage} resistance={resistance} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="ohms-voltage" className="text-sm font-semibold text-foreground">
            Supply voltage: {voltage} V
          </label>
          <input
            id="ohms-voltage"
            type="range"
            min={0}
            max={maxVoltage}
            step={1}
            value={voltage}
            onChange={(event) => setVoltage(Number(event.target.value))}
            onPointerUp={() => playClickSound()}
            className="h-11 w-full cursor-pointer accent-primary touch-manipulation"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="ohms-resistance" className="text-sm font-semibold text-foreground">
            Resistance: {resistance} ohm
          </label>
          <input
            id="ohms-resistance"
            type="range"
            min={1}
            max={maxResistance}
            step={1}
            value={resistance}
            onChange={(event) => setResistance(Number(event.target.value))}
            onPointerUp={() => playClickSound()}
            className="h-11 w-full cursor-pointer accent-warning touch-manipulation"
          />
        </div>
      </div>

      <p aria-live="polite" className="rounded-xl border bg-muted/40 p-3 text-sm text-foreground">
        {voltage} V across {resistance} ohm gives {ammeterReading(voltage, resistance)}. You never
        set the current; it is whatever the supply and the resistance leave you with.
      </p>

      {config?.caption && <p className="text-sm text-muted-foreground">{config.caption}</p>}
    </section>
  );
}
