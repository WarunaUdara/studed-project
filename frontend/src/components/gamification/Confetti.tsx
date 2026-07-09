import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const COLORS = ["#F59E0B", "#3B82F6", "#10B981", "#8B5CF6", "#EF4444", "#F97316"];

export interface ConfettiProps {
  show: boolean;
  count?: number;
}

export function Confetti({ show, count = 28 }: ConfettiProps) {
  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
          {Array.from({ length: count }).map((_, i) => {
            const left = Math.random() * 100;
            const delay = Math.random() * 0.25;
            const duration = 1.6 + Math.random() * 1.2;
            const color = COLORS[i % COLORS.length];
            const size = 6 + Math.random() * 6;
            const drift = (Math.random() - 0.5) * 120;
            return (
              <motion.div
                key={`confetti-${left}-${delay}-${duration}-${color}`}
                initial={{ top: "-5%", left: `${left}%`, opacity: 1, rotate: 0 }}
                animate={{
                  top: "110%",
                  left: `${left + drift / 8}%`,
                  opacity: 0,
                  rotate: 360 * (Math.random() > 0.5 ? 1 : -1) * 3,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration, delay, ease: "easeIn" }}
                className={cn("absolute rounded-[2px]")}
                style={{ width: size, height: size * 1.4, backgroundColor: color }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}
