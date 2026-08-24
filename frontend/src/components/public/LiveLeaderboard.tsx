import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { BlobAvatar } from "@/components/ui/BlobAvatar";
import { usePublicI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * LiveLeaderboard — clean, smooth, gamified leaderboard widget.
 * Features animated blobatars and silky-smooth position swapping
 * as students gain XP and climb up and down the rankings.
 */

interface DemoRow {
  id: string;
  seed: string;
  name: string;
  baseXp: number;
  xp: number;
  you?: boolean;
}

const INITIAL_ROWS: DemoRow[] = [
  { id: "u1", seed: "kavindi-p-lb", name: "Kavindi P.", baseXp: 8420, xp: 8420 },
  { id: "u2", seed: "tharindu-w-lb", name: "Tharindu W.", baseXp: 8150, xp: 8150 },
  { id: "you", seed: "you-player-lb", name: "You", baseXp: 7890, xp: 7890, you: true },
  { id: "u4", seed: "sahan-f-lb", name: "Sahan F.", baseXp: 7420, xp: 7420 },
  { id: "u5", seed: "dilini-r-lb", name: "Dilini R.", baseXp: 6980, xp: 6980 },
];

interface CycleStep {
  durationMs: number;
  apply: (rows: DemoRow[]) => DemoRow[];
}

const STEPS: CycleStep[] = [
  // Step 0: Baseline standings (You at #3)
  {
    durationMs: 3200,
    apply: () => INITIAL_ROWS.map((r) => ({ ...r, xp: r.baseXp })),
  },
  // Step 1: Tharindu gains XP and surges to #1
  {
    durationMs: 3200,
    apply: (curr) => curr.map((r) => (r.id === "u2" ? { ...r, xp: 8520 } : r)),
  },
  // Step 2: You answer a wave and climb up to #2
  {
    durationMs: 3200,
    apply: (curr) => curr.map((r) => (r.you ? { ...r, xp: 8490 } : r)),
  },
  // Step 3: Kavindi counters to reclaim #1, pushing you back to #3
  {
    durationMs: 3200,
    apply: (curr) => curr.map((r) => (r.id === "u1" ? { ...r, xp: 8850 } : r)),
  },
  // Step 4: You hit a streak bonus and rocket to #1!
  {
    durationMs: 3600,
    apply: (curr) => curr.map((r) => (r.you ? { ...r, xp: 9240 } : r)),
  },
  // Step 5: Hold victory state
  {
    durationMs: 2800,
    apply: (curr) => curr,
  },
];

export function LiveLeaderboard() {
  const { t } = usePublicI18n();
  const reduce = useReducedMotion();
  const [stepIndex, setStepIndex] = useState(0);
  const [rows, setRows] = useState(INITIAL_ROWS);

  const step = STEPS[stepIndex] ?? STEPS[0];

  useEffect(() => {
    if (reduce) return;

    const timer = setTimeout(() => {
      setStepIndex((prev) => {
        const nextIndex = (prev + 1) % STEPS.length;
        const nextStep = STEPS[nextIndex];
        setRows((curr) => nextStep.apply(curr));
        return nextIndex;
      });
    }, step.durationMs);

    return () => clearTimeout(timer);
  }, [reduce, stepIndex, step.durationMs]);

  // Sort rows by XP descending to determine positions
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => b.xp - a.xp);
  }, [rows]);

  return (
    <div className="select-none">
      <ul className="space-y-2">
        {sortedRows.map((row, i) => {
          const rank = i + 1;
          const isFirst = rank === 1;
          const isYou = row.you;

          return (
            <motion.li
              key={row.id}
              layout={!reduce ? "position" : false}
              transition={{
                layout: {
                  duration: 0.7,
                  ease: [0.32, 0.72, 0, 1], // silky smooth replacement curve
                },
              }}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 transition-colors duration-300",
                isYou
                  ? "border-primary/40 bg-primary/10 shadow-xs ring-1 ring-primary/30"
                  : isFirst
                    ? "border-border/80 bg-muted/60"
                    : "border-border/40 bg-muted/30 hover:bg-muted/50",
              )}
            >
              {/* Clean Rank Number */}
              <span
                className={cn(
                  "flex w-6 shrink-0 items-center justify-center text-xs font-bold tabular-nums",
                  isFirst
                    ? "text-amber-500 font-extrabold"
                    : isYou
                      ? "text-primary font-extrabold"
                      : "text-muted-foreground",
                )}
              >
                #{rank}
              </span>

              {/* Animated Blobatar */}
              <BlobAvatar
                name={row.seed}
                size={30}
                animate="always"
                className={cn(
                  "rounded-full ring-1 shrink-0 overflow-hidden shadow-xs",
                  isYou ? "ring-primary" : "ring-border/60",
                )}
                title={`${row.name} avatar`}
              />

              {/* Student Name */}
              <div className="min-w-0 flex-1 flex items-center gap-1.5">
                <span
                  className={cn(
                    "truncate text-sm tracking-tight",
                    isYou ? "font-bold text-foreground" : "font-medium text-foreground/90",
                  )}
                >
                  {isYou ? t("liveLbYou") : row.name}
                </span>

                {isYou && (
                  <span className="rounded-md bg-primary/20 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-primary">
                    ME
                  </span>
                )}
              </div>

              {/* XP Score */}
              <div className="flex shrink-0 items-center">
                <span className="text-sm font-bold tabular-nums text-foreground">
                  {row.xp.toLocaleString()}
                  <span className="ml-1 text-[10px] font-medium text-muted-foreground">XP</span>
                </span>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
