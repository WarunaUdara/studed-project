import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { Medal, Zap } from "lucide-react";
import { useState } from "react";
import { Confetti } from "@/components/gamification/Confetti";
import { usePublicI18n } from "@/lib/i18n";
import { playLevelUpSound } from "@/lib/sounds";

/**
 * ScrollXpMeter — the landing page itself is a wave. Scrolling the page earns
 * "Explorer XP" (up to 250); reaching the bottom unlocks the Explorer badge
 * with a level-up chime and confetti. XP is monotonic — once earned, it is
 * never taken away. A quiet proof of the product promise: progress you can feel.
 */

const MAX_XP = 250;

export function ScrollXpMeter() {
  const { t } = usePublicI18n();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [awarded, setAwarded] = useState(false);
  const [confetti, setConfetti] = useState(false);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setVisible(v > 0.02);
    // Monotonic: keep the furthest point reached, never drain on scroll-up.
    setProgress((prev) => Math.max(prev, Math.min(1, v)));
    if (v >= 0.985) {
      setAwarded((prev) => {
        if (prev) return prev;
        playLevelUpSound();
        if (!reduce) {
          setConfetti(true);
          setTimeout(() => setConfetti(false), 2400);
        }
        return true;
      });
    }
  });

  const xp = Math.round(progress * MAX_XP);

  return (
    <>
      <Confetti show={confetti} count={30} />
      <AnimatePresence>
        {visible && (
          <motion.aside
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="fixed bottom-3 right-3 z-40 w-44 sm:bottom-4 sm:right-4 sm:w-64"
            aria-live="polite"
          >
            <div className="glass rounded-2xl p-3 shadow-lg sm:p-3.5">
              <div className="flex items-center gap-2">
                <span
                  className={
                    awarded
                      ? "flex h-7 w-7 items-center justify-center rounded-full bg-gold text-white shadow-md shadow-gold/30"
                      : "flex h-7 w-7 items-center justify-center rounded-full bg-gold/15 text-gold ring-1 ring-gold/30"
                  }
                >
                  {awarded ? (
                    <Medal className="h-4 w-4" />
                  ) : (
                    <Zap className="h-4 w-4 fill-gold text-gold" />
                  )}
                </span>
                <span className="text-xs font-semibold text-foreground">{t("explorerLabel")}</span>
                <span className="ml-auto text-sm font-extrabold tabular-nums text-foreground">
                  {xp}
                  <span className="text-[10px] font-medium text-muted-foreground"> / {MAX_XP}</span>
                </span>
              </div>

              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full origin-left rounded-full bg-gradient-to-r from-gold to-orange"
                  animate={{ scaleX: awarded ? 1 : progress }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                />
              </div>

              <p className="mt-2 hidden text-[11px] leading-snug text-muted-foreground sm:block">
                {awarded ? (
                  <>
                    <span className="font-semibold text-gold">{t("explorerUnlocked")}</span> —{" "}
                    {t("explorerUnlockedBody")}
                  </>
                ) : (
                  t("explorerHint")
                )}
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
