import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useRef } from "react";
import { useReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface FractionBarSceneProps {
  /** How many equal parts the bar is cut into. */
  parts: number;
  /** How many of those parts are shaded. */
  shaded: number;
  label?: string;
  className?: string;
}

const BAR_X = 20;
const BAR_Y = 40;
const BAR_WIDTH = 320;
const BAR_HEIGHT = 60;

/** Reduces a fraction so 2/4 reads back as 1/2, the way a teacher would say it. */
export function simplifyFraction(numerator: number, denominator: number): [number, number] {
  // Nothing shaded stays "0 out of n"; collapsing it to 0/1 would tell a child
  // the bar changed shape when it did not.
  if (denominator === 0 || numerator === 0) return [numerator, denominator];
  const divide = (a: number, b: number): number => (b === 0 ? a : divide(b, a % b));
  const factor = Math.abs(divide(numerator, denominator)) || 1;
  return [numerator / factor, denominator / factor];
}

/**
 * A bar cut into equal parts, with some of them shaded. Splitting and shading
 * are the two things a fraction actually is, so the picture carries the whole
 * idea before any notation appears.
 */
export function FractionBarScene({ parts, shaded, label, className }: FractionBarSceneProps) {
  const containerRef = useRef<SVGSVGElement>(null);
  const reducedMotion = useReducedMotion();

  const safeParts = Math.max(1, Math.round(parts));
  const safeShaded = Math.min(safeParts, Math.max(0, Math.round(shaded)));
  const partWidth = BAR_WIDTH / safeParts;
  // Left edge of each piece, which doubles as a stable key: the pieces are
  // identical, so their position is the only identity they have.
  const partOffsets = Array.from({ length: safeParts }, (_, index) => BAR_X + index * partWidth);
  const [simpleTop, simpleBottom] = simplifyFraction(safeShaded, safeParts);
  const isSimpler = simpleBottom !== safeParts && safeShaded > 0;

  useGSAP(
    () => {
      if (reducedMotion) return;
      gsap.fromTo(
        "[data-shaded-part]",
        { scaleY: 0.7, opacity: 0.4, transformOrigin: "center bottom" },
        { scaleY: 1, opacity: 1, duration: 0.28, ease: "back.out(1.7)", stagger: 0.05 },
      );
    },
    { scope: containerRef, dependencies: [safeParts, safeShaded, reducedMotion] },
  );

  return (
    <svg
      ref={containerRef}
      viewBox="0 0 360 150"
      className={cn("w-full", className)}
      role="img"
      aria-label={`A bar cut into ${safeParts} equal parts with ${safeShaded} shaded`}
    >
      <title>Fraction bar</title>

      {partOffsets.map((offset, index) => (
        <rect
          key={offset}
          data-shaded-part={index < safeShaded ? "" : undefined}
          x={offset}
          y={BAR_Y}
          width={partWidth}
          height={BAR_HEIGHT}
          strokeWidth={2}
          className={cn("stroke-border", index < safeShaded ? "fill-primary/45" : "fill-muted/40")}
        />
      ))}

      <text
        x={180}
        y={26}
        textAnchor="middle"
        className="fill-foreground text-[13px] font-semibold"
      >
        {label ?? `${safeShaded} out of ${safeParts} parts shaded`}
      </text>
      <text x={180} y={128} textAnchor="middle" className="fill-foreground text-[15px] font-bold">
        {safeShaded}/{safeParts}
        {isSimpler ? ` is the same as ${simpleTop}/${simpleBottom}` : ""}
      </text>
    </svg>
  );
}
