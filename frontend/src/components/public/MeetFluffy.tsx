import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, MessageSquare, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { usePublicI18n } from "@/lib/i18n";
import { playSuccessSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface MeetFluffyProps {
  authed: boolean;
  className?: string;
}

const TIPS = [
  { key: "fluffyTip1", icon: Wand2 },
  { key: "fluffyTip2", icon: MessageSquare },
  { key: "fluffyTip3", icon: Sparkles },
] as const;

export function MeetFluffy({ authed, className }: MeetFluffyProps) {
  const { t } = usePublicI18n();
  const reduce = useReducedMotion();
  const [tipIndex, setTipIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Cycle speech bubble tips every 4 seconds
  useEffect(() => {
    if (reduce) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [reduce]);

  const activeTip = TIPS[tipIndex];
  const TipIcon = activeTip.icon;

  const handleMascotClick = () => {
    playSuccessSound();
    setTipIndex((prev) => (prev + 1) % TIPS.length);
  };

  return (
    <section className={cn("relative overflow-hidden px-4 py-8 sm:px-6 lg:py-12", className)}>
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[28px] sm:rounded-[32px] border border-border/80 bg-gradient-to-br from-card via-card/90 to-primary/5 p-6 sm:p-8 lg:p-10 shadow-sm hover:shadow-md transition-shadow">
          {/* Subtle ambient glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-primary/10 blur-2xl"
          />

          <div className="grid items-center gap-6 lg:grid-cols-12 lg:gap-10">
            {/* Left Column: Copy, Quick Pills, CTA */}
            <div className="flex flex-col items-start gap-4 lg:col-span-7">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" />
                <span>{t("fluffyBadge")}</span>
              </div>

              {/* Title */}
              <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl text-balance">
                {t("fluffyTitle")}
              </h2>

              {/* Subhead */}
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t("fluffySubhead")}
              </p>

              {/* Sleek inline feature tags */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {[t("fluffyFeature1"), t("fluffyFeature2"), t("fluffyFeature3")].map((feat) => (
                  <div
                    key={feat}
                    className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-foreground/90 shadow-2xs backdrop-blur-xs"
                  >
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500 stroke-[2.5]" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className="pt-2">
                <Button
                  asChild
                  className="rounded-full px-6 text-sm font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
                  onClick={() => playSuccessSound()}
                >
                  <Link to={authed ? "/dashboard" : "/register"}>{t("fluffyCta")}</Link>
                </Button>
              </div>
            </div>

            {/* Right Column: Compact Mascot Art Composition */}
            <div className="relative flex items-center justify-center lg:col-span-5">
              <div
                className="relative flex h-[220px] sm:h-[240px] w-full max-w-[340px] items-center justify-center cursor-pointer select-none"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleMascotClick}
              >
                {/* 1. Concentric Orbit Rings */}
                <svg
                  className="absolute inset-0 h-full w-full pointer-events-none"
                  viewBox="0 0 340 240"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <g className="text-foreground/25 dark:text-foreground/20">
                    <ellipse
                      cx="170"
                      cy="120"
                      rx="135"
                      ry="36"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                      className="opacity-75"
                    />
                    <ellipse
                      cx="170"
                      cy="132"
                      rx="150"
                      ry="40"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <ellipse
                      cx="170"
                      cy="144"
                      rx="130"
                      ry="34"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="opacity-80"
                    />
                  </g>
                </svg>

                {/* 2. Rotating 12-Point Starburst */}
                <motion.svg
                  className="absolute -right-1 top-2 h-18 w-18 sm:h-22 sm:w-22 text-foreground/35 dark:text-foreground/25 pointer-events-none"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  animate={{ rotate: reduce ? 0 : 360 }}
                  transition={{ duration: 45, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  aria-hidden
                >
                  <polygon
                    points="50,0 58,35 93,18 73,48 100,50 73,52 93,82 58,65 50,100 42,65 7,82 27,52 0,50 27,48 7,18 42,35"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                  />
                </motion.svg>

                {/* 3. Lower-Right Soft Star */}
                <motion.svg
                  className="absolute right-3 bottom-6 h-14 w-14 text-muted-foreground/30 pointer-events-none"
                  viewBox="0 0 100 100"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  aria-hidden
                >
                  <polygon points="50,5 60,38 95,50 60,62 50,95 40,62 5,50 40,38" />
                </motion.svg>

                {/* 4. Glowing Lime 4-Point Star Accent */}
                <motion.svg
                  className="absolute bottom-2 left-1/3 z-20 h-12 w-12 text-lime-400 drop-shadow-[0_2px_12px_rgba(163,230,53,0.45)] pointer-events-none"
                  viewBox="0 0 100 100"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  animate={{
                    y: reduce ? 0 : [0, -5, 0],
                    rotate: reduce ? 0 : [0, 4, -4, 0],
                  }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  aria-hidden
                >
                  <path d="M50 0 C50 35 65 50 100 50 C65 50 50 65 50 100 C50 65 35 50 0 50 C35 50 50 35 50 0 Z" />
                </motion.svg>

                {/* 5. Mascot (Fluffy) */}
                <motion.div
                  className="relative z-10 flex items-center justify-center"
                  animate={{
                    y: reduce ? 0 : isHovered ? -8 : [0, -6, 0],
                    scale: isHovered ? 1.04 : 1,
                  }}
                  transition={{
                    y: { duration: 3.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
                    scale: { duration: 0.2 },
                  }}
                >
                  <img
                    src="/covers/mascot/mascot.png"
                    alt="Fluffy the AI study buddy"
                    className="h-32 w-auto object-contain drop-shadow-xl sm:h-38 filter"
                    loading="lazy"
                  />
                </motion.div>

                {/* 6. Compact Floating Dialogue Chip */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-30 w-max max-w-[260px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTip.key}
                      initial={{ opacity: 0, y: 6, scale: 0.92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.92 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-center gap-1.5 rounded-2xl border border-primary/30 bg-background/95 px-3 py-1.5 shadow-md shadow-primary/10 backdrop-blur-md"
                    >
                      <TipIcon className="h-3.5 w-3.5 shrink-0 text-primary animate-pulse" />
                      <p className="text-xs font-semibold text-foreground tracking-tight">
                        {t(activeTip.key)}
                      </p>
                      {/* Speech bubble pointer arrow */}
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-b border-r border-primary/30 bg-background" />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
