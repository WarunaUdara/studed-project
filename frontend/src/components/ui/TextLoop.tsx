import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./TextLoop.css";

const VIEW_W = 1200;
const VIEW_H = 120;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;
const EDGE_PAD = 4;

export type TextLoopShape = "circle" | "infinity" | "arch" | "line" | "wave";

export interface TextLoopProps {
  text?: string;
  shape?: TextLoopShape;
  path?: string;
  speed?: number;
  direction?: "forward" | "reverse";
  separator?: string;
  curviness?: number;
  fontSize?: number;
  fontWeight?: number;
  letterSpacing?: number;
  uppercase?: boolean;
  color?: string;
  ribbon?: boolean;
  ribbonColor?: string;
  ribbonWidth?: number;
  pauseOnHover?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const buildPath = (shape: TextLoopShape, curviness: number, ribbonWidth: number): string => {
  const c = Math.max(0, curviness);
  const room = Math.max(10, CY - Math.max(0, ribbonWidth) / 2 - EDGE_PAD);

  switch (shape) {
    case "circle": {
      const r = Math.min(90 + c * 0.95, room);
      return `M ${CX - r} ${CY} A ${r} ${r} 0 1 1 ${CX + r} ${CY} A ${r} ${r} 0 1 1 ${CX - r} ${CY} Z`;
    }
    case "infinity": {
      const r = 150 + c * 1.4;
      const h = Math.min(60 + c * 0.95, room);
      return [
        `M ${CX} ${CY}`,
        `C ${CX + r * 0.55} ${CY - h} ${CX + r} ${CY - h} ${CX + r} ${CY}`,
        `C ${CX + r} ${CY + h} ${CX + r * 0.55} ${CY + h} ${CX} ${CY}`,
        `C ${CX - r * 0.55} ${CY - h} ${CX - r} ${CY - h} ${CX - r} ${CY}`,
        `C ${CX - r} ${CY + h} ${CX - r * 0.55} ${CY + h} ${CX} ${CY}`,
        "Z",
      ].join(" ");
    }
    case "arch": {
      const rise = Math.min(120 + c * 1.1, room * 2);
      return `M 120 ${CY + rise / 2} Q ${CX} ${CY - rise * 1.5} ${VIEW_W - 120} ${CY + rise / 2}`;
    }
    case "line":
      return `M -320 ${CY} L ${VIEW_W + 320} ${CY}`;
    case "wave":
    default: {
      const a = Math.min(c * 2.2, room * 2);
      return `M -320 ${CY} Q -160 ${CY - a} 0 ${CY} T 320 ${CY} T 640 ${CY} T 960 ${CY} T 1280 ${CY} T ${VIEW_W + 320} ${CY}`;
    }
  }
};

export function TextLoop({
  text = "StudEd ✦ Interactive Learning ✦ Sri Lanka",
  shape = "wave",
  path,
  speed = 90,
  direction = "forward",
  separator = "✦",
  curviness = 16,
  fontSize = 18,
  fontWeight = 700,
  letterSpacing = 2,
  uppercase = true,
  color = "#ffffff",
  ribbon = true,
  ribbonColor = "rgba(16, 185, 129, 0.15)",
  ribbonWidth = 28,
  pauseOnHover = false,
  className = "",
  style = {},
}: TextLoopProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const measureRef = useRef<SVGTextElement>(null);
  const textPathRef = useRef<SVGTextPathElement>(null);

  const [metrics, setMetrics] = useState<{ pathLength: number; unitWidth: number; reps: number }>({
    pathLength: 0,
    unitWidth: 0,
    reps: 4,
  });

  const rawId = useId();
  const pathId = `text-loop-${rawId.replace(/:/g, "")}`;

  const d = useMemo(
    () => path || buildPath(shape, curviness, ribbonWidth),
    [path, shape, curviness, ribbonWidth],
  );

  const unit = useMemo(() => {
    const base = uppercase ? String(text).toUpperCase() : String(text);
    const gap = separator ? `\u00A0${separator}\u00A0` : "\u00A0\u00A0\u00A0";
    return `${base}${gap}`;
  }, [text, separator, uppercase]);

  const textStyle = useMemo(
    () => ({ fontSize: `${fontSize}px`, fontWeight, letterSpacing: `${letterSpacing}px` }),
    [fontSize, fontWeight, letterSpacing],
  );

  useLayoutEffect(() => {
    const pathEl = pathRef.current;
    const measureEl = measureRef.current;
    if (!pathEl || !measureEl) return undefined;

    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      let pathLength = 0;
      let unitWidth = 0;
      try {
        pathLength = pathEl.getTotalLength();
        unitWidth = measureEl.getComputedTextLength();
      } catch {
        // Fallback for SVG measurement
      }
      if (!pathLength || pathLength < 10) {
        pathLength = VIEW_W * 1.5;
      }
      if (!unitWidth || unitWidth < 10) {
        unitWidth = Math.max(50, unit.length * fontSize * 0.6);
      }

      // Reps required to cover pathLength + 2 * unitWidth seamlessly
      const reps = Math.ceil((pathLength + unitWidth * 2) / unitWidth) + 1;
      setMetrics((prev) =>
        prev.pathLength === pathLength && prev.unitWidth === unitWidth && prev.reps === reps
          ? prev
          : { pathLength, unitWidth, reps },
      );
    };

    measure();
    const timer = setTimeout(measure, 60);
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }
    window.addEventListener("resize", measure);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener("resize", measure);
    };
  }, [d, unit, fontSize, fontWeight, letterSpacing]);

  useEffect(() => {
    const { unitWidth } = metrics;
    const textPath = textPathRef.current;
    if (!textPath || !unitWidth) return undefined;

    const apply = (offset: number) => {
      // Smoothly wrap offset modulo unitWidth to cycle seamlessly without overlapping text elements
      const rawMod = offset % unitWidth;
      const startOffset = rawMod > 0 ? rawMod - unitWidth : rawMod;
      textPath.setAttribute("startOffset", `${startOffset.toFixed(2)}`);
    };

    apply(0);

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || speed <= 0) return undefined;

    let currentOffset = 0;
    let animId: number;
    let lastTime = performance.now();
    let isPaused = false;

    const dirMultiplier = direction === "reverse" ? -1 : 1;

    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (!isPaused && dt < 0.2) {
        currentOffset += dirMultiplier * speed * dt;
        apply(currentOffset);
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    const root = rootRef.current;
    const pause = () => {
      isPaused = true;
    };
    const resume = () => {
      isPaused = false;
      lastTime = performance.now();
    };

    if (pauseOnHover && root) {
      root.addEventListener("pointerenter", pause);
      root.addEventListener("pointerleave", resume);
    }

    return () => {
      cancelAnimationFrame(animId);
      if (pauseOnHover && root) {
        root.removeEventListener("pointerenter", pause);
        root.removeEventListener("pointerleave", resume);
      }
    };
  }, [metrics, speed, direction, pauseOnHover]);

  const loopText = unit.repeat(metrics.reps);

  return (
    <div ref={rootRef} className={`text-loop ${className}`.trim()} style={style}>
      <svg
        className="text-loop-svg"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={text}
      >
        <path
          ref={pathRef}
          id={pathId}
          d={d}
          fill="none"
          stroke={ribbon ? ribbonColor : "none"}
          strokeWidth={ribbon ? ribbonWidth : 0}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <text ref={measureRef} className="text-loop-measure" style={textStyle} aria-hidden="true">
          {unit}
        </text>

        <text
          className="text-loop-text"
          style={textStyle}
          fill={color}
          dominantBaseline="central"
          aria-hidden="true"
        >
          <textPath ref={textPathRef} href={`#${pathId}`} startOffset={0}>
            {loopText}
          </textPath>
        </text>
      </svg>
    </div>
  );
}

export default TextLoop;
