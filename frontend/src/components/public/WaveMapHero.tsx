import { motion, useReducedMotion } from "framer-motion";
import { Check, Lock, Trophy, Zap } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { StreakFlame } from "@/components/gamification/StreakFlame";
import { XPBar } from "@/components/gamification/XPBar";
import { type PublicStringKey, usePublicI18n } from "@/lib/i18n";
import { playClickSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

/**
 * WaveMapHero — the right-hand hero visual on the public home page.
 *
 * A living "wave map": a winding trail of wave nodes (completed, current,
 * locked) rendered as a game world rather than a dashboard screenshot. A
 * glow orb travels the path, the current node pulses, and +XP chips drift
 * up from it. Every node is hoverable/focusable and reveals its wave card.
 */

const VIEW_W = 400;
const VIEW_H = 540;
/** Smooth S-curve trail from top to bottom of the viewBox. */
const PATH_D =
  "M 200 24 C 340 64 60 112 200 156 S 60 248 200 292 S 60 384 200 428 S 140 500 200 516";

type NodeState = "done" | "current" | "locked";

interface WaveNodeDef {
  titleKey: PublicStringKey;
  xp: number;
  state: NodeState;
}

/** Node positions along the path as fractions of its total length. */
const NODE_FRACTIONS = [0.03, 0.185, 0.34, 0.5, 0.66, 0.815, 0.965];

const NODES: WaveNodeDef[] = [
  { titleKey: "waveNode1", xp: 40, state: "done" },
  { titleKey: "waveNode2", xp: 45, state: "done" },
  { titleKey: "waveNode3", xp: 50, state: "done" },
  { titleKey: "waveNode4", xp: 50, state: "current" },
  { titleKey: "waveNode5", xp: 60, state: "locked" },
  { titleKey: "waveNode6", xp: 65, state: "locked" },
  { titleKey: "waveNode7", xp: 120, state: "locked" },
];

/** Fraction of the trail that is "completed" (up to the current node). */
const COMPLETED_FRACTION = NODE_FRACTIONS[3];

interface Point {
  x: number;
  y: number;
}

export function WaveMapHero() {
  const { t } = usePublicI18n();
  const reduce = useReducedMotion();
  const gradientId = useId();
  const pathRef = useRef<SVGPathElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // Measure node coordinates along the real path once mounted.
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    setPoints(NODE_FRACTIONS.map((f) => path.getPointAtLength(len * f)));
  }, []);

  const currentPoint = points[3];

  const statusLabel = (state: NodeState) =>
    state === "done"
      ? t("waveStatusCompleted")
      : state === "current"
        ? t("waveStatusCurrent")
        : t("waveStatusLocked");

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Halo behind the card */}
      <div
        aria-hidden
        className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-primary/15 via-purple/10 to-success/10 blur-3xl"
      />

      {/* Floating meta chips */}
      {!reduce && (
        <>
          <motion.span
            aria-hidden
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="absolute -left-4 top-16 z-20 hidden items-center gap-1.5 rounded-full glass px-3 py-1.5 text-xs font-bold text-foreground shadow-md sm:inline-flex"
          >
            <Zap className="h-3.5 w-3.5 fill-gold text-gold" />
            +50 XP
          </motion.span>
          <motion.span
            aria-hidden
            animate={{ y: [0, 9, 0] }}
            transition={{ duration: 6.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="absolute -right-3 bottom-28 z-20 hidden items-center gap-1.5 rounded-full glass px-3 py-1.5 text-xs font-bold text-foreground shadow-md sm:inline-flex"
          >
            <Trophy className="h-3.5 w-3.5 text-primary" />
            #12
          </motion.span>
        </>
      )}

      <div className="relative overflow-hidden rounded-3xl border bg-card/85 shadow-2xl backdrop-blur">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t("waveMapTitle")}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{t("waveMapLesson")}</p>
          </div>
          <StreakFlame dayCount={7} size="sm" />
        </div>

        {/* Map */}
        <div className="relative">
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="block h-auto w-full"
            role="img"
            aria-label={t("waveMapTitle")}
          >
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--success)" />
                <stop offset="55%" stopColor="var(--primary)" />
                <stop offset="100%" stopColor="var(--purple)" />
              </linearGradient>
            </defs>

            {/* Base trail — dotted game-map feel */}
            <path
              ref={pathRef}
              d={PATH_D}
              fill="none"
              stroke="var(--border)"
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray="0.5 12"
            />

            {/* Completed portion */}
            <motion.path
              d={PATH_D}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={5}
              strokeLinecap="round"
              initial={{ pathLength: reduce ? COMPLETED_FRACTION : 0 }}
              animate={{ pathLength: COMPLETED_FRACTION }}
              transition={{ duration: 1.8, ease: "easeOut", delay: 0.4 }}
            />

            {/* Travelling glow orb */}
            {!reduce && (
              <>
                <circle r={10} fill="var(--primary)" opacity={0.28}>
                  <animateMotion dur="9s" repeatCount="indefinite" path={PATH_D} />
                </circle>
                <circle r={4} fill="var(--primary)">
                  <animateMotion dur="9s" repeatCount="indefinite" path={PATH_D} />
                </circle>
              </>
            )}
          </svg>

          {/* Node buttons overlay */}
          <div className="absolute inset-0">
            {points.map((p, i) => {
              const node = NODES[i];
              if (!node) return null;
              const left = `${(p.x / VIEW_W) * 100}%`;
              const top = `${(p.y / VIEW_H) * 100}%`;
              const isActive = activeIdx === i;
              const tooltipBelow = p.y / VIEW_H < 0.22;

              return (
                <div
                  key={node.titleKey}
                  className="absolute"
                  style={{ left, top, transform: "translate(-50%, -50%)" }}
                >
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 0.25 + i * 0.12,
                      type: "spring",
                      stiffness: 260,
                      damping: 18,
                    }}
                    onMouseEnter={() => setActiveIdx(i)}
                    onMouseLeave={() => setActiveIdx(null)}
                    onFocus={() => setActiveIdx(i)}
                    onBlur={() => setActiveIdx(null)}
                    onClick={() => {
                      playClickSound();
                      setActiveIdx(isActive ? null : i);
                    }}
                    aria-label={`${t(node.titleKey)} — ${statusLabel(node.state)}`}
                    className={cn(
                      "relative flex items-center justify-center rounded-full transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      node.state === "done" &&
                        "h-9 w-9 bg-success text-success-foreground shadow-md shadow-success/25 ring-2 ring-success/40",
                      node.state === "current" &&
                        "h-12 w-12 bg-primary text-primary-foreground shadow-lg shadow-primary/40 ring-4 ring-primary/20",
                      node.state === "locked" &&
                        "h-9 w-9 bg-muted text-muted-foreground ring-1 ring-border",
                    )}
                  >
                    {node.state === "done" && <Check className="h-4 w-4" strokeWidth={3} />}
                    {node.state === "current" && <Zap className="h-5 w-5 fill-current" />}
                    {node.state === "locked" && <Lock className="h-3.5 w-3.5" />}
                    {node.state === "current" && !reduce && (
                      <motion.span
                        aria-hidden
                        className="absolute inset-0 rounded-full border-2 border-primary"
                        animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                        transition={{
                          duration: 1.8,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeOut",
                        }}
                      />
                    )}
                  </motion.button>

                  {/* Wave tooltip card */}
                  {isActive && (
                    <div
                      role="tooltip"
                      className={cn(
                        "pointer-events-none absolute left-1/2 z-30 w-48 -translate-x-1/2 rounded-xl glass p-3 text-left shadow-lg",
                        tooltipBelow ? "top-full mt-3" : "bottom-full mb-3",
                      )}
                    >
                      <p className="text-xs font-semibold leading-snug text-foreground">
                        {t(node.titleKey)}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold tabular-nums text-foreground">
                          <Zap className="h-3 w-3 fill-gold text-gold" />
                          {node.xp} XP
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-semibold uppercase tracking-wide",
                            node.state === "done" && "text-success",
                            node.state === "current" && "text-primary",
                            node.state === "locked" && "text-muted-foreground",
                          )}
                        >
                          {statusLabel(node.state)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* XP chips drifting up from the current node */}
            {currentPoint &&
              !reduce &&
              [0, 1, 2].map((i) => (
                <motion.span
                  key={`xp-chip-${i}`}
                  aria-hidden
                  className="pointer-events-none absolute z-20 inline-flex items-center gap-1 rounded-full bg-gold/90 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-md"
                  style={{
                    left: `${(currentPoint.x / VIEW_W) * 100}%`,
                    top: `${(currentPoint.y / VIEW_H) * 100}%`,
                  }}
                  animate={{ y: [-8, -64], x: [0, i === 1 ? 14 : -10], opacity: [0, 1, 0] }}
                  transition={{
                    duration: 2.6,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: i * 0.9,
                    ease: "easeOut",
                  }}
                >
                  +50
                </motion.span>
              ))}
          </div>
        </div>

        {/* Footer */}
        <div className="space-y-2 border-t bg-muted/30 px-5 py-4">
          <XPBar totalXp={3120} compact />
          <p className="text-[11px] text-muted-foreground">{t("waveMapFooter")}</p>
        </div>
      </div>
    </div>
  );
}
