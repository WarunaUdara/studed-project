import {
  Activity,
  ArrowDown,
  ArrowRight,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  Sliders,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MatterPhysicsBlockProps {
  content: string;
  metadata?: string | null;
}

// ---------------------------------------------------------------------------
// Types matching the documented Matter.js world_config schema
// (08-Research-&-References/Matter-js-Integration.md)
// ---------------------------------------------------------------------------

interface MatterBodyConfig {
  id: string;
  type: "circle" | "rectangle";
  position: { x: number; y: number };
  radius?: number;
  width?: number;
  height?: number;
  density?: number;
  restitution?: number;
  friction?: number;
  isStatic?: boolean;
  render?: { fillStyle?: string; strokeStyle?: string; lineWidth?: number };
}

interface MatterConstraintConfig {
  id: string;
  bodyA: string;
  bodyB: string;
  length?: number;
  stiffness?: number;
  render?: { strokeStyle?: string; lineWidth?: number };
}

interface MatterWorldConfig {
  gravity?: { x?: number; y?: number; scale?: number };
  bounds?: { width?: number; height?: number };
  bodies?: MatterBodyConfig[];
  constraints?: MatterConstraintConfig[];
}

interface MatterParam {
  label: string;
  property: string;
  type: "slider" | "select";
  min?: number;
  max?: number;
  step?: number;
  default?: number | string;
  options?: string[];
}

interface MatterMeasurement {
  label: string;
  type: "live" | "computed";
  source?: string;
  formula?: string;
}

interface MatterOverlays {
  show_forces?: boolean;
  show_velocity?: boolean;
  show_trajectory?: boolean;
  show_energy_bar?: boolean;
}

interface MatterMetadata {
  title?: string;
  description?: string;
  scenario_type?: string;
  world_config?: MatterWorldConfig;
  editable_params?: MatterParam[];
  measurements?: MatterMeasurement[];
  educational_overlays?: MatterOverlays;
  dimensions?: { width?: number; height?: number };
}

export type { MatterMetadata, MatterWorldConfig, MatterBodyConfig };

// ---------------------------------------------------------------------------
// Tiny config-driven physics engine (self-contained, no external deps).
// Bodies integrate velocity/gravity each tick, collide with bounds and
// static bodies, and constraints pull paired bodies together.
// ---------------------------------------------------------------------------

interface SimBody {
  id: string;
  type: "circle" | "rectangle";
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  width: number;
  height: number;
  density: number;
  restitution: number;
  friction: number;
  isStatic: boolean;
  color: string;
  trail: { x: number; y: number }[];
}

function buildBodies(world: MatterWorldConfig | undefined, height: number): SimBody[] {
  const bodies = (world?.bodies ?? []).map((b) => {
    const r = b.radius ?? 20;
    const w = b.width ?? 60;
    const h = b.height ?? 20;
    return {
      id: b.id ?? `body-${Math.random().toString(36).slice(2, 7)}`,
      type: b.type === "rectangle" ? ("rectangle" as const) : ("circle" as const),
      x: b.position?.x ?? 400,
      y: b.position?.y ?? 100,
      vx: 0,
      vy: 0,
      radius: r,
      width: w,
      height: h,
      density: b.density ?? 0.001,
      restitution: b.restitution ?? 0.8,
      friction: b.friction ?? 0.005,
      isStatic: b.isStatic ?? false,
      color: b.render?.fillStyle ?? "#3b82f6",
      trail: [],
    };
  });
  // Guarantee a floor so dynamic bodies never fall out of view.
  if (!bodies.some((b) => b.isStatic && b.y > height - 60)) {
    bodies.push({
      id: "ground",
      type: "rectangle",
      x: 400,
      y: height - 16,
      vx: 0,
      vy: 0,
      radius: 0,
      width: 1000,
      height: 32,
      density: 0,
      restitution: 0.8,
      friction: 0.005,
      isStatic: true,
      color: "#334155",
      trail: [],
    });
  }
  return bodies;
}

const MAX_TRAIL = 24;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// Exported for unit testing: resolves the config into renderable bodies.
export function resolveBodies(meta: MatterMetadata): SimBody[] {
  const world = meta.world_config ?? {};
  const height = world.bounds?.height ?? 300;
  return buildBodies(world, height);
}

export function MatterPhysicsBlock({ content, metadata }: MatterPhysicsBlockProps) {
  let meta: MatterMetadata = {};
  try {
    if (metadata) meta = JSON.parse(metadata);
  } catch {
    // fall back to defaults
  }

  const world = meta.world_config ?? {};
  const boundsH = world.bounds?.height ?? 300;
  const boundsW = world.bounds?.width ?? 600;
  const gravityScale = world.gravity?.scale ?? 0.001;
  const gravityY = world.gravity?.y ?? 1;
  const gravityX = world.gravity?.x ?? 0;
  const overlays = meta.educational_overlays ?? {};
  const scenario = meta.scenario_type ?? "custom";

  // Editable params -> live overrides keyed by "property" path.
  const [paramValues, setParamValues] = useState<Record<string, number | string>>({});
  const [isRunning, setIsRunning] = useState(true);
  const [bodies, setBodies] = useState<SimBody[]>(() => buildBodies(world, boundsH));
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const tickRef = useRef(0);

  const params = meta.editable_params ?? [];
  const measurementsConfig = meta.measurements ?? [];
  const constraints = world.constraints ?? [];

  const gravity = useMemo(() => {
    const gScale = paramValues["gravity.scale"] ?? gravityScale;
    return {
      x: gravityX * (typeof gScale === "number" ? gScale : 1),
      y: gravityY * (typeof gScale === "number" ? gScale : 1),
    };
  }, [paramValues, gravityScale, gravityX, gravityY]);

  const applyParamToBody = (b: SimBody, property: string, value: number): SimBody => {
    if (property === "global.restitution") return { ...b, restitution: value };
    if (property === "global.friction") return { ...b, friction: value };
    if (property === "global.gravity") return b; // handled via gravity.scale
    if (property.endsWith(".density") || property.includes("density")) return { ...b, density: value };
    if (property.endsWith(".radius")) return { ...b, radius: value };
    return b;
  };

  // Physics loop
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      tickRef.current += 1;
      setBodies((prev) => {
        const next = prev.map((b) => {
          if (b.isStatic) return b;
          let nb: SimBody = { ...b, trail: b.trail };

          // Apply gravity
          let vx = b.vx + gravity.x;
          let vy = b.vy + gravity.y;

          // Constraints (spring/pendulum pull toward anchor)
          for (const c of constraints) {
            if (c.bodyA === b.id || c.bodyB === b.id) {
              const other = prev.find((o) => o.id === (c.bodyA === b.id ? c.bodyB : c.bodyA));
              if (other) {
                const dx = other.x - b.x;
                const dy = other.y - b.y;
                const dist = Math.max(Math.hypot(dx, dy), 1);
                const restLen = c.length ?? 100;
                const stiffness = c.stiffness ?? 0.01;
                const pull = (dist - restLen) * stiffness;
                if (c.bodyA === b.id) {
                  vx += (dx / dist) * pull;
                  vy += (dy / dist) * pull;
                } else {
                  vx -= (dx / dist) * pull * 0.5;
                  vy -= (dy / dist) * pull * 0.5;
                }
              }
            }
          }

          // Apply friction (damping)
          vx *= 1 - b.friction;
          vy *= 1 - b.friction;

          // Editable params that affect bodies
          for (const p of params) {
            const v = paramValues[p.property];
            if (typeof v === "number" && p.property.includes(b.id)) {
              nb = applyParamToBody(nb, p.property, v);
            }
          }

          let x = b.x + vx;
          let y = b.y + vy;
          const r = b.type === "circle" ? b.radius : 0;

          // Bounds collision
          if (x - r < 0) { x = r; vx = Math.abs(vx) * b.restitution; }
          if (x + r > boundsW) { x = boundsW - r; vx = -Math.abs(vx) * b.restitution; }
          if (y - r < 0) { y = r; vy = Math.abs(vy) * b.restitution; }
          if (y + (b.type === "rectangle" ? b.height / 2 : r) > boundsH) {
            y = boundsH - (b.type === "rectangle" ? b.height / 2 : r);
            vy = -Math.abs(vy) * b.restitution;
          }

          // Collision with static bodies (simple AABB/circle check)
          for (const other of prev) {
            if (other.id === b.id || !other.isStatic) continue;
            const bRadius = b.type === "circle" ? b.radius : Math.max(b.width, b.height) / 2;
            const oRadius = other.type === "circle" ? other.radius : Math.max(other.width, other.height) / 2;
            const dist = Math.hypot(other.x - x, other.y - y);
            const minDist = bRadius + oRadius;
            if (dist < minDist && dist > 0) {
              const nx = (x - other.x) / dist;
              const ny = (y - other.y) / dist;
              x = other.x + nx * minDist;
              y = other.y + ny * minDist;
              const dot = vx * nx + vy * ny;
              if (dot < 0) {
                vx -= 2 * dot * nx * b.restitution;
                vy -= 2 * dot * ny * b.restitution;
              }
            }
          }

          // Trail for trajectory overlay
          if (overlays.show_trajectory) {
            nb.trail = [...nb.trail, { x, y }].slice(-MAX_TRAIL);
          }

          return { ...nb, x, y, vx, vy };
        });

        // Live measurements
        const newM: Record<string, string> = {};
        for (const m of measurementsConfig) {
          const target = next.find((b) => m.source?.startsWith(b.id));
          if (m.type === "live" && target && !target.isStatic) {
            const speed = Math.hypot(target.vx, target.vy);
            newM[m.label] = speed.toFixed(2);
          } else if (m.type === "computed" && m.formula) {
            const period = 2 * Math.PI * Math.sqrt((constraints[0]?.length ?? 100) / Math.max(gravity.y, 0.01));
            newM[m.label] = period.toFixed(2);
          }
        }
        if (Object.keys(newM).length > 0) setMeasurements(newM);

        return next;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [isRunning, gravity, constraints, params, paramValues, boundsW, boundsH, overlays.show_trajectory, measurementsConfig]);

  const handleReset = () => {
    setBodies(buildBodies(world, boundsH));
    setMeasurements({});
  };

  const setParam = (p: MatterParam, value: number) => {
    setParamValues((prev) => ({ ...prev, [p.property]: value }));
  };

  const speed = bodies.find((b) => !b.isStatic)?.vx ?? 0;
  const totalEnergy = bodies.reduce((acc, b) => {
    if (b.isStatic) return acc;
    const ke = 0.5 * b.density * (b.vx * b.vx + b.vy * b.vy);
    const pe = b.density * gravity.y * (boundsH - b.y);
    return acc + ke + pe;
  }, 0);

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">{meta.title ?? "Physics Simulation"}</h4>
            <p className="text-[11px] text-muted-foreground">
              Matter.js 2D Physics Engine{meta.description ? ` · ${meta.description}` : ""}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-bold text-orange-600 uppercase tracking-wider">
          {scenario.replace(/_/g, " ")}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-xl border bg-slate-950 p-4 min-h-[260px]">
        {/* Stage */}
        <div
          className="relative w-full rounded-lg border border-slate-800 bg-slate-900 overflow-hidden"
          style={{ height: boundsH, maxHeight: 360 }}
        >
          {/* Force arrows (educational overlay) */}
          {overlays.show_forces &&
            bodies
              .filter((b) => !b.isStatic)
              .map((b) => (
                <div key={`f-${b.id}`} className="absolute" style={{ left: b.x, top: b.y }}>
                  <ArrowDown className="h-3.5 w-3.5 text-red-400" style={{ transform: "translateY(-100%)" }} />
                </div>
              ))}
          {/* Velocity arrows */}
          {overlays.show_velocity &&
            bodies
              .filter((b) => !b.isStatic && (Math.abs(b.vx) > 0.1 || Math.abs(b.vy) > 0.1))
              .map((b) => (
                <div
                  key={`v-${b.id}`}
                  className="absolute"
                  style={{ left: b.x + 8, top: b.y - 14 }}
                >
                  <ArrowRight className="h-3 w-3 text-emerald-400" style={{ transform: `rotate(${Math.atan2(b.vy, Math.max(b.vx, 0.01)) * (180 / Math.PI)}deg)` }} />
                </div>
              ))}

          {/* Trajectory trails */}
          {overlays.show_trajectory &&
            bodies
              .filter((b) => b.trail.length > 1)
              .map((b) => (
                <svg key={`t-${b.id}`} className="absolute inset-0 h-full w-full pointer-events-none">
                  <polyline
                    points={b.trail.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none"
                    stroke={b.color}
                    strokeOpacity="0.4"
                    strokeWidth="1.5"
                  />
                </svg>
              ))}

          {/* Bodies */}
          {bodies.map((b) => (
            <div
              key={b.id}
              title={b.id}
              className={cn("absolute shadow-lg flex items-center justify-center text-[10px] font-bold text-white select-none", !b.isStatic && "transition-all duration-75")}
              style={{
                left: b.type === "rectangle" ? b.x - b.width / 2 : b.x - b.radius,
                top: b.type === "rectangle" ? b.y - b.height / 2 : b.y - b.radius,
                width: b.type === "rectangle" ? b.width : b.radius * 2,
                height: b.type === "rectangle" ? b.height : b.radius * 2,
                borderRadius: b.type === "circle" ? "9999px" : "6px",
                backgroundColor: b.color,
                border: b.isStatic ? "1px solid rgba(255,255,255,0.25)" : undefined,
              }}
            >
              {b.id.length <= 14 ? b.id : b.id.slice(0, 12) + "…"}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 mt-3 text-xs text-slate-300">
          {/* Editable parameter sliders from config */}
          {params.length > 0 && (
            <div className="flex flex-wrap gap-x-5 gap-y-2 px-1">
              {params.map((p) => (
                <label key={p.property} className="flex items-center gap-1.5 font-mono">
                  <Sliders className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                  {p.label}:
                  <input
                    type="range"
                    min={p.min ?? 0}
                    max={p.max ?? 1}
                    step={p.step ?? 0.01}
                    value={(paramValues[p.property] as number) ?? (p.default as number) ?? 0.5}
                    onChange={(e) => setParam(p, parseFloat(e.target.value))}
                    className="w-20 accent-orange-500"
                  />
                  <span className="w-12 font-bold tabular-nums">
                    {((paramValues[p.property] as number) ?? (p.default as number) ?? 0.5).toFixed(p.step && p.step < 0.01 ? 4 : 2)}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* Live measurements from config */}
          {measurementsConfig.length > 0 && (
            <div className="flex flex-wrap gap-x-5 gap-y-1 px-1 border-t border-slate-800 pt-2">
              {measurementsConfig.map((m) => (
                <span key={m.label} className="flex items-center gap-1 font-mono text-slate-400">
                  <Gauge className="h-3.5 w-3.5 text-emerald-400" />
                  {m.label}: <strong className="text-emerald-300 tabular-nums">{measurements[m.label] ?? "—"}</strong>
                </span>
              ))}
            </div>
          )}

          {/* Energy bar (educational overlay) */}
          {overlays.show_energy_bar && (
            <div className="px-1 border-t border-slate-800 pt-2">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
                <span className="font-mono text-slate-400">Energy</span>
                <div className="h-1.5 flex-1 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-yellow-400 transition-all"
                    style={{ width: `${Math.min(100, Math.max(4, totalEnergy * 4))}%` }}
                  />
                </div>
                <span className="font-mono text-yellow-300 tabular-nums w-14 text-right">{totalEnergy.toFixed(1)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-slate-500 text-[11px]">
              speed: {Math.hypot(speed, bodies.find((b) => !b.isStatic)?.vy ?? 0).toFixed(1)}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                onClick={() => setIsRunning(!isRunning)}
              >
                {isRunning ? <Pause className="h-3.5 w-3.5 mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}
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
      </div>

      {content && <p className="text-xs text-muted-foreground leading-relaxed">{content}</p>}
    </div>
  );
}
