import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  /** Format with thousands separators. */
  format?: boolean;
  className?: string;
}

/**
 * CountUp — animates a number from `from` to `to` when it scrolls into view.
 * Honours prefers-reduced-motion by rendering the final value immediately.
 */
export function CountUp({
  to,
  from = 0,
  duration = 1.2,
  prefix = "",
  suffix = "",
  format = true,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const mv = useMotionValue(reduce ? to : from);
  const rounded = useTransform(mv, (v) => {
    const n = Math.round(v);
    return `${prefix}${format ? n.toLocaleString() : n}${suffix}`;
  });

  useEffect(() => {
    if (!inView || reduce) {
      mv.set(to);
      return;
    }
    const controls = animate(mv, to, { duration, ease: "easeOut" });
    return controls.stop;
  }, [inView, reduce, mv, to, duration]);

  return (
    <span ref={ref} className={className}>
      <motion.span>{rounded}</motion.span>
    </span>
  );
}
