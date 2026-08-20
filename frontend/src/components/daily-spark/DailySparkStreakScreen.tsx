import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface DailySparkStreakScreenProps {
  streakCount: number;
  onFinish: () => void;
}

const DAYS_OF_WEEK = ["M", "T", "W", "T", "F", "S", "S"];

export function DailySparkStreakScreen({
  streakCount = 1,
  onFinish,
}: DailySparkStreakScreenProps) {
  const now = new Date();
  const dayIndex = (now.getDay() + 6) % 7; // Monday = 0, Sunday = 6

  return (
    <div className="relative flex min-h-[580px] w-full max-w-4xl flex-col items-center justify-between overflow-hidden rounded-3xl border border-white/10 bg-[oklch(0.398_0.011_270.1)] p-8 text-white shadow-2xl text-center">
      {/* Ambient Olive/Gold Radial Glow in Background (as in Image 5) */}
      <div
        className="pointer-events-none absolute inset-0 size-full"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% 12%, rgba(163, 230, 53, 0.22) 0%, rgba(101, 163, 13, 0.08) 45%, transparent 75%)",
        }}
      />

      {/* Top spacer */}
      <div className="h-2" />

      {/* Center Streak Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
        {/* 3D Golden/Lime Lightning Badge with Peeking Blob Mascot */}
        <div className="relative flex items-center justify-center">
          {/* Ambient Glow behind the lightning */}
          <div className="absolute size-48 rounded-full bg-lime-400/20 blur-3xl" />

          {/* 3D Lightning Emblem SVG */}
          <motion.div
            initial={{ scale: 0.6, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", duration: 0.8, bounce: 0.35 }}
            className="relative size-44 select-none drop-shadow-2xl"
          >
            <svg viewBox="0 0 200 200" className="size-full">
              <defs>
                <linearGradient id="bolt-front" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="oklch(0.92 0.165 101)" />
                  <stop offset="60%" stopColor="oklch(0.945 0.107 122.5)" />
                  <stop offset="100%" stopColor="oklch(0.871 0.178 123.2)" />
                </linearGradient>
                <linearGradient id="bolt-rim" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.885 0.172 99.3)" />
                  <stop offset="100%" stopColor="oklch(0.737 0.149 124.5)" />
                </linearGradient>
                <filter
                  id="bolt-shadow"
                  x="-30%"
                  y="-30%"
                  width="160%"
                  height="160%"
                >
                  <feDropShadow
                    dx="0"
                    dy="10"
                    stdDeviation="14"
                    floodColor="rgba(190, 242, 100, 0.4)"
                  />
                </filter>
              </defs>

              {/* Lightning 3D Extrusion Rim */}
              <path
                d="M 115,25 L 50,110 L 95,110 L 75,180 L 155,85 L 110,85 Z"
                fill="url(#bolt-rim)"
                transform="translate(4, 6)"
              />

              {/* Lightning Front Face */}
              <path
                d="M 115,25 L 50,110 L 95,110 L 75,180 L 155,85 L 110,85 Z"
                fill="url(#bolt-front)"
                stroke="oklch(0.972 0.069 102.1)"
                strokeWidth="4"
                strokeLinejoin="round"
                filter="url(#bolt-shadow)"
              />

              {/* Peeking Blob Mascot Clinging to Top-Right of Lightning (as in Image 5) */}
              <g transform="translate(125, 20) scale(0.48)">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="oklch(0.83 0.145 158.5)"
                  stroke="oklch(0.718 0.127 158.8)"
                  strokeWidth="4"
                />
                {/* Mascot Square Visor / Eyes */}
                <rect
                  x="30"
                  y="32"
                  width="40"
                  height="26"
                  rx="8"
                  fill="oklch(1 0 89.9)"
                />
                <circle cx="42" cy="45" r="5" fill="oklch(0.447 0.051 261.4)" />
                <circle cx="58" cy="45" r="5" fill="oklch(0.447 0.051 261.4)" />
                <circle cx="44" cy="43" r="1.5" fill="oklch(1 0 89.9)" />
                <circle cx="60" cy="43" r="1.5" fill="oklch(1 0 89.9)" />
              </g>
            </svg>
          </motion.div>
        </div>

        {/* Streak Number & Headline */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-1.5"
        >
          <div className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
            {streakCount}
          </div>
          <p className="text-xl font-bold text-neutral-100 sm:text-2xl">
            A streak is born!
          </p>
        </motion.div>

        {/* Weekly Day Tracker Pills (M, T, W, T, F, S, S) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="flex items-center justify-center gap-3 pt-2"
        >
          {DAYS_OF_WEEK.map((dayLetter, i) => {
            const isToday = i === dayIndex;
            const isCompleted = i <= dayIndex;

            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex size-10 items-center justify-center rounded-full transition-all duration-300 ${
                    isToday
                      ? "bg-lime-400 text-black shadow-lg shadow-lime-400/30 scale-105 ring-2 ring-lime-300"
                      : isCompleted
                        ? "bg-neutral-800 text-lime-400 border border-lime-500/30"
                        : "border border-neutral-700 bg-neutral-900/60 text-neutral-500"
                  }`}
                >
                  {isToday ? (
                    <Zap className="size-5 fill-black text-black" />
                  ) : isCompleted ? (
                    <Zap className="size-4 fill-lime-400 text-lime-400" />
                  ) : (
                    <span className="size-2 rounded-full bg-neutral-700" />
                  )}
                </div>
                <span
                  className={`text-xs font-bold ${
                    isToday ? "text-lime-400" : "text-neutral-500"
                  }`}
                >
                  {dayLetter}
                </span>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* Bottom Action Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="relative z-10 w-full max-w-sm pt-4"
      >
        <button
          type="button"
          onClick={onFinish}
          className="h-12 w-full rounded-full bg-[oklch(0.963_0.003_268.4)] font-bold text-sm text-black shadow-lg transition-all hover:bg-white active:scale-98"
        >
          Continue
        </button>
      </motion.div>
    </div>
  );
}
