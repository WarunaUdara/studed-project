import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Award, Flame, TrendingDown, TrendingUp, Trophy, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { RankBadge } from "@/components/gamification/RankBadge";
import { BlobAvatar } from "@/components/ui/BlobAvatar";
import { usePublicI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * LiveLeaderboard — competitive gamified demo leaderboard with animated blobatars,
 * smooth repeatable rank climbing, realistic up-and-down rank battles, and
 * deterministic cyclic resets.
 */

interface DemoRow {
  id: string;
  seed: string;
  name: string;
  baseXp: number;
  xp: number;
  you?: boolean;
  deltaText?: string;
  rankDelta?: number; // >0 climbed, <0 dropped
}

const INITIAL_ROWS: DemoRow[] = [
  { id: "u1", seed: "kavindi-p-lb", name: "Kavindi P.", baseXp: 8420, xp: 8420 },
  { id: "u2", seed: "tharindu-w-lb", name: "Tharindu W.", baseXp: 8150, xp: 8150 },
  { id: "you", seed: "you-player-lb", name: "You", baseXp: 7890, xp: 7890, you: true },
  { id: "u4", seed: "sahan-f-lb", name: "Sahan F.", baseXp: 7420, xp: 7420 },
  { id: "u5", seed: "dilini-r-lb", name: "Dilini R.", baseXp: 6980, xp: 6980 },
];

interface CycleStage {
  label: string;
  tagIcon?: typeof Zap;
  tagColor?: string;
  durationMs: number;
  apply: (rows: DemoRow[]) => DemoRow[];
}

const STAGES: CycleStage[] = [
  // Stage 0: Initial Standings
  {
    label: "Live League: Diamond Tier",
    tagIcon: Trophy,
    tagColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    durationMs: 2600,
    apply: () =>
      INITIAL_ROWS.map((r) => ({
        ...r,
        xp: r.baseXp,
        deltaText: undefined,
        rankDelta: undefined,
      })),
  },
  // Stage 1: Tharindu surges to #1
  {
    label: "Tharindu solved Wave 4 (+350 XP)",
    tagIcon: Zap,
    tagColor: "text-primary bg-primary/10 border-primary/20",
    durationMs: 2400,
    apply: (current) =>
      current.map((r) =>
        r.id === "u2"
          ? { ...r, xp: 8500, deltaText: "+350 XP", rankDelta: 1 }
          : { ...r, deltaText: undefined, rankDelta: r.id === "u1" ? -1 : 0 },
      ),
  },
  // Stage 2: You answer a simulation wave and climb to #2
  {
    label: "You completed Physics Lab (+600 XP)",
    tagIcon: Flame,
    tagColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    durationMs: 2600,
    apply: (current) =>
      current.map((r) =>
        r.you
          ? { ...r, xp: 8490, deltaText: "+600 XP", rankDelta: 1 }
          : { ...r, deltaText: undefined, rankDelta: r.id === "u1" ? -1 : 0 },
      ),
  },
  // Stage 3: Kavindi counter-attacks to reclaim #1, pushing you back to #3
  {
    label: "Kavindi hit a 3-Streak (+380 XP)",
    tagIcon: Zap,
    tagColor: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    durationMs: 2600,
    apply: (current) =>
      current.map((r) =>
        r.id === "u1"
          ? { ...r, xp: 8800, deltaText: "+380 XP", rankDelta: 2 }
          : { ...r, deltaText: undefined, rankDelta: r.you ? -1 : r.id === "u2" ? -1 : 0 },
      ),
  },
  // Stage 4: You trigger STREAK FRENZY and rocket to #1!
  {
    label: "Streak Frenzy! You took #1 (+950 XP)",
    tagIcon: Award,
    tagColor: "text-amber-500 bg-amber-500/15 border-amber-500/30",
    durationMs: 3200,
    apply: (current) =>
      current.map((r) =>
        r.you
          ? { ...r, xp: 9440, deltaText: "+950 XP 🔥", rankDelta: 2 }
          : { ...r, deltaText: undefined, rankDelta: r.id === "u1" ? -1 : 0 },
      ),
  },
  // Stage 5: Victory Climax Hold
  {
    label: "1st Place Achieved! Next round starting...",
    tagIcon: Trophy,
    tagColor: "text-amber-500 bg-amber-500/20 border-amber-500/40",
    durationMs: 2400,
    apply: (current) =>
      current.map((r) => ({
        ...r,
        deltaText: r.you ? "👑 Leader" : undefined,
        rankDelta: undefined,
      })),
  },
];

export function LiveLeaderboard() {
  const { t } = usePublicI18n();
  const reduce = useReducedMotion();
  const [stageIndex, setStageIndex] = useState(0);
  const [rows, setRows] = useState(INITIAL_ROWS);

  const stage = STAGES[stageIndex] ?? STAGES[0];

  useEffect(() => {
    if (reduce) return;

    const timer = setTimeout(() => {
      setStageIndex((prev) => {
        const nextIndex = (prev + 1) % STAGES.length;
        const nextStage = STAGES[nextIndex];
        setRows((curr) => nextStage.apply(curr));
        return nextIndex;
      });
    }, stage.durationMs);

    return () => clearTimeout(timer);
  }, [reduce, stageIndex, stage.durationMs]);

  // Sort rows by XP descending to compute rank
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => b.xp - a.xp);
  }, [rows]);

  const TagIcon = stage.tagIcon ?? Trophy;

  return (
    <div className="relative select-none">
      {/* Header with live pulse and dynamic gamified event chip */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("liveLbTitle")}
          </span>
        </div>

        <motion.div
          key={stage.label}
          initial={{ opacity: 0, y: -4, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25 }}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors",
            stage.tagColor,
          )}
        >
          <TagIcon className="h-3 w-3 shrink-0" />
          <span className="truncate max-w-[170px] sm:max-w-[200px]">{stage.label}</span>
        </motion.div>
      </div>

      {/* Leaderboard rows with spring layout reordering */}
      <ul className="space-y-1.5">
        <AnimatePresence initial={false}>
          {sortedRows.map((row, i) => {
            const rank = i + 1;
            const isFirst = rank === 1;
            const isYou = row.you;

            return (
              <motion.li
                key={row.id}
                layout={!reduce}
                transition={{
                  type: "spring",
                  stiffness: 340,
                  damping: 28,
                  mass: 0.8,
                }}
                className={cn(
                  "relative flex items-center gap-2.5 rounded-2xl border px-3 py-2 transition-all duration-300",
                  isYou && isFirst
                    ? "border-amber-500/50 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-primary/10 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/40"
                    : isYou
                      ? "border-primary/40 bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 shadow-xs ring-1 ring-primary/30"
                      : isFirst
                        ? "border-border/80 bg-muted/60"
                        : "border-border/40 bg-muted/30 hover:bg-muted/50",
                )}
              >
                {/* Rank & Rank Delta Indicator */}
                <div className="flex w-7 shrink-0 items-center justify-center">
                  <div className="relative flex items-center justify-center">
                    <RankBadge rank={rank} size="sm" />
                    {/* Floating rank delta jump (e.g. ▲ 1 or ▼ 1) */}
                    {row.rankDelta && row.rankDelta !== 0 && (
                      <motion.span
                        key={`${row.id}-${row.rankDelta}-${stageIndex}`}
                        initial={{ opacity: 0, scale: 0.5, y: row.rankDelta > 0 ? 6 : -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "absolute -right-2.5 -top-1.5 flex h-3.5 items-center justify-center rounded-full px-1 text-[8px] font-black shadow-xs",
                          row.rankDelta > 0
                            ? "bg-emerald-500 text-white"
                            : "bg-rose-500/90 text-white",
                        )}
                      >
                        {row.rankDelta > 0 ? (
                          <TrendingUp className="mr-0.5 h-2 w-2 stroke-[3]" />
                        ) : (
                          <TrendingDown className="mr-0.5 h-2 w-2 stroke-[3]" />
                        )}
                        {Math.abs(row.rankDelta)}
                      </motion.span>
                    )}
                  </div>
                </div>

                {/* Animated Blobatar Avatar */}
                <div className="relative shrink-0">
                  <BlobAvatar
                    name={row.seed}
                    size={28}
                    animate="always"
                    className={cn(
                      "rounded-full ring-2 transition-shadow",
                      isYou
                        ? isFirst
                          ? "ring-amber-500 shadow-sm shadow-amber-500/40"
                          : "ring-primary shadow-xs"
                        : "ring-border/60",
                    )}
                    title={`${row.name} avatar`}
                  />
                  {isYou && (
                    <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-black text-primary-foreground shadow-xs">
                      ★
                    </span>
                  )}
                </div>

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

                {/* Dynamic XP Score and XP Surge Delta Tag */}
                <div className="flex shrink-0 items-center gap-1.5">
                  {row.deltaText && (
                    <motion.span
                      key={`${row.id}-${row.deltaText}`}
                      initial={{ opacity: 0, scale: 0.7, x: 8 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold shadow-xs",
                        isYou
                          ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30",
                      )}
                    >
                      {row.deltaText}
                    </motion.span>
                  )}

                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {row.xp.toLocaleString()}
                    <span className="ml-1 text-[10px] font-semibold text-muted-foreground">XP</span>
                  </span>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
