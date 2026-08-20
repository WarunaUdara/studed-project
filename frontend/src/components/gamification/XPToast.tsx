import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Zap } from "lucide-react";
import { prefersReducedMotion } from "@/lib/motion";

export interface XPToastProps {
  amount: number;
  show: boolean;
  onDismiss: () => void;
  duration?: number;
}

export function XPToast({ amount, show, onDismiss, duration = 2600 }: XPToastProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show || amount <= 0) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [show, amount, duration, onDismiss]);

  useEffect(() => {
    if (!show || amount <= 0 || !ref.current) return;
    const el = ref.current;
    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, y: 0, scale: 1 });
      return;
    }
    const tweens = [
      gsap.fromTo(
        el,
        { opacity: 0, y: -24, scale: 0.6 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.4)" },
      ),
      gsap.to(el, {
        opacity: 0,
        y: -16,
        scale: 0.9,
        delay: duration / 1000 - 0.2,
        duration: 0.2,
        ease: "power2.in",
      }),
    ];
    return () => {
      tweens.forEach((t) => {
        t.kill();
      });
    };
  }, [show, amount, duration]);

  if (!show || amount <= 0) return null;

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed left-1/2 top-24 z-50 -translate-x-1/2"
      role="status"
      aria-live="assertive"
    >
      <div className="flex items-center gap-2 rounded-full border border-gold/30 bg-gradient-to-r from-gold to-orange px-5 py-2.5 shadow-lg shadow-gold/30">
        <Zap className="h-5 w-5 fill-white text-white" />
        <span className="text-base font-extrabold text-white drop-shadow">+{amount} XP</span>
      </div>
    </div>
  );
}