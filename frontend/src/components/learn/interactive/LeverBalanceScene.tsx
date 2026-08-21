import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useRef } from "react";
import { useReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface LeverLoad {
  /** Notch index, negative on the left of the pivot, positive on the right. */
  position: number;
  /** Weight in newtons. */
  weight: number;
}

export interface LeverBalanceSceneProps {
  left: LeverLoad | null;
  right: LeverLoad | null;
  /** Notches available on each side of the pivot. */
  notches: number;
  className?: string;
}

/** Turning effect of one load: how heavy it is times how far out it sits. */
export function moment(load: LeverLoad | null): number {
  if (!load) return 0;
  return load.weight * Math.abs(load.position);
}

/**
 * Beam tilt in degrees. Capped so a wildly unbalanced beam still reads as a
 * beam rather than a vertical line.
 */
export function tiltAngle(left: LeverLoad | null, right: LeverLoad | null): number {
  const difference = moment(right) - moment(left);
  if (difference === 0) return 0;
  const scaled = Math.sign(difference) * Math.min(14, Math.abs(difference) / 4);
  return Number(scaled.toFixed(2));
}

const BEAM_LENGTH = 300;
const PIVOT_X = 180;
const BEAM_Y = 90;

/**
 * A see-saw the student loads. The beam tilts towards the bigger turning
 * effect, so "heavier" and "further out" become visibly interchangeable before
 * the formula ever appears.
 */
export function LeverBalanceScene({ left, right, notches, className }: LeverBalanceSceneProps) {
  const containerRef = useRef<SVGSVGElement>(null);
  const beamRef = useRef<SVGGElement>(null);
  const reducedMotion = useReducedMotion();

  const angle = tiltAngle(left, right);
  const spacing = BEAM_LENGTH / 2 / Math.max(1, notches);

  useGSAP(
    () => {
      if (!beamRef.current) return;
      if (reducedMotion) {
        gsap.set(beamRef.current, { rotation: angle, transformOrigin: `${PIVOT_X}px ${BEAM_Y}px` });
        return;
      }
      gsap.to(beamRef.current, {
        rotation: angle,
        transformOrigin: `${PIVOT_X}px ${BEAM_Y}px`,
        duration: 0.6,
        ease: "elastic.out(1, 0.6)",
      });
    },
    { scope: containerRef, dependencies: [angle, reducedMotion] },
  );

  const loadX = (load: LeverLoad) => PIVOT_X + load.position * spacing;

  return (
    <svg
      ref={containerRef}
      viewBox="0 0 360 170"
      className={cn("w-full", className)}
      role="img"
      aria-label={
        angle === 0
          ? "A balanced see-saw"
          : `A see-saw tipping ${angle > 0 ? "to the right" : "to the left"}`
      }
    >
      <title>Lever balance</title>

      <g ref={beamRef}>
        <rect
          x={PIVOT_X - BEAM_LENGTH / 2}
          y={BEAM_Y - 5}
          width={BEAM_LENGTH}
          height={10}
          rx={5}
          className="fill-primary/30 stroke-primary"
          strokeWidth={2}
        />

        {Array.from({ length: notches * 2 + 1 }, (_, index) => index - notches)
          .filter((notch) => notch !== 0)
          .map((notch) => (
            <circle
              key={notch}
              cx={PIVOT_X + notch * spacing}
              cy={BEAM_Y}
              r={2.5}
              className="fill-muted-foreground"
            />
          ))}

        {[left, right].map((load, index) =>
          load ? (
            <g key={index === 0 ? "left-load" : "right-load"}>
              <rect
                x={loadX(load) - 14}
                y={BEAM_Y - 34}
                width={28}
                height={28}
                rx={6}
                className="fill-warning/40 stroke-warning"
                strokeWidth={2}
              />
              <text
                x={loadX(load)}
                y={BEAM_Y - 14}
                textAnchor="middle"
                className="fill-foreground text-[12px] font-bold"
              >
                {load.weight}
              </text>
            </g>
          ) : null,
        )}
      </g>

      <polygon
        points={`${PIVOT_X},${BEAM_Y + 4} ${PIVOT_X - 22},${BEAM_Y + 48} ${PIVOT_X + 22},${BEAM_Y + 48}`}
        className="fill-muted stroke-foreground/50"
        strokeWidth={2}
      />
      <line
        x1={PIVOT_X - 60}
        y1={BEAM_Y + 48}
        x2={PIVOT_X + 60}
        y2={BEAM_Y + 48}
        className="stroke-border"
        strokeWidth={3}
        strokeLinecap="round"
      />

      <text
        x={180}
        y={26}
        textAnchor="middle"
        className="fill-foreground text-[13px] font-semibold"
      >
        {angle === 0 && (left || right)
          ? "Balanced"
          : angle === 0
            ? "Put a weight on each side"
            : `Tipping ${angle > 0 ? "right" : "left"}`}
      </text>
      <text x={180} y={162} textAnchor="middle" className="fill-muted-foreground text-[12px]">
        Left turning effect {moment(left)} · Right turning effect {moment(right)}
      </text>
    </svg>
  );
}
