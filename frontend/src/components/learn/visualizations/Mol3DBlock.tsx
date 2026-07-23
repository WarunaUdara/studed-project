import { Box, Eye, Info, RotateCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Mol3DBlockProps {
  content: string;
  metadata?: string | null;
}

interface Mol3DMetadata {
  title?: string;
  moleculeName?: string;
  formula?: string;
  pdbId?: string;
  style?: "ballAndStick" | "spacefill" | "wireframe" | "ribbon";
}

export function Mol3DBlock({ content, metadata }: Mol3DBlockProps) {
  const [style, setStyle] = useState<"ballAndStick" | "spacefill" | "wireframe" | "ribbon">(
    "ballAndStick",
  );
  const [isRotating, setIsRotating] = useState(true);

  let meta: Mol3DMetadata = {};
  try {
    if (metadata) {
      meta = JSON.parse(metadata);
    }
  } catch {
    // Fallback if metadata is non-JSON
  }

  const name = meta.moleculeName ?? meta.title ?? content ?? "Caffeine (C8H10N4O2)";
  const formula = meta.formula ?? "C8H10N4O2";

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <Box className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">{name}</h4>
            <p className="text-[11px] text-muted-foreground">3Dmol.js Molecular Visualization</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
          3D Molecular
        </span>
      </div>

      <div className="relative overflow-hidden rounded-xl border bg-slate-950 p-6 min-h-[240px] flex flex-col items-center justify-center text-center">
        {/* Interactive 3D Canvas Mock/Viewer */}
        <div
          className={`relative flex items-center justify-center w-40 h-40 transition-transform duration-700 ${isRotating ? "animate-spin [animation-duration:12s]" : ""}`}
        >
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/40" />
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-2">
              <span
                className="h-6 w-6 rounded-full bg-red-500 shadow-md animate-pulse"
                title="Oxygen"
              />
              <span
                className="h-8 w-8 rounded-full bg-slate-200 text-slate-900 font-bold text-xs flex items-center justify-center shadow-md"
                title="Carbon"
              >
                C
              </span>
              <span className="h-6 w-6 rounded-full bg-blue-500 shadow-md" title="Nitrogen" />
            </div>
            <div className="flex gap-2 mt-2">
              <span
                className="h-5 w-5 rounded-full bg-white text-slate-900 font-bold text-[10px] flex items-center justify-center border"
                title="Hydrogen"
              >
                H
              </span>
              <span
                className="h-8 w-8 rounded-full bg-slate-300 text-slate-900 font-bold text-xs flex items-center justify-center shadow-md"
                title="Carbon"
              >
                C
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <Eye className="h-3.5 w-3.5" /> Style:{" "}
          <span className="font-semibold text-white capitalize">{style}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5">
          {(["ballAndStick", "spacefill", "wireframe", "ribbon"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={style === s ? "default" : "outline"}
              className="text-xs px-2.5 py-1 h-7 capitalize"
              onClick={() => setStyle(s)}
            >
              {s.replace(/([A-Z])/g, " $1")}
            </Button>
          ))}
        </div>

        <Button
          size="sm"
          variant="outline"
          className="text-xs h-7 gap-1.5"
          onClick={() => setIsRotating(!isRotating)}
        >
          <RotateCw className="h-3.5 w-3.5" />
          {isRotating ? "Pause Rotation" : "Auto Rotate"}
        </Button>
      </div>

      {formula && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground border">
          <Info className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>
            Molecular Formula: <strong className="font-mono text-foreground">{formula}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
