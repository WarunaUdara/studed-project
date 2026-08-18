import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth";
import type { LeagueMember } from "./types";

interface DailySparkLeagueRankProps {
  totalXp: number;
  onFinish: () => void;
}

const DEFAULT_MEMBERS: LeagueMember[] = [
  { rank: 3, name: "Ankit K", avatarLetter: "A", avatarColor: "bg-emerald-500", xp: 225 },
  { rank: 5, name: "David E", avatarLetter: "D", avatarColor: "bg-emerald-500", xp: 200 },
  { rank: 6, name: "Jeremy L", avatarLetter: "J", avatarColor: "bg-amber-400 text-black", xp: 55 },
  { rank: 6, name: "Yolanda J", avatarLetter: "Y", avatarColor: "bg-yellow-600 text-black", xp: 55 },
];

export function DailySparkLeagueRank({ totalXp, onFinish }: DailySparkLeagueRankProps) {
  const { user } = useAuthStore();
  const userName = user?.fullName ? user.fullName.split(" ")[0] + " " + (user.fullName.split(" ")[1]?.charAt(0) ?? "U") : "Waruna U";
  const userInitial = user?.fullName?.charAt(0).toUpperCase() ?? "W";

  // Rank climb counter animation (e.g. from 28 down to 6)
  const [displayRank, setDisplayRank] = useState(28);

  useEffect(() => {
    let start = 28;
    const end = 6;
    const interval = setInterval(() => {
      start -= 1;
      if (start <= end) {
        setDisplayRank(end);
        clearInterval(interval);
      } else {
        setDisplayRank(start);
      }
    }, 45);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex min-h-[640px] w-full max-w-4xl flex-col items-center justify-between overflow-hidden rounded-3xl border border-white/10 bg-[#0d0e11] p-6 text-white shadow-2xl text-center sm:p-8">
      {/* Background Circuit Geometric Pattern (as in Screenshot 2) */}
      <div className="pointer-events-none absolute top-0 inset-x-0 h-72 opacity-25 select-none">
        <svg viewBox="0 0 600 240" className="size-full">
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

      {/* Top Header & Bronze League Shield */}
      <div className="relative z-10 flex flex-col items-center space-y-3 pt-2">
        {/* Bronze / Hydrogen League Shield Emblem */}
        <motion.div
          initial={{ scale: 0.6, y: -20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
          className="relative size-20 drop-shadow-xl"
        >
          <svg viewBox="0 0 100 120" className="size-full">
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
            {/* Shield Outline Body */}
            <path
              d="M 15,10 L 85,10 L 85,60 C 85,90 50,110 50,110 C 50,110 15,90 15,60 Z"
              fill="url(#shield-grad)"
              stroke="#fb923c"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Inner Shield Sun & Cloud Emblem */}
            <circle cx="50" cy="48" r="16" fill="url(#sun-grad)" />
            <path
              d="M 38,62 Q 44,54 52,54 Q 60,54 64,62 Z"
              fill="#ffffff"
              opacity="0.9"
            />
          </svg>
        </motion.div>

        {/* Headline & Subhead */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-1"
        >
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            So close
          </h2>
          <p className="text-xs text-neutral-400 sm:text-sm">
            You previously finished #28 and kept your spot in the Hydrogen League
          </p>
          <p className="text-[11px] font-semibold text-neutral-500">6 days left</p>
        </motion.div>
      </div>

      {/* Leaderboard Climbing Rank List (Screenshot 2) */}
      <div className="relative z-10 my-4 w-full max-w-md space-y-2">
        {/* Rank 3: Ankit K */}
        <LeaderboardRow member={DEFAULT_MEMBERS[0]} isTopBadge />

        {/* Rank 5: David E */}
        <LeaderboardRow member={DEFAULT_MEMBERS[1]} />

        {/* Rank 6: ACTIVE CURRENT USER (Highlighted in Green) */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, x: -15 }}
          animate={{ scale: 1, opacity: 1, x: 0 }}
          transition={{ delay: 0.35, type: "spring", bounce: 0.2 }}
          className="flex items-center justify-between rounded-2xl border border-emerald-500/40 bg-[#0e4823] px-4 py-3 shadow-lg shadow-emerald-950/40"
        >
          <div className="flex items-center gap-3.5">
            <span className="w-5 text-center font-bold text-sm text-emerald-400">
              {displayRank}
            </span>
            <div className="flex size-9 items-center justify-center rounded-full bg-emerald-400 font-extrabold text-sm text-black shadow-sm">
              {userInitial}
            </div>
            <span className="font-bold text-sm text-white">{userName}</span>
          </div>
          <span className="font-semibold text-sm text-emerald-100">{totalXp || 55} XP</span>
        </motion.div>

        {/* Rank 6 Tied: Jeremy L */}
        <LeaderboardRow member={DEFAULT_MEMBERS[2]} />

        {/* Rank 6 Tied: Yolanda J */}
        <LeaderboardRow member={DEFAULT_MEMBERS[3]} />
      </div>

      {/* Bottom Action Button */}
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

function LeaderboardRow({
  member,
  isTopBadge = false,
}: {
  member: LeagueMember;
  isTopBadge?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-neutral-300">
      <div className="flex items-center gap-3.5">
        {isTopBadge ? (
          <span className="flex size-5 items-center justify-center rounded-md bg-[#7c2d12] font-bold text-xs text-amber-200">
            {member.rank}
          </span>
        ) : (
          <span className="w-5 text-center font-bold text-sm text-emerald-500">
            {member.rank}
          </span>
        )}
        <div
          className={`flex size-9 items-center justify-center rounded-full ${member.avatarColor} font-extrabold text-sm shadow-sm`}
        >
          {member.avatarLetter}
        </div>
        <span className="font-medium text-sm text-neutral-200">{member.name}</span>
      </div>
      <span className="font-medium text-sm text-neutral-400">{member.xp} XP</span>
    </div>
  );
}
