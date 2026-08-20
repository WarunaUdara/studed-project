import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useRef } from "react";
import { useReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface WaterFlowSceneProps {
  /** Pump pressure, 0-10. Stands in for voltage. */
  voltage: number;
  /** Pipe narrowness, 0-10. Stands in for resistance. */
  resistance: number;
  className?: string;
}

/** Flow rate stands in for current: more pressure speeds it up, a narrower pipe slows it. */
export function flowRate(voltage: number, resistance: number): number {
  return voltage / (1 + Math.max(0, resistance) / 3);
}

const DROPS = [0, 1, 2, 3, 4, 5];

/**
 * The water-flow analogy for a circuit: the pump is the battery, the pipe is
 * the wire, and the drops moving through it are the current. Narrowing the pipe
 * visibly slows the drops without any numbers on screen.
 */
export function WaterFlowScene({ voltage, resistance, className }: WaterFlowSceneProps) {
  const containerRef = useRef<SVGSVGElement>(null);
  const reducedMotion = useReducedMotion();
  const rate = flowRate(voltage, resistance);
  const pipeHeight = gsapClamp(6, 26, 26 - resistance * 2);

  useGSAP(
    () => {
      if (reducedMotion || rate <= 0) return;
      const duration = gsap.utils.clamp(1.2, 6, 14 / Math.max(rate, 0.4));
      const tweens = DROPS.map((index) =>
        gsap.fromTo(
          `[data-drop="${index}"]`,
          { x: 0 },
          {
            x: 232,
            duration,
            ease: "none",
            repeat: -1,
            delay: (duration / DROPS.length) * index,
          },
        ),
      );
      return () => {
        for (const tween of tweens) tween.kill();
      };
    },
    { scope: containerRef, dependencies: [rate, reducedMotion] },
  );

  return (
    <svg
      ref={containerRef}
      viewBox="0 0 340 150"
      className={cn("w-full", className)}
      role="img"
      aria-label={`Water pump at pressure ${voltage} pushing water through a pipe with resistance ${resistance}`}
    >
      <title>Water flow analogy for an electric circuit</title>

      <rect
        x={22}
        y={44}
        width={54}
        height={62}
        rx={10}
        className="fill-info/15 stroke-info"
        strokeWidth={2.5}
      />
      <text x={49} y={80} textAnchor="middle" className="fill-foreground text-[12px] font-semibold">
        Pump
      </text>
      <text x={49} y={124} textAnchor="middle" className="fill-muted-foreground text-[12px]">
        Battery
      </text>

      <rect
        x={78}
        y={75 - pipeHeight / 2}
        width={240}
        height={pipeHeight}
        rx={pipeHeight / 2}
        className="fill-info/10 stroke-info/50"
        strokeWidth={2}
      />

      {DROPS.map((index) => (
        <circle
          key={index}
          data-drop={index}
          cx={86}
          cy={75}
          r={Math.min(5, pipeHeight / 2 - 1)}
          className="fill-info"
        />
      ))}

      <text
        x={198}
        y={35}
        textAnchor="middle"
        className="fill-foreground text-[13px] font-semibold"
      >
        {rate > 4
          ? "Water rushes through"
          : rate > 1.5
            ? "Water flows steadily"
            : "Barely a trickle"}
      </text>
      <text x={198} y={124} textAnchor="middle" className="fill-muted-foreground text-[12px]">
        Narrow pipe = more resistance
      </text>
    </svg>
  );
}

function gsapClamp(min: number, max: number, value: number): number {
  return Math.min(max, Math.max(min, value));
}
