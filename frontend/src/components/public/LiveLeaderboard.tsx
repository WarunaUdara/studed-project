import { useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { type LeaderboardEntry, LeaderboardRow } from "@/components/gamification/LeaderboardRow";
import { usePublicI18n } from "@/lib/i18n";

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

  // Sort rows by XP descending to determine positions. The public card is an
  // illustrative marketing example, but it still uses the canonical row so
  // rank, identity, and XP presentation cannot drift from the product board.
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => b.xp - a.xp);
  }, [rows]);

  const entries = useMemo<LeaderboardEntry[]>(
    () =>
      sortedRows.map((row, index) => ({
        rank: index + 1,
        userId: row.id,
        displayName: row.you ? t("liveLbYou") : row.name,
        totalXp: row.xp,
        isMe: Boolean(row.you),
      })),
    [sortedRows, t],
  );

  return (
    <div className="select-none">
      <ul className="space-y-2">
        {entries.map((entry) => (
          <LeaderboardRow key={entry.userId} entry={entry} total={entries.length} />
        ))}
      </ul>
    </div>
  );
}
