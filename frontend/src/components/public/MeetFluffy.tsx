import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, MessageSquare, Sparkles, Wand2 } from "lucide-react";
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
  { key: "fluffyTip2", icon: Sparkles },
  { key: "fluffyTip3", icon: MessageSquare },
] as const;

export function MeetFluffy({ authed, className }: MeetFluffyProps) {
  const { t } = usePublicI18n();
  const reduce = useReducedMotion();
  const [tipIndex, setTipIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Cycle speech bubble tips every 4.5 seconds
  useEffect(() => {
    if (reduce) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [reduce]);

  const activeTip = TIPS[tipIndex];
  const TipIcon = activeTip.icon;

  const handleMascotClick = () => {
    playSuccessSound();
    setTipIndex((prev) => (prev + 1) % TIPS.length);
  };

  return (
    <section className={cn("relative overflow-hidden px-4 py-20 sm:px-6 lg:py-24", className)}>
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[32px] sm:rounded-[36px] border border-border/80 bg-gradient-to-br from-card via-card/90 to-primary/5 p-8 sm:p-12 lg:p-14 shadow-sm hover:shadow-md transition-shadow">
          {/* Subtle background ambient glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
          />

          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Column: Copy, Features, CTA */}
            <div className="flex flex-col items-start gap-6 lg:col-span-7">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{t("fluffyBadge")}</span>
              </div>

              {/* Title */}
              <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl text-balance">
                {t("fluffyTitle")}
              </h2>

              {/* Subhead */}
              <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                {t("fluffySubhead")}
              </p>

              {/* Feature Highlights Grid */}
              <div className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2 pt-2">
                {[
                  t("fluffyFeature1"),
                  t("fluffyFeature2"),
                  t("fluffyFeature3"),
                  t("fluffyFeature4"),
                ].map((feat) => (
                  <div
                    key={feat}
                    className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/60 px-3 py-2 text-xs font-semibold text-foreground/90 shadow-2xs backdrop-blur-xs"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className="pt-3">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full px-8 text-sm font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
                  onClick={() => playSuccessSound()}
                >
                  <Link to={authed ? "/dashboard" : "/register"}>{t("fluffyCta")}</Link>
                </Button>
              </div>
            </div>

            {/* Right Column: Mascot Art Composition matching reference drawing */}
            <div className="relative flex items-center justify-center lg:col-span-5">
              <div
                className="relative flex h-[340px] w-full max-w-[400px] items-center justify-center cursor-pointer select-none"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleMascotClick}
              >
                {/* 1. Orbiting Concentric Wireframe Rings (Saturn-like perspective) */}
                <svg
                  className="absolute inset-0 h-full w-full pointer-events-none"
                  viewBox="0 0 400 340"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <g className="text-foreground/30 dark:text-foreground/25">
                    {/* Ring 1 - Upper tilt */}
                    <ellipse
                      cx="200"
                      cy="170"
                      rx="160"
                      ry="45"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                      className="opacity-75"
                    />
                    {/* Ring 2 - Center main */}
                    <ellipse
                      cx="200"
                      cy="185"
                      rx="180"
                      ry="50"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    {/* Ring 3 - Lower */}
                    <ellipse
                      cx="200"
                      cy="200"
                      rx="155"
                      ry="42"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="opacity-80"
                    />
                  </g>
                </svg>

                {/* 2. Upper-Right 12-Point Starburst (Stroke Wireframe) */}
                <motion.svg
                  className="absolute -right-2 top-2 h-24 w-24 sm:h-28 sm:w-28 text-foreground/40 dark:text-foreground/30 pointer-events-none"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  animate={{ rotate: reduce ? 0 : 360 }}
                  transition={{ duration: 40, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  aria-hidden
                >
                  <polygon
                    points="50,0 58,35 93,18 73,48 100,50 73,52 93,82 58,65 50,100 42,65 7,82 27,52 0,50 27,48 7,18 42,35"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                  />
                </motion.svg>

                {/* 3. Lower-Right 8-Point Soft Star (Solid subtle fill) */}
                <motion.svg
                  className="absolute right-4 bottom-8 h-18 w-18 text-muted-foreground/35 pointer-events-none"
                  viewBox="0 0 100 100"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  aria-hidden
                >
                  <polygon points="50,5 60,38 95,50 60,62 50,95 40,62 5,50 40,38" />
                </motion.svg>

                {/* 4. Lower-Center Vibrant Lime 4-Point Star (Key Accent from mockup) */}
                <motion.svg
                  className="absolute bottom-2 left-1/3 z-20 h-16 w-16 text-lime-400 drop-shadow-[0_4px_16px_rgba(163,230,53,0.5)] pointer-events-none"
                  viewBox="0 0 100 100"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  animate={{
                    y: reduce ? 0 : [0, -6, 0],
                    rotate: reduce ? 0 : [0, 4, -4, 0],
                  }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  aria-hidden
                >
                  <path d="M50 0 C50 35 65 50 100 50 C65 50 50 65 50 100 C50 65 35 50 0 50 C35 50 50 35 50 0 Z" />
                </motion.svg>

                {/* 5. Mascot Character (Fluffy - mascot.png) */}
                <motion.div
                  className="relative z-10 flex items-center justify-center"
                  animate={{
                    y: reduce ? 0 : isHovered ? -12 : [0, -8, 0],
                    scale: isHovered ? 1.05 : 1,
                  }}
                  transition={{
                    y: { duration: 3.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
                    scale: { duration: 0.25 },
                  }}
                >
                  <img
                    src="/covers/mascot/mascot.png"
                    alt="Fluffy the AI study companion"
                    className="h-44 w-auto object-contain drop-shadow-2xl sm:h-52 filter"
                    loading="lazy"
                  />
                </motion.div>

                {/* 6. Floating Interactive Speech Bubble above Fluffy */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 w-max max-w-[280px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTip.key}
                      initial={{ opacity: 0, y: 8, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-2 rounded-2xl border border-primary/30 bg-background/95 px-3.5 py-2 shadow-lg shadow-primary/10 backdrop-blur-md"
                    >
                      <TipIcon className="h-4 w-4 shrink-0 text-primary animate-pulse" />
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
