import { useState } from "react";
import type { WaterFlowConfig } from "@/lib/content/interactiveBlocks";
import { parseBlockConfig } from "@/lib/content/interactiveBlocks";
import { playClickSound } from "@/lib/sounds";
import { WaterFlowScene } from "./WaterFlowScene";

interface WaterFlowBlockProps {
  content: string;
  metadata?: string | object | null;
}

/**
 * Current and voltage explained as water. The child drives the pump and the
 * pipe width, and the drops answer back, so "voltage pushes, resistance holds
 * back, current is what actually flows" arrives before any formula does.
 */
export function WaterFlowBlock({ content, metadata }: WaterFlowBlockProps) {
  const config = parseBlockConfig<WaterFlowConfig>(metadata);
  const [voltage, setVoltage] = useState(6);
  const [resistance, setResistance] = useState(3);

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      {content && <p className="text-sm font-medium text-foreground">{content}</p>}

      <WaterFlowScene voltage={voltage} resistance={resistance} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="water-flow-voltage" className="text-sm font-semibold text-foreground">
            {config?.voltageLabel ?? "Pump pressure (voltage)"}
          </label>
          <input
            id="water-flow-voltage"
            type="range"
            min={0}
            max={10}
            step={1}
            value={voltage}
            onChange={(event) => setVoltage(Number(event.target.value))}
            onPointerUp={() => playClickSound()}
            className="h-11 w-full cursor-pointer accent-info touch-manipulation"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="water-flow-resistance" className="text-sm font-semibold text-foreground">
            {config?.resistanceLabel ?? "Pipe narrowness (resistance)"}
          </label>
          <input
            id="water-flow-resistance"
            type="range"
            min={0}
            max={9}
            step={1}
            value={resistance}
            onChange={(event) => setResistance(Number(event.target.value))}
            onPointerUp={() => playClickSound()}
            className="h-11 w-full cursor-pointer accent-info touch-manipulation"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {config?.caption ??
          "The moving water is the current. Push harder and more water flows; squeeze the pipe and less gets through."}
      </p>
    </section>
  );
}
