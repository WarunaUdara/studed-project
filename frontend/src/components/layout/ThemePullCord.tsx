import { useCallback, useEffect, useRef } from "react";
import { useUiPrefs } from "@/stores/uiPrefs";

/**
 * Bulletproof, zero-dependency Interactive Theme PullCord.
 *
 * Replaces the fragile third-party package with an ultra-reliable native Verlet
 * physics simulation. Features global pointer capture, fail-safe NaN recovery,
 * window blur auto-release, keyboard navigation, and seamless light/dark theme toggling.
 */

interface Point {
  x: number;
  y: number;
  ox: number;
  oy: number;
  fixed: boolean;
}

const W = 64;
const ANCHOR_X = W / 2;
const REST_Y = 176;
const SVG_H = 340;
const SEGMENTS = 16;
const REST_SEG = REST_Y / SEGMENTS;
const KNOB_R = 6.5;
const HIT = 46;

const CONFIG = {
  gravity: 1350,
  damping: 0.95,
  iterations: 25,
  stretchMax: 70,
  stretchToggle: 28,
  maxVelocity: 25,
  sleepVelocity: 0.15,
};

function createNodes(): Point[] {
  const arr: Point[] = [];
  for (let i = 0; i <= SEGMENTS; i++) {
    const y = REST_SEG * i;
    arr.push({ x: ANCHOR_X, y, ox: ANCHOR_X, oy: y, fixed: i === 0 });
  }
  return arr;
}

function buildSvgPath(nodes: Point[]): string {
  if (!nodes || nodes.length < 2) return "";
  let d = `M ${nodes[0].x.toFixed(1)} ${nodes[0].y.toFixed(1)}`;
  for (let i = 1; i < nodes.length - 1; i++) {
    const xc = (nodes[i].x + nodes[i + 1].x) / 2;
    const yc = (nodes[i].y + nodes[i + 1].y) / 2;
    d += ` Q ${nodes[i].x.toFixed(1)} ${nodes[i].y.toFixed(1)} ${xc.toFixed(1)} ${yc.toFixed(1)}`;
  }
  const n = nodes.length - 1;
  d += ` L ${nodes[n].x.toFixed(1)} ${nodes[n].y.toFixed(1)}`;
  return d;
}

export function ThemePullCord() {
  const theme = useUiPrefs((s) => s.theme);
  const toggleTheme = useUiPrefs((s) => s.toggleTheme);

  const cordPathRef = useRef<SVGPathElement | null>(null);
  const knobGroupRef = useRef<SVGGElement | null>(null);
  const knobButtonRef = useRef<HTMLButtonElement | null>(null);

  const nodesRef = useRef<Point[]>(createNodes());
  const draggingRef = useRef(false);
  const didDragRef = useRef(false);
  const toggledDuringDragRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartXRef = useRef(0);
  const targetRef = useRef({ x: ANCHOR_X, y: REST_Y });

  const isRunningRef = useRef(false);
  const rafIdRef = useRef<number>(0);
  const toggleThemeRef = useRef(toggleTheme);
  toggleThemeRef.current = toggleTheme;

  // Render current physics state to DOM
  const renderFrame = useCallback(() => {
    const nodes = nodesRef.current;
    if (!nodes || nodes.length === 0) return;
    const last = nodes[nodes.length - 1];

    // Ensure valid coordinates
    if (!Number.isFinite(last.x) || !Number.isFinite(last.y)) {
      nodesRef.current = createNodes();
      return;
    }

    if (cordPathRef.current) {
      cordPathRef.current.setAttribute("d", buildSvgPath(nodes));
    }

    const tx = (last.x - ANCHOR_X).toFixed(2);
    const ty = (last.y - REST_Y).toFixed(2);

    if (knobGroupRef.current) {
      knobGroupRef.current.setAttribute("transform", `translate(${tx} ${ty})`);
    }

    if (knobButtonRef.current) {
      knobButtonRef.current.style.transform = `translate(${tx}px, ${ty}px)`;
    }
  }, []);

  // Main physics loop (Verlet Integration)
  const wakeSimulation = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    let prevTime = performance.now();
    let prevDt = 1 / 60;

    const step = (now: number) => {
      const pts = nodesRef.current;
      const last = pts.length - 1;
      const dt = Math.min(0.04, Math.max(0.004, (now - prevTime) / 1000));
      prevTime = now;

      const tc = prevDt > 0 ? dt / prevDt : 1;
      const velCoef = tc * Math.pow(CONFIG.damping, dt * 60);
      const accCoef = dt * dt;

      pts[last].fixed = draggingRef.current;

      // Verlet position update
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        if (p.fixed) continue;

        const vx = p.x - p.ox;
        const vy = p.y - p.oy;
        p.ox = p.x;
        p.oy = p.y;

        p.x += vx * velCoef;
        p.y += vy * velCoef + CONFIG.gravity * accCoef;

        // Failsafe NaN protection
        if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) {
          p.x = ANCHOR_X;
          p.y = REST_SEG * i;
          p.ox = p.x;
          p.oy = p.y;
        }
      }

      pts[0].x = ANCHOR_X;
      pts[0].y = 0;

      // Drag target constraint
      if (draggingRef.current) {
        pts[last].ox = pts[last].x;
        pts[last].oy = pts[last].y;
        pts[last].x = targetRef.current.x;
        pts[last].y = targetRef.current.y;
      }

      // Distance constraints relaxation (Gauss-Seidel)
      for (let k = 0; k < CONFIG.iterations; k++) {
        for (let i = 0; i < last; i++) {
          const a = pts[i];
          const b = pts[i + 1];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.0001;
          const diff = ((REST_SEG - dist) / dist) * 0.5;
          const ox = dx * diff;
          const oy = dy * diff;

          if (!a.fixed) {
            a.x -= ox;
            a.y -= oy;
          }
          if (!b.fixed) {
            b.x += ox;
            b.y += oy;
          }
        }
      }

      prevDt = dt;
      renderFrame();

      // Check kinetic energy to sleep simulation
      let speed = 0;
      for (let i = 1; i < pts.length; i++) {
        speed += Math.abs(pts[i].x - pts[i].ox) + Math.abs(pts[i].y - pts[i].oy);
      }

      if (!draggingRef.current && speed < CONFIG.sleepVelocity * dt * 60) {
        renderFrame();
        isRunningRef.current = false;
        return;
      }

      rafIdRef.current = requestAnimationFrame(step);
    };

    rafIdRef.current = requestAnimationFrame(step);
  }, [renderFrame]);

  // Trigger a scripted elastic pull animation
  const triggerScriptedPull = useCallback(() => {
    toggleThemeRef.current();
    const pts = nodesRef.current;
    if (pts && pts.length > 0) {
      pts[pts.length - 1].oy -= 30;
      pts[pts.length - 1].ox += (Math.random() - 0.5) * 12;
    }
    wakeSimulation();
  }, [wakeSimulation]);

  // Pointer event handlers with bulletproof capture
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignored if browser pointer capture fails
    }

    draggingRef.current = true;
    didDragRef.current = false;
    toggledDuringDragRef.current = false;
    dragStartXRef.current = e.clientX;
    dragStartYRef.current = e.clientY;

    wakeSimulation();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current) return;

    const deltaX = e.clientX - dragStartXRef.current;
    const deltaY = e.clientY - dragStartYRef.current;

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      didDragRef.current = true;
    }

    const rx = deltaX;
    const ry = REST_Y + Math.max(0, deltaY);
    const dist = Math.hypot(rx, ry) || 0.0001;
    const maxD = REST_Y + CONFIG.stretchMax;
    const k = dist > maxD ? maxD / dist : 1;

    targetRef.current = {
      x: ANCHOR_X + rx * k,
      y: ry * k,
    };

    // Check threshold for toggle
    const stretch = dist - REST_Y;
    if (!toggledDuringDragRef.current && stretch >= CONFIG.stretchToggle) {
      toggledDuringDragRef.current = true;
      toggleThemeRef.current();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current) return;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }

    const pts = nodesRef.current;
    const last = pts[pts.length - 1];
    const vx = last.x - last.ox;
    const vy = last.y - last.oy;
    const v = Math.hypot(vx, vy);

    if (v > CONFIG.maxVelocity) {
      const k = CONFIG.maxVelocity / v;
      last.ox = last.x - vx * k;
      last.oy = last.y - vy * k;
    }

    draggingRef.current = false;
    wakeSimulation();

    // If it was a quick click rather than a drag, trigger pull
    if (!didDragRef.current) {
      triggerScriptedPull();
    }
  };

  const handlePointerCancel = () => {
    draggingRef.current = false;
    didDragRef.current = false;
    wakeSimulation();
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      triggerScriptedPull();
    }
  };

  // Safety listeners: window blur or tab switch immediately recovers physics
  useEffect(() => {
    const handleWindowBlur = () => {
      if (draggingRef.current) {
        draggingRef.current = false;
        wakeSimulation();
      }
    };

    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("pointerup", handleWindowBlur);

    // Initial render
    renderFrame();

    // Entrance drop impulse
    const timer = setTimeout(() => {
      const pts = nodesRef.current;
      if (pts && pts.length > 0) {
        pts[pts.length - 1].oy -= 18;
        pts[pts.length - 1].ox -= 8;
        wakeSimulation();
      }
    }, 400);

    return () => {
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("pointerup", handleWindowBlur);
      clearTimeout(timer);
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [renderFrame, wakeSimulation]);

  return (
    <div
      className="pointer-events-none fixed top-0 right-16 z-[9999] select-none"
      style={{
        width: W,
        height: SVG_H,
      }}
      aria-hidden="false"
    >
      <div className="relative size-full">
        <svg
          viewBox={`0 0 ${W} ${SVG_H}`}
          width={W}
          height={SVG_H}
          aria-hidden="true"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="pc-knob-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#d1d5db" />
            </linearGradient>
            <filter id="pc-knob-shadow" x="-70%" y="-70%" width="240%" height="240%">
              <feDropShadow dx="0" dy="1.6" stdDeviation="1.8" floodColor="rgba(0,0,0,0.35)" />
            </filter>
          </defs>

          {/* Elastic Cord Line */}
          <path
            ref={cordPathRef}
            d={buildSvgPath(nodesRef.current)}
            stroke="var(--pullcord-ink, rgba(127, 127, 127, 0.5))"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />

          {/* SVG Visual Knob Indicator */}
          <g ref={knobGroupRef}>
            <g filter="url(#pc-knob-shadow)">
              <circle
                cx={ANCHOR_X}
                cy={REST_Y}
                r={KNOB_R}
                fill="url(#pc-knob-grad)"
                stroke="rgba(0,0,0,0.18)"
                strokeWidth={0.75}
              />
            </g>
          </g>
        </svg>

        {/* Interactive Pointer / Keyboard Knob Target Button */}
        <button
          ref={knobButtonRef}
          type="button"
          aria-label="Toggle dark and light theme"
          aria-pressed={theme === "dark"}
          title="Pull to toggle theme (or click)"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onKeyDown={handleKeyDown}
          className="pointer-events-auto absolute cursor-grab touch-none rounded-full transition-shadow active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-login-accent focus-visible:ring-offset-2 focus-visible:outline-none"
          style={{
            left: ANCHOR_X - HIT / 2,
            top: REST_Y - HIT / 2,
            width: HIT,
            height: HIT,
            background: "transparent",
            border: "none",
            padding: 0,
          }}
        />
      </div>
    </div>
  );
}
