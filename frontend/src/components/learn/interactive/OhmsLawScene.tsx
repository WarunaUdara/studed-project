import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useRef } from "react";
import { useReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface OhmsLawSceneProps {
  /** Supply voltage in volts. */
  voltage: number;
  /** Circuit resistance in ohms. */
  resistance: number;
  className?: string;
}

/** Ohm's law. Zero resistance is treated as a short rather than infinity. */
export function currentFor(voltage: number, resistance: number): number {
  if (resistance <= 0) return Number.POSITIVE_INFINITY;
  return voltage / resistance;
}

/** Rounded reading for the ammeter face, in amperes. */
export function ammeterReading(voltage: number, resistance: number): string {
  const current = currentFor(voltage, resistance);
  if (!Number.isFinite(current)) return "over range";
  return `${current.toFixed(2)} A`;
}

const CHARGES = [0, 1, 2, 3, 4, 5, 6, 7];

/**
 * One loop, one meter. Changing the supply or the resistor moves the charges
 * and the needle together, so a student sees that current is not a thing you
 * set directly: it is what the other two leave you with.
 */
export function OhmsLawScene({ voltage, resistance, className }: OhmsLawSceneProps) {
  const containerRef = useRef<SVGSVGElement>(null);
  const reducedMotion = useReducedMotion();

  const current = currentFor(voltage, resistance);
  const finite = Number.isFinite(current) ? current : 12;

  useGSAP(
    () => {
      if (reducedMotion || finite <= 0) return;
      // Faster current, faster charges: the animation carries the number that
      // the meter shows, so the two never disagree.
      const duration = gsap.utils.clamp(0.9, 8, 9 / Math.max(finite, 0.25));
      const tweens = CHARGES.map((index) =>
        gsap.fromTo(
          `[data-charge="${index}"]`,
          { x: 0 },
          {
            x: 240,
            duration,
            repeat: -1,
            ease: "none",
            delay: (duration / CHARGES.length) * index,
          },
        ),
      );
      return () => {
        for (const tween of tweens) tween.kill();
      };
    },
    { scope: containerRef, dependencies: [finite, reducedMotion] },
  );

  const speedClass = finite > 3 ? "fast" : finite > 1 ? "steady" : "slow";

  return (
    <svg
      ref={containerRef}
      viewBox="0 0 360 190"
      className={cn("w-full", className)}
      role="img"
      aria-label={`A circuit at ${voltage} volts through ${resistance} ohms, reading ${ammeterReading(voltage, resistance)}`}
    >
      <title>Ohm's law circuit</title>

      {/* Loop */}
      <path
        d="M50 50 H310 V150 H50 Z"
        className="fill-none stroke-border"
        strokeWidth={4}
        strokeLinejoin="round"
      />

      {/* Cell */}
      <rect
        x={30}
        y={80}
        width={40}
        height={40}
        rx={6}
        className="fill-muted stroke-foreground/60"
        strokeWidth={2.5}
      />
      <text
        x={50}
        y={105}
        textAnchor="middle"
        className="fill-foreground text-[12px] font-semibold"
      >
        {voltage}V
      </text>

      {/* Resistor */}
      <rect
        x={150}
        y={36}
        width={70}
        height={28}
        rx={5}
        className="fill-warning/25 stroke-warning"
        strokeWidth={2.5}
      />
      <text
        x={185}
        y={55}
        textAnchor="middle"
        className="fill-foreground text-[12px] font-semibold"
      >
        {resistance} ohm
      </text>

      {/* Ammeter */}
      <circle cx={185} cy={150} r={24} className="fill-card stroke-info" strokeWidth={2.5} />
      <text x={185} y={148} textAnchor="middle" className="fill-foreground text-[11px] font-bold">
        A
      </text>
      <text x={185} y={162} textAnchor="middle" className="fill-muted-foreground text-[10px]">
        meter
      </text>

      {CHARGES.map((index) => (
        <circle
          key={index}
          data-charge={index}
          cx={56}
          cy={50}
          r={4}
          className={cn("fill-info", finite <= 0 && "opacity-20")}
        />
      ))}

      <text
        x={185}
        y={20}
        textAnchor="middle"
        className="fill-foreground text-[13px] font-semibold"
      >
        Current: {ammeterReading(voltage, resistance)}
      </text>
      <text x={185} y={182} textAnchor="middle" className="fill-muted-foreground text-[12px]">
        {finite <= 0 ? "No current flows" : `The charges move ${speedClass}`}
      </text>
    </svg>
  );
}
