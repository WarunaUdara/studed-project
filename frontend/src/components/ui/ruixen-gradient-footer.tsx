"use client";

// Ruixen Gradient Footer — a normal footer that sits at the bottom of the page.
// The blurred ambient glow is confined to the footer container and rises smoothly
// from the bottom as the user scrolls into the footer.
// Zero viewport obstruction while scrolling upper sections.
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

// StudEd harmonious palette stops, floor (0) → top (1):
// Deep forest floor → Emerald primary → Mint → Science cyan → Blue → Gold → Purple shimmer → Transparent fade
export const STUDED_GRADIENT_STOPS: Stop[] = [
  { offset: 0, color: "#022c22" },
  { offset: 0.18, color: "#065f46" },
  { offset: 0.34, color: "#059669" },
  { offset: 0.50, color: "#10b981" },
  { offset: 0.65, color: "#06b6d4" },
  { offset: 0.78, color: "#3b82f6" },
  { offset: 0.88, color: "#f59e0b" },
  { offset: 0.95, color: "#8b5cf6" },
  { offset: 1, color: "#10b98100" },
];

export const RUIXEN_STOPS: Stop[] = STUDED_GRADIENT_STOPS;

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
  /** Height of the glow band inside the footer. */
  gradientHeight?: string;
  /**
   * Resting height of the glow, as a fraction of the band before scroll reveal.
   * Default is `0` so nothing shows on upper sections.
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
  /** Vertical gradient stops, floor (0) → top (1). */
  stops?: Stop[];
  className?: string;
  style?: CSSProperties;
}

export function RuixenGradientFooter({
  children,
  gradientHeight = "48vh",
  minReveal = 0,
  bars = 9,
  blur = 18,
  peak = 0.98,
  valley = 0.55,
  stops = STUDED_GRADIENT_STOPS,
  className,
  style,
}: RuixenGradientFooterProps) {
  const uid = useId().replace(/:/g, "");
  const footerRef = useRef<HTMLElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(minReveal);

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    const doc = el.ownerDocument;
    const win = doc.defaultView ?? window;

    const measure = () => {
      // Calculate how close the scroll position is to the bottom of the page
      const docHeight = doc.documentElement.scrollHeight;
      const winHeight = win.innerHeight;
      const scrollY = win.scrollY;
      const remainingScroll = docHeight - (scrollY + winHeight);

      // Trigger distance: starts animating when the user is within 500px of page bottom
      const triggerDistance = Math.min(el.offsetHeight + 120, winHeight * 0.9);

      if (remainingScroll <= triggerDistance) {
        const t = clamp01((triggerDistance - remainingScroll) / triggerDistance);
        setProgress(minReveal + (1 - minReveal) * t);
      } else {
        setProgress(minReveal);
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

  return (
    <footer
      ref={footerRef}
      className={cn("relative overflow-hidden", className)}
      style={style}
    >
      {/* Content reads on top */}
      <div className="relative z-10">{children}</div>

      {/* Confined to the footer bottom — zero viewport bleed on top sections */}
      <div
        ref={bandRef}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 select-none"
        style={{
          height: gradientHeight,
          transformOrigin: "bottom",
          transform: `scaleY(${progress})`,
          opacity: progress > 0.01 ? Math.min(1, progress * 1.4) : 0,
          transition: "opacity 0.25s ease-out",
          willChange: "transform, opacity",
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
