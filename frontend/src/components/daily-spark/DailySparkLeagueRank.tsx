import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "urql";
import { LeaderboardRow } from "@/components/gamification/LeaderboardRow";
import { LEADERBOARD_QUERY } from "@/graphql/courses";
import type { LeaderboardEntryData, LeaderboardQueryData } from "@/lib/graphqlTypes";

interface DailySparkLeagueRankProps {
  onFinish: () => void;
}

/**
 * The closing screen of the daily spark: where the student now stands on the
 * weekly board.
 *
 * This screen used to animate a rank counter from 28 down to 6 for every
 * student on every run, next to four invented classmates, and told each of them
 * they had "finished #28 and kept your spot in the Hydrogen League". None of
 * those numbers came from anywhere. It now shows the real weekly standing, and
 * the count-up animates to the rank the student actually holds.
 */
export function DailySparkLeagueRank({ onFinish }: DailySparkLeagueRankProps) {
  const [{ data, fetching }] = useQuery<LeaderboardQueryData>({
    query: LEADERBOARD_QUERY,
    variables: { scope: "WEEKLY", limit: 100 },
    requestPolicy: "network-only",
  });

  const board = data?.leaderboard;
  const entries = useMemo(() => board?.entries ?? [], [board]);
  const me = board?.me ?? null;
  const totalRanked = board?.totalRanked ?? 0;

  // The student plus their immediate neighbours, so the rank has context.
  const window: LeaderboardEntryData[] = useMemo(() => {
    if (!me) return entries.slice(0, 5);
    const index = entries.findIndex((e) => e.isMe);
    if (index === -1) return [me];
    const from = Math.max(0, index - 2);
    return entries.slice(from, from + 5);
  }, [entries, me]);

  const [displayRank, setDisplayRank] = useState<number | null>(null);

  // Count in towards the real rank, from a little way behind it. Purely a
  // flourish over a true number, not a claim that the student moved.
  useEffect(() => {
    if (!me) return;
    const target = me.rank;
    const from = Math.min(target + 12, totalRanked || target + 12);
    let current = from;
    setDisplayRank(current);

    const interval = setInterval(() => {
      current -= 1;
      if (current <= target) {
        setDisplayRank(target);
        clearInterval(interval);
        return;
      }
      setDisplayRank(current);
    }, 45);
    return () => clearInterval(interval);
  }, [me, totalRanked]);

  return (
    <div className="relative flex min-h-[640px] w-full max-w-4xl flex-col items-center justify-between overflow-hidden rounded-3xl border border-white/10 bg-[#0d0e11] p-6 text-white shadow-2xl text-center sm:p-8">
      <div className="pointer-events-none absolute top-0 inset-x-0 h-72 opacity-25 select-none">
        <svg viewBox="0 0 600 240" className="size-full" role="presentation">
          <path
            d="M 50,40 L 150,40 L 190,80 L 300,80 M 450,40 L 400,40 L 360,80 L 250,80 M 100,120 L 180,120 L 220,160 M 500,120 L 420,120 L 380,160"
            stroke="#ea580c"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="4 6"
          />
          <circle cx="190" cy="80" r="3.5" fill="#ea580c" />
          <circle cx="360" cy="80" r="3.5" fill="#ea580c" />
          <circle cx="220" cy="160" r="3.5" fill="#ea580c" />
          <circle cx="380" cy="160" r="3.5" fill="#ea580c" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center space-y-3 pt-2">
        <motion.div
          initial={{ scale: 0.6, y: -20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
          className="relative size-20 drop-shadow-xl"
        >
          <svg viewBox="0 0 100 120" className="size-full" role="img">
            <title>Weekly standings</title>
            <defs>
              <linearGradient id="shield-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ea580c" />
                <stop offset="60%" stopColor="#c2410c" />
                <stop offset="100%" stopColor="#7c2d12" />
              </linearGradient>
              <linearGradient id="sun-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffedd5" />
                <stop offset="100%" stopColor="#fdba74" />
              </linearGradient>
            </defs>
            <path
              d="M 15,10 L 85,10 L 85,60 C 85,90 50,110 50,110 C 50,110 15,90 15,60 Z"
              fill="url(#shield-grad)"
              stroke="#fb923c"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <circle cx="50" cy="48" r="16" fill="url(#sun-grad)" />
            <path d="M 38,62 Q 44,54 52,54 Q 60,54 64,62 Z" fill="#ffffff" opacity="0.9" />
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-1"
        >
          {fetching ? (
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Counting up…
            </h2>
          ) : me ? (
            <>
              <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                You're #{displayRank ?? me.rank} this week
              </h2>
              <p className="text-xs text-neutral-400 sm:text-sm">
                {me.totalXp.toLocaleString()} XP earned since Monday
                {totalRanked > 0 && ` · ${totalRanked.toLocaleString()} students ranked`}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Your week starts here
              </h2>
              <p className="text-xs text-neutral-400 sm:text-sm">
                Complete a wave to take a place on this week's board.
              </p>
            </>
          )}
          <p className="text-[11px] font-semibold text-neutral-500">Resets Monday</p>
        </motion.div>
      </div>

      <div className="relative z-10 my-4 w-full max-w-md">
        {window.length > 0 && (
          <ul className="space-y-1">
            {window.map((entry) => (
              <LeaderboardRow
                key={entry.userId}
                entry={entry}
                total={totalRanked}
                className={entry.isMe ? "bg-emerald-950/60 ring-emerald-500/40" : "bg-white/5"}
              />
            ))}
          </ul>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-sm pt-2"
      >
        <button
          type="button"
          onClick={onFinish}
          className="h-12 w-full rounded-full bg-[#e2e4e9] font-bold text-sm text-black shadow-lg transition-all hover:bg-white active:scale-98"
        >
          Continue
        </button>
      </motion.div>
    </div>
  );
}
