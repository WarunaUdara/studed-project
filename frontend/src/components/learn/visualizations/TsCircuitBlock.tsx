import { Cpu, Layers, Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface TsCircuitBlockProps {
  content: string;
  metadata?: string | null;
}

interface TsCircuitMetadata {
  title?: string;
  components?: string[];
  voltage?: string;
  current?: string;
  notes?: string;
}

export function TsCircuitBlock({ content, metadata }: TsCircuitBlockProps) {
  const [mode, setMode] = useState<"schematic" | "pcb" | "netlist">("schematic");

  let meta: TsCircuitMetadata = {};
  try {
    if (metadata) {
      meta = JSON.parse(metadata);
    }
  } catch {
    // Fallback if metadata is non-JSON
  }

  const title = meta.title ?? "Non-inverting Operational Amplifier Circuit";
  const componentsList = meta.components ?? [
    "Op-Amp (TL072)",
    "R1 (10kΩ)",
    "R2 (47kΩ)",
    "C1 (100nF)",
  ];

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            <p className="text-[11px] text-muted-foreground">tscircuit Code-to-Schematic Engine</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
          Schematic
        </span>
      </div>

      <div className="relative overflow-hidden rounded-xl border bg-slate-900 p-6 min-h-[220px] flex flex-col items-center justify-center text-center">
        {mode === "schematic" && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-6 text-blue-400 font-mono text-xs">
              <span className="border border-blue-500/30 rounded px-2 py-1 bg-blue-950/50">
                V_in (+5V)
              </span>
              <span>───[ R1 10k ]───</span>
              <span className="border border-blue-500/50 rounded p-2 bg-blue-950 text-white font-bold">
                ▲ OpAmp
              </span>
              <span>───[ R2 47k ]───</span>
              <span className="border border-emerald-500/30 rounded px-2 py-1 bg-emerald-950/50 text-emerald-400">
                V_out (+28.5V)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Gain: A_v = 1 + (R2 / R1) = 5.7</p>
          </div>
        )}

        {mode === "pcb" && (
          <div className="space-y-2">
            <div className="inline-block p-4 border-2 border-emerald-500/60 rounded-lg bg-emerald-950/40 text-emerald-300 font-mono text-xs">
              [ 2-Layer Board Layout: 50mm x 30mm ]
              <br />
              Top Copper: Signal trace | Bottom: GND Plane
            </div>
          </div>
        )}

        {mode === "netlist" && (
          <pre className="text-left font-mono text-xs text-slate-300 bg-slate-950 p-3 rounded-lg overflow-x-auto w-full max-h-40">
            {content ||
              `circuit.add(<resistor name="R1" resistance="10k" />)\ncircuit.add(<resistor name="R2" resistance="47k" />)\ncircuit.add(<opamp name="U1" model="TL072" />)`}
          </pre>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5">
          {(["schematic", "pcb", "netlist"] as const).map((m) => (
            <Button
              key={m}
              size="sm"
              variant={mode === m ? "default" : "outline"}
              className="text-xs px-2.5 py-1 h-7 capitalize"
              onClick={() => setMode(m)}
            >
              {m === "pcb" ? "PCB Layout" : m}
            </Button>
          ))}
        </div>

        {meta.voltage && (
          <span className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-amber-500" /> {meta.voltage}
          </span>
        )}
      </div>

      {componentsList.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground border">
          <Layers className="h-3.5 w-3.5 text-blue-600 shrink-0 mr-1" />
          <span className="font-semibold text-foreground mr-1">Bill of Materials:</span>
          {componentsList.map((comp) => (
            <span key={comp} className="rounded bg-background px-1.5 py-0.5 border text-[11px]">
              {comp}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
