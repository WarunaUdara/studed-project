import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useRef } from "react";
import { useReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface ShortCircuitSceneProps {
  /** Set false to show the same circuit calm, for a before/after comparison. */
  active?: boolean;
  className?: string;
}

/**
 * What a short circuit looks like: the current takes the shortcut wire straight
 * back to the battery, the bulb stays dark, and the shortcut wire heats up. The
 * heat pulse is a colour and width change rather than a flash, so it reads as a
 * warning without startling a young student.
 */
export function ShortCircuitScene({ active = true, className }: ShortCircuitSceneProps) {
  const containerRef = useRef<SVGSVGElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (!active || reducedMotion) return;
      const timeline = gsap.timeline({ repeat: -1, yoyo: true });
      timeline.to("[data-hot-wire]", {
        strokeWidth: 8,
        opacity: 1,
        duration: 0.9,
        ease: "sine.inOut",
      });
      return () => {
        timeline.kill();
      };
    },
    { scope: containerRef, dependencies: [active, reducedMotion] },
  );

  return (
    <svg
      ref={containerRef}
      viewBox="0 0 320 180"
      className={cn("w-full", className)}
      role="img"
      aria-label={
        active
          ? "A short circuit: current skips the bulb through a shortcut wire that heats up"
          : "A calm circuit with no shortcut wire"
      }
    >
      <title>{active ? "Short circuit warning" : "Circuit without a shortcut"}</title>

      <rect
        x={30}
        y={70}
        width={44}
        height={40}
        rx={8}
        className="fill-muted stroke-foreground/60"
        strokeWidth={2.5}
      />
      <text x={52} y={95} textAnchor="middle" className="fill-foreground text-[12px] font-semibold">
        Cell
      </text>

      <path
        d="M74 78 H150 V44 H246 V78"
        className="fill-none stroke-border"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <path
        d="M74 102 H150 V138 H246 V102"
        className="fill-none stroke-border"
        strokeWidth={3.5}
        strokeLinecap="round"
      />

      <circle
        cx={246}
        cy={90}
        r={18}
        className={active ? "fill-muted stroke-muted-foreground" : "fill-warning/30 stroke-warning"}
        strokeWidth={2.5}
      />
      <text x={246} y={130} textAnchor="middle" className="fill-muted-foreground text-[12px]">
        {active ? "Bulb stays dark" : "Bulb lights up"}
      </text>

      {active && (
        <path
          data-hot-wire
          d="M150 78 V102"
          className="fill-none stroke-destructive opacity-70"
          strokeWidth={4}
          strokeLinecap="round"
        />
      )}

      <text
        x={160}
        y={22}
        textAnchor="middle"
        className="fill-foreground text-[13px] font-semibold"
      >
        {active ? "Careful: this wire gets hot" : "Safe path through the bulb"}
      </text>
      {active && (
        <text
          x={160}
          y={168}
          textAnchor="middle"
          className="fill-destructive text-[12px] font-medium"
        >
          Current takes the shortcut and skips the bulb
        </text>
      )}
    </svg>
  );
}
