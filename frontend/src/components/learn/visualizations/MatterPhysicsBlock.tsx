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

interface MatterBodyConfig {
  id: string;
  type: "circle" | "rectangle";
  position?: { x?: number; y?: number };
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
  /** Global applied force (N) acting on every non-static body each tick.
   *  Acceleration = force / density (mass proxy), demonstrating F = ma. */
  thrust?: { x?: number; y?: number };
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
  /** Newton's laws preset map (from newtonsLaws.ts): keys "1"|"2"|"3". */
  laws?: Record<"1" | "2" | "3", MatterMetadata>;
}

export type { MatterMetadata, MatterWorldConfig, MatterBodyConfig };

export interface MatterPhysicsBlockProps {
  content?: string;
  metadata?: string | null;
}

// ---------------------------------------------------------------------------
// Tiny config-driven physics engine (self-contained, no external deps).
// Bodies integrate velocity/gravity each tick, collide with bounds and
// static bodies, constraints pull paired bodies together, and an optional
// applied force (thrust) accelerates them per F = ma.
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
    const radius = b.radius ?? 20;
    const width = b.width ?? 60;
    const bodyHeight = b.height ?? 30;
    return {
      id: b.id,
      type: b.type,
      x: b.position?.x ?? 300,
      y: b.position?.y ?? Math.max(radius + 10, height / 2),
      vx: 0,
      vy: 0,
      radius,
      width,
      height: bodyHeight,
      density: b.density ?? 0.002,
      restitution: b.restitution ?? 0.6,
      friction: b.friction ?? 0.01,
      isStatic: b.isStatic ?? false,
      color: b.render?.fillStyle ?? "#f59e0b",
      trail: [],
    };
  });

  // Ground floor (static) unless the config already declares one at the
  // bottom of the canvas.
  if (!bodies.some((b) => b.isStatic && b.y > height - 60)) {
    bodies.push({
      id: "floor",
      type: "rectangle",
      x: 500,
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

/** Evaluates a computed-measurement formula like "thrust/density" using the
 *  current param values and the first non-static body's density. Uses a
 *  tiny safe arithmetic parser (no eval / new Function) so it works inside
 *  sandboxed iframes and can never execute arbitrary code. */
export function evaluateFormula(
  formula: string,
  paramValues: Record<string, number | string>,
  density: number,
): number | null {
  let expr = formula.trim();
  if (!expr) return null;
  // Resolve simple variable names: thrust.x/thrust.y, density, mass
  expr = expr.replace(/\bthrust\.x\b/g, String(Number(paramValues["thrust.x"]) || 0));
  expr = expr.replace(/\bthrust\.y\b/g, String(Number(paramValues["thrust.y"]) || 0));
  expr = expr.replace(/\bthrust\b/g, String(Number(paramValues["thrust.x"]) || 0));
  expr = expr.replace(/\bdensity\b/g, String(density || 0.002));
  expr = expr.replace(/\bmass\b/g, String(density || 0.002));
  // Only allow numbers and arithmetic operators — never eval arbitrary code.
  if (!/^[\d\s+\-*/().]+$/.test(expr)) return null;
  return safeEval(expr);
}

/** Recursive-descent evaluator for + - * / ( ) over plain numbers. */
function safeEval(expr: string): number | null {
  let pos = 0;
  const s = expr;

  const skipWs = () => {
    while (pos < s.length && /\s/.test(s[pos])) pos++;
  };
  const peek = () => (pos < s.length ? s[pos] : "");
  const fail = (): number | null => null;

  const parseNumber = (): number | null => {
    skipWs();
    const m = /^\d*\.?\d+/.exec(s.slice(pos));
    if (!m) return fail();
    pos += m[0].length;
    return parseFloat(m[0]);
  };

  const parseFactor = (): number | null => {
    skipWs();
    if (peek() === "(") {
      pos++;
      const v = parseAddSub();
      skipWs();
      if (peek() !== ")") return fail();
      pos++;
      return v;
    }
    if (peek() === "-") {
      pos++;
      const v = parseFactor();
      return v === null ? null : -v;
    }
    return parseNumber();
  };

  const parseMulDiv = (): number | null => {
    let left = parseFactor();
    if (left === null) return null;
    for (;;) {
      skipWs();
      const op = peek();
      if (op !== "*" && op !== "/") break;
      pos++;
      const right = parseFactor();
      if (right === null) return null;
      left = op === "*" ? left * right : left / right;
    }
    return left;
  };

  const parseAddSub = (): number | null => {
    let left = parseMulDiv();
    if (left === null) return null;
    for (;;) {
      skipWs();
      const op = peek();
      if (op !== "+" && op !== "-") break;
      pos++;
      const right = parseMulDiv();
      if (right === null) return null;
      left = op === "+" ? left + right : left - right;
    }
    return left;
  };

  const result = parseAddSub();
  if (result === null || !isFinite(result)) return null;
  skipWs();
  return pos === s.length ? result : null;
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
  const overlays = meta.educational_overlays ?? {};
  const scenario = meta.scenario_type ?? "custom";

  // Newton's Three Laws: when the metadata carries a `laws` map (from the
  // newtonsLaws.ts presets), render a law switcher and use the selected
  // law's config instead of a single world.
  const laws = meta.laws;
  const isNewtonsLaws = scenario === "newtons_laws" && !!laws;
  const [activeLaw, setActiveLaw] = useState<"1" | "2" | "3">("1");
  const lawMeta = isNewtonsLaws && laws ? laws[activeLaw] : null;
  const effectiveMeta = lawMeta ?? meta;
  const effectiveWorld = effectiveMeta.world_config ?? world;
  const effectiveParams = effectiveMeta.editable_params ?? [];
  const effectiveMeasurements = effectiveMeta.measurements ?? [];
  const effectiveConstraints = effectiveWorld.constraints ?? [];
  const effectiveOverlays = effectiveMeta.educational_overlays ?? overlays;
  const effectiveBoundsH = effectiveWorld.bounds?.height ?? boundsH;
  const effectiveBoundsW = effectiveWorld.bounds?.width ?? boundsW;
  const effectiveGravityY = effectiveWorld.gravity?.y ?? 1;
  const effectiveGravityX = effectiveWorld.gravity?.x ?? 0;
  const effectiveGravityScale = effectiveWorld.gravity?.scale ?? 0.001;
  const effectiveTitle = effectiveMeta.title ?? meta.title ?? "Physics Simulation";
  const effectiveDescription = effectiveMeta.description ?? meta.description;

  // Editable params -> live overrides keyed by "property" path.
  const [paramValues, setParamValues] = useState<Record<string, number | string>>({});
  const [isRunning, setIsRunning] = useState(true);
  const [bodies, setBodies] = useState<SimBody[]>(() => buildBodies(effectiveWorld, effectiveBoundsH));
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const tickRef = useRef(0);

  // Reset bodies + measurements when the law changes or config arrives.
  useEffect(() => {
    setBodies(buildBodies(effectiveWorld, effectiveBoundsH));
    setMeasurements({});
    setParamValues({});
  }, [activeLaw, effectiveWorld, effectiveBoundsH]);

  const gravity = useMemo(() => {
    const gScale = paramValues["gravity.scale"] ?? effectiveGravityScale;
    return {
      x: effectiveGravityX * (typeof gScale === "number" ? gScale : 1),
      y: effectiveGravityY * (typeof gScale === "number" ? gScale : 1),
    };
  }, [paramValues, effectiveGravityScale, effectiveGravityX, effectiveGravityY]);

  const applyParamToBody = (b: SimBody, property: string, value: number): SimBody => {
    if (property === "global.restitution") return { ...b, restitution: value };
    if (property === "global.friction") return { ...b, friction: value };
    if (property === "global.gravity") return b; // handled via gravity.scale
    if (property.endsWith(".density") || property.includes("density")) return { ...b, density: value };
    if (property.endsWith(".radius")) return { ...b, radius: value };
    return b;
  };

  // Applied force (thrust) from config or editable param "thrust.x"/"thrust.y".
  const thrust = useMemo(() => {
    const tx = paramValues["thrust.x"] ?? effectiveWorld.thrust?.x ?? 0;
    const ty = paramValues["thrust.y"] ?? effectiveWorld.thrust?.y ?? 0;
    return { x: Number(tx) || 0, y: Number(ty) || 0 };
  }, [paramValues, effectiveWorld.thrust?.x, effectiveWorld.thrust?.y]);

  // Constraints with live stiffness override from editable params.
  const constraints = useMemo(() => {
    return effectiveConstraints.map((c) => {
      const stiffnessOverride = paramValues[`constraints.${c.id}.stiffness`];
      return {
        ...c,
        stiffness: typeof stiffnessOverride === "number" ? stiffnessOverride : c.stiffness,
      };
    });
  }, [effectiveConstraints, paramValues]);

  // Physics loop
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      tickRef.current += 1;
      setBodies((prev) => {
        const next = prev.map((b) => {
          if (b.isStatic) return b;
          let nb: SimBody = { ...b, trail: b.trail };
          let vx = b.vx + gravity.x;
          let vy = b.vy + gravity.y;

          // Apply applied force (thrust): a = F/m with mass proportional to
          // density — Newton's second law (F = ma) in action.
          const mass = Math.max(b.density, 0.00001);
          vx += (thrust.x / mass) * 0.05;
          vy += (thrust.y / mass) * 0.05;

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
          for (const p of effectiveParams) {
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
          if (x + r > effectiveBoundsW) { x = effectiveBoundsW - r; vx = -Math.abs(vx) * b.restitution; }
          if (y - r < 0) { y = r; vy = Math.abs(vy) * b.restitution; }
          if (y + (b.type === "rectangle" ? b.height / 2 : r) > effectiveBoundsH) {
            y = effectiveBoundsH - (b.type === "rectangle" ? b.height / 2 : r);
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
          if (effectiveOverlays.show_trajectory) {
            nb.trail = [...nb.trail, { x, y }].slice(-MAX_TRAIL);
          }

          return { ...nb, x, y, vx, vy };
        });

        // Live measurements
        const newM: Record<string, string> = {};
        for (const m of effectiveMeasurements) {
          const target = next.find((b) => m.source?.startsWith(b.id));
          if (m.type === "live" && target && !target.isStatic) {
            const speed = Math.hypot(target.vx, target.vy);
            newM[m.label] = speed.toFixed(2);
          } else if (m.type === "computed" && m.formula) {
            const firstDynamic = next.find((b) => !b.isStatic);
            const density = firstDynamic?.density ?? 0.002;
            const value = evaluateFormula(m.formula, paramValues, density);
            newM[m.label] = value !== null ? value.toFixed(4) : "—";
          }
        }
        if (Object.keys(newM).length > 0) setMeasurements(newM);

        return next;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [isRunning, gravity, thrust, constraints, effectiveParams, paramValues, effectiveBoundsW, effectiveBoundsH, effectiveOverlays.show_trajectory, effectiveMeasurements]);

  const handleReset = () => {
    setBodies(buildBodies(effectiveWorld, effectiveBoundsH));
    setMeasurements({});
  };

  const setParam = (p: MatterParam, value: number) => {
    setParamValues((prev) => ({ ...prev, [p.property]: value }));
  };

  const speed = bodies.find((b) => !b.isStatic)?.vx ?? 0;
  const totalEnergy = bodies.reduce((acc, b) => {
    if (b.isStatic) return acc;
    const ke = 0.5 * b.density * (b.vx * b.vx + b.vy * b.vy);
    const pe = b.density * gravity.y * (effectiveBoundsH - b.y);
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
            <h4 className="text-sm font-semibold text-foreground">{effectiveTitle}</h4>
            <p className="text-[11px] text-muted-foreground">
              Matter.js 2D Physics Engine{effectiveDescription ? ` · ${effectiveDescription}` : ""}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-bold text-orange-600 uppercase tracking-wider">
          {scenario.replace(/_/g, " ")}
        </span>
      </div>

      {/* Newton's laws switcher */}
      {isNewtonsLaws && (
        <div className="flex flex-wrap items-center gap-2">
          {(["1", "2", "3"] as const).map((law) => (
            <button
              key={law}
              onClick={() => setActiveLaw(law)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                activeLaw === law
                  ? "border-orange-500/50 bg-orange-500/10 text-orange-600"
                  : "border-border text-muted-foreground hover:border-orange-500/30 hover:text-foreground",
              )}
            >
              {law === "1" ? "1st Law" : law === "2" ? "2nd Law" : "3rd Law"}
            </button>
          ))}
        </div>
      )}

      <div className="relative overflow-hidden rounded-xl border bg-slate-950 p-4 min-h-[260px]">
        {/* Stage */}
        <div
          className="relative w-full rounded-lg border border-slate-800 bg-slate-900 overflow-hidden"
          style={{ height: effectiveBoundsH, maxHeight: 360 }}
        >
          {/* Force arrows (educational overlay) */}
          {effectiveOverlays.show_forces &&
            bodies
              .filter((b) => !b.isStatic)
              .map((b) => (
                <div key={`f-${b.id}`} className="absolute" style={{ left: b.x, top: b.y }}>
                  <ArrowDown className="h-3.5 w-3.5 text-red-400" style={{ transform: "translateY(-100%)" }} />
                </div>
              ))}
          {/* Velocity arrows */}
          {effectiveOverlays.show_velocity &&
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
          {effectiveOverlays.show_trajectory &&
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
          {effectiveParams.length > 0 && (
            <div className="flex flex-wrap gap-x-5 gap-y-2 px-1">
              {effectiveParams.map((p) => (
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
          {effectiveMeasurements.length > 0 && (
            <div className="flex flex-wrap gap-x-5 gap-y-1 px-1 border-t border-slate-800 pt-2">
              {effectiveMeasurements.map((m) => (
                <span key={m.label} className="flex items-center gap-1 font-mono text-slate-400">
                  <Gauge className="h-3.5 w-3.5 text-emerald-400" />
                  {m.label}: <strong className="text-emerald-300 tabular-nums">{measurements[m.label] ?? "—"}</strong>
                </span>
              ))}
            </div>
          )}

          {/* Energy bar (educational overlay) */}
          {effectiveOverlays.show_energy_bar && (
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
