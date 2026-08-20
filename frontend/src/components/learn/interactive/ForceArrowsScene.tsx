import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useRef } from "react";
import { useReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface ForceArrowsSceneProps {
  /** Applied push, 0-10. Drives the green arrow and the acceleration. */
  push: number;
  /** Surface resistance, 0-1. Drives the amber arrow pushing back. */
  friction: number;
  /** Name of the object being pushed, shown under the cart. */
  label?: string;
  className?: string;
}

const TRACK_START = 40;
const TRACK_END = 330;
const CART_WIDTH = 74;

/** Net force after friction eats into the push. Never negative. */
export function netForce(push: number, friction: number): number {
  return Math.max(0, push - push * clamp01(friction));
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Force arrows over a cart on a surface. The cart accelerates: it eases in
 * rather than moving at a constant speed, so the arrow length and the change in
 * speed tell the same story. A net force of zero leaves the cart parked, which
 * is the point of the friction slider.
 */
export function ForceArrowsScene({ push, friction, label, className }: ForceArrowsSceneProps) {
  const cartRef = useRef<SVGGElement>(null);
  const containerRef = useRef<SVGSVGElement>(null);
  const reducedMotion = useReducedMotion();

  const net = netForce(push, friction);
  const pushLength = push * 9;
  const frictionLength = push * clamp01(friction) * 9;
  const travel = TRACK_END - TRACK_START - CART_WIDTH;

  useGSAP(
    () => {
      const cart = cartRef.current;
      if (!cart) return;

      gsap.set(cart, { x: 0 });
      if (net <= 0 || reducedMotion) return;

      // Stronger net force covers the track faster; easing "power2.in" reads as
      // speeding up, which is the difference between force and speed for a child.
      const duration = gsap.utils.clamp(1.1, 4, 9 / net);
      const timeline = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });
      timeline.to(cart, { x: travel, duration, ease: "power2.in" });
      timeline.to(cart, { x: 0, duration: 0.45, ease: "none", delay: 0.35 });
      return () => {
        timeline.kill();
      };
    },
    { scope: containerRef, dependencies: [net, reducedMotion, travel] },
  );

  return (
    <svg
      ref={containerRef}
      viewBox="0 0 380 170"
      className={cn("w-full", className)}
      role="img"
      aria-label={
        net > 0
          ? `A cart being pushed with force ${push} newtons against friction, speeding up`
          : "A cart standing still because friction cancels the push"
      }
    >
      <title>Force arrows on a moving cart</title>

      <line
        x1={TRACK_START - 12}
        y1={124}
        x2={TRACK_END + 12}
        y2={124}
        className="stroke-border"
        strokeWidth={3}
        strokeLinecap="round"
      />

      <g ref={cartRef}>
        <rect
          x={TRACK_START}
          y={82}
          width={CART_WIDTH}
          height={34}
          rx={8}
          className="fill-primary/20 stroke-primary"
          strokeWidth={2.5}
        />
        <circle
          cx={TRACK_START + 18}
          cy={120}
          r={9}
          className="fill-card stroke-primary"
          strokeWidth={2.5}
        />
        <circle
          cx={TRACK_START + CART_WIDTH - 18}
          cy={120}
          r={9}
          className="fill-card stroke-primary"
          strokeWidth={2.5}
        />

        {pushLength > 2 && (
          <g className="stroke-success fill-success">
            <line
              x1={TRACK_START - 6}
              y1={99}
              x2={TRACK_START - 6 - pushLength}
              y2={99}
              strokeWidth={4}
              strokeLinecap="round"
            />
            <polygon
              points={`${TRACK_START - 4},99 ${TRACK_START - 16},93 ${TRACK_START - 16},105`}
              stroke="none"
            />
          </g>
        )}

        {frictionLength > 2 && (
          <g className="stroke-warning fill-warning">
            <line
              x1={TRACK_START + CART_WIDTH + 6}
              y1={99}
              x2={TRACK_START + CART_WIDTH + 6 + frictionLength}
              y2={99}
              strokeWidth={4}
              strokeLinecap="round"
            />
            <polygon
              points={`${TRACK_START + CART_WIDTH + 4},99 ${TRACK_START + CART_WIDTH + 16},93 ${TRACK_START + CART_WIDTH + 16},105`}
              stroke="none"
            />
          </g>
        )}
      </g>

      <text x={190} y={150} textAnchor="middle" className="fill-muted-foreground text-[13px]">
        {label ?? "Toy cart"}
      </text>
      <text
        x={190}
        y={32}
        textAnchor="middle"
        className="fill-foreground text-[13px] font-semibold"
      >
        {net > 0 ? `Net push: ${net.toFixed(1)} N` : "Net push: 0 N — it stays put"}
      </text>
    </svg>
  );
}
