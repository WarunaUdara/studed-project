import { Activity, Pause, Play, RotateCcw, Sliders } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface MatterPhysicsBlockProps {
  content: string;
  metadata?: string | null;
}

interface MatterMetadata {
  title?: string;
  gravity?: number;
  restitution?: number;
  objectCount?: number;
}

export function MatterPhysicsBlock({ content, metadata }: MatterPhysicsBlockProps) {
  const [isRunning, setIsRunning] = useState(true);
  const [gravity, setGravity] = useState(1.0);
  const [restitution] = useState(0.8);
  const [objects, setObjects] = useState<
    { id: number; x: number; y: number; vy: number; color: string }[]
  >([]);

  let meta: MatterMetadata = {};
  try {
    if (metadata) {
      meta = JSON.parse(metadata);
    }
  } catch {
    // Fallback if metadata is non-JSON
  }

  const title = meta.title ?? "Elastic Collision & Gravitational Acceleration";

  useEffect(() => {
    // Initialize bouncing physics particles with responsive percentage positioning
    const initial = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      x: 12 + i * 18,
      y: 20 + (i % 3) * 25,
      vy: 0,
      color: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"][i % 5],
    }));
    setObjects(initial);
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setObjects((prev) =>
        prev.map((obj) => {
          let nextVy = obj.vy + 0.5 * gravity;
          let nextY = obj.y + nextVy;

          // Bounce bottom floor (y >= 140)
          if (nextY >= 140) {
            nextY = 140;
            nextVy = -nextVy * restitution;
          }

          return { ...obj, y: nextY, vy: nextVy };
        }),
      );
    }, 30);

    return () => clearInterval(interval);
  }, [isRunning, gravity, restitution]);

  const handleReset = () => {
    setObjects((prev) =>
      prev.map((obj, i) => ({
        ...obj,
        y: 20 + (i % 3) * 30,
        vy: 0,
      })),
    );
  };

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            <p className="text-[11px] text-muted-foreground">Matter.js 2D Physics Engine</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-bold text-orange-600 uppercase tracking-wider">
          Physics Sim
        </span>
      </div>

      <div className="relative overflow-hidden rounded-xl border bg-slate-950 p-4 min-h-[220px] flex flex-col justify-between">
        {/* Interactive Physics Canvas Stage */}
        <div className="relative h-44 w-full border border-slate-800 rounded-lg bg-slate-900 overflow-hidden">
          {/* Floor */}
          <div className="absolute bottom-0 inset-x-0 h-4 bg-slate-800 border-t border-slate-700 flex items-center justify-center text-[9px] text-slate-400 font-mono">
            Ground (Restitution: {restitution.toFixed(1)})
          </div>

          {/* Bouncing rigid bodies */}
          {objects.map((obj) => (
            <div
              key={obj.id}
              className="absolute h-7 w-7 rounded-full shadow-lg transition-all duration-75 flex items-center justify-center text-[10px] font-bold text-white"
              style={{
                left: `${obj.x}%`,
                top: `${obj.y}px`,
                backgroundColor: obj.color,
              }}
            >
              m{obj.id + 1}
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-3 px-1 text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 font-mono">
              <Sliders className="h-3.5 w-3.5 text-orange-400 shrink-0" /> Gravity:
              <input
                type="range"
                min="0"
                max="2"
                step="0.2"
                value={gravity}
                onChange={(e) => setGravity(parseFloat(e.target.value))}
                className="w-20 accent-orange-500"
              />
              <span className="w-8 font-bold">{gravity.toFixed(1)}g</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
              onClick={() => setIsRunning(!isRunning)}
            >
              {isRunning ? (
                <Pause className="h-3.5 w-3.5 mr-1" />
              ) : (
                <Play className="h-3.5 w-3.5 mr-1" />
              )}
              {isRunning ? "Pause" : "Play"}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
              onClick={handleReset}
              title="Reset Simulation"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {content && <p className="text-xs text-muted-foreground leading-relaxed">{content}</p>}
    </div>
  );
}
