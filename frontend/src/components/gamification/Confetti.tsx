import { useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/lib/motion";

const COLORS = [
  "oklch(0.76 0.18 75)",
  "oklch(0.55 0.22 264)",
  "oklch(0.64 0.18 145)",
  "oklch(0.58 0.24 290)",
  "oklch(0.58 0.22 25)",
  "oklch(0.7 0.19 50)",
];

export interface ConfettiProps {
  show: boolean;
  count?: number;
}

interface ConfettiPiece {
  id: number;
  left: number;
  size: number;
  color: string;
}

export function Confetti({ show, count = 28 }: ConfettiProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pieces = useMemo<ConfettiPiece[]>(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 6 + Math.random() * 6,
        color: COLORS[i % COLORS.length],
      })),
    [count],
  );

  useEffect(() => {
    if (!show || !rootRef.current) return;
    if (prefersReducedMotion()) return;
    const root = rootRef.current;
    const nodes = root.querySelectorAll<HTMLElement>("[data-confetti]");
    const tweens = Array.from(nodes).map((el) => {
      const duration = 1.6 + Math.random() * 1.2;
      const delay = Math.random() * 0.25;
      const drift = (Math.random() - 0.5) * 120;
      const spin = 360 * (Math.random() > 0.5 ? 1 : -1) * 3;
      return gsap.to(el, {
        top: "110%",
        left: `${drift / 8}%`,
        opacity: 0,
        rotate: spin,
        duration,
        delay,
        ease: "easeIn",
      });
    });
    return () => {
      tweens.forEach((t) => {
        t.kill();
      });
    };
  }, [show]);

  if (!show) return null;

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden
    >
      {pieces.map((piece) => (
        <span
          key={piece.id}
          data-confetti
          className={cn("absolute rounded-[2px]")}
          style={{
            top: "-5%",
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.size * 1.4,
            backgroundColor: piece.color,
            opacity: 1,
          }}
        />
      ))}
    </div>
  );
}
