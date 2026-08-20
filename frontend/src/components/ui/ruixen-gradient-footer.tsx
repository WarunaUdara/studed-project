"use client";

// Ruixen Gradient Footer — a normal footer that sits at the bottom of the page.
// Its content reads first; the blurred rainbow is pinned to the bottom of the
// viewport and stretches up from the floor over the last stretch of scroll,
// hitting full height exactly when you reach the end of the page.
// One inline <svg> — no canvas, no giant scroll spacer.
//
// Gradient design inspired by Dia Browser — https://www.diabrowser.com

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export type Stop = { offset: number; color: string };

const VBW = 1271;
const VBH = 599;

// Ruixen's stops, floor (0) → top (1): dark ember → blue → near-white → yellow
// → red-orange → magenta → transparent pink.
export const RUIXEN_STOPS: Stop[] = [
  { offset: 0, color: "#340B05" },
  { offset: 0.1827, color: "#0358F7" },
  { offset: 0.2837, color: "#5092C7" },
  { offset: 0.4135, color: "#E1ECFE" },
  { offset: 0.5866, color: "#FFD400" },
  { offset: 0.6827, color: "#FA3D1D" },
  { offset: 0.8029, color: "#FD02F5" },
  { offset: 1, color: "#FFC0FD00" },
];

// StudEd harmonious palette stops, floor (0) → top (1):
// Deep forest floor → Emerald primary → Mint → Science cyan → Blue → Gold → Magenta → Transparent fade
export const STUDED_GRADIENT_STOPS: Stop[] = [
  { offset: 0, color: "#062419" },
  { offset: 0.18, color: "#047857" },
  { offset: 0.32, color: "#059669" },
  { offset: 0.48, color: "#10b981" },
  { offset: 0.62, color: "#06b6d4" },
  { offset: 0.76, color: "#3b82f6" },
  { offset: 0.88, color: "#f59e0b" },
  { offset: 0.96, color: "#ec4899" },
  { offset: 1, color: "#10b98100" },
];

// Height curve: a gentle power falloff, giving the flatter, pyramid-like rise of
// the original footer (short edges, tallest middle).
function bellHeights(n: number, peak: number, valley: number): number[] {
  const out: number[] = [];
  const mid = (n - 1) / 2;
  for (let i = 0; i < n; i++) {
    const t = mid === 0 ? 0 : Math.abs(i - mid) / mid; // 0 center → 1 edge
    const eased = 1 - Math.pow(t, 1.24);
    out.push(peak * VBH * (valley + (1 - valley) * eased));
  }
  return out;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export interface RuixenGradientFooterProps {
  /** Footer content — links, wordmark, copyright — shown above the glow. */
  children?: ReactNode;
  /**
   * Height of the glow band pinned to the viewport bottom. Doubles as the
   * scroll distance the reveal takes, and the room reserved under the content.
   */
  gradientHeight?: string;
  /**
   * Resting height of the glow, as a fraction of the band before scroll reveal.
   * `0` keeps it completely hidden until the final scroll into the footer.
   */
  minReveal?: number;
  /** Number of blurred columns. */
  bars?: number;
  /** Blur in viewBox units. */
  blur?: number;
  /** Peak height as a fraction of the viewBox. */
  peak?: number;
  /** Edge height as a fraction of the peak (0..1). */
  valley?: number;
  /** Vertical rainbow gradient stops, floor (0) → top (1). */
  stops?: Stop[];
  className?: string;
  style?: CSSProperties;
}

export function RuixenGradientFooter({
  children,
  gradientHeight = "65vh",
  minReveal = 0,
  bars = 9,
  blur = 15,
  peak = 0.98,
  valley = 0.55,
  stops = RUIXEN_STOPS,
  className,
  style,
}: RuixenGradientFooterProps) {
  const uid = useId().replace(/:/g, "");
  const bandRef = useRef<HTMLDivElement>(null);
  // minReveal = 0 keeps it completely hidden on upper sections, 1 = risen to full height at bottom.
  const [progress, setProgress] = useState(minReveal);

  useEffect(() => {
    const el = bandRef.current;
    if (!el) return;
    // Bind to the element's OWN window so this tracks the right scroll context
    // on a real page and inside the docs preview iframe alike.
    const doc = el.ownerDocument;
    const win = doc.defaultView ?? window;

    const measure = () => {
      // offsetHeight ignores the transform, so the band can measure itself.
      const h = el.offsetHeight || 1;
      // How much scroll is left before the exact end of the page.
      const left =
        doc.documentElement.scrollHeight - win.innerHeight - win.scrollY;

      if (left <= h) {
        // Glow starts rising once within its own height, reaching 1 at rock bottom.
        const t = clamp01((h - left) / h);
        setProgress(minReveal + (1 - minReveal) * t);
      } else {
        // Completely hidden on top & middle page sections
        setProgress(0);
      }
    };

    measure();
    win.addEventListener("scroll", measure, { passive: true });
    win.addEventListener("resize", measure, { passive: true });
    return () => {
      win.removeEventListener("scroll", measure);
      win.removeEventListener("resize", measure);
    };
  }, [minReveal]);

  const colW = VBW / bars;
  const isVisible = progress > 0.001;

  return (
    // The glow is pinned to the viewport, so the footer reserves the same
    // height beneath its content for the glow to land in.
    <footer
      className={cn("relative z-10", className)}
      style={{ paddingBottom: gradientHeight, ...style }}
    >
      <div className="relative z-10">{children}</div>

      {/* Glow pinned to the bottom of the viewport — freely rising across the viewport as you hit page bottom */}
      <div
        ref={bandRef}
        aria-hidden
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          height: gradientHeight,
          pointerEvents: "none",
          transformOrigin: "bottom",
          transform: `scaleY(${progress})`,
          opacity: isVisible ? 1 : 0,
          visibility: isVisible ? "visible" : "hidden",
          transition: "opacity 0.2s ease-out, visibility 0.2s",
          willChange: "transform, opacity",
          zIndex: 0,
        }}
      >
        <svg
          style={{ height: "100%", width: "100%", display: "block" }}
          viewBox={`0 0 ${VBW} ${VBH}`}
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`grad-${uid}`} x1="0" y1="1" x2="0" y2="0">
              {stops.map((s, i) => (
                <stop key={i} offset={s.offset} stopColor={s.color} />
              ))}
            </linearGradient>
            <filter
              id={`blur-${uid}`}
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation={blur} />
            </filter>
          </defs>
          {bellHeights(bars, peak, valley).map((barH, i) => (
            <g key={i} filter={`url(#blur-${uid})`}>
              <rect
                x={i * colW}
                y={VBH - barH}
                width={colW * 1.23}
                height={barH}
                fill={`url(#grad-${uid})`}
              />
            </g>
          ))}
        </svg>
      </div>
    </footer>
  );
}
