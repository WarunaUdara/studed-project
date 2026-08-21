import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface DailySparkMascotMotivationProps {
  totalXp: number;
  onContinue: () => void;
}

export function DailySparkMascotMotivation({
  totalXp,
  onContinue,
}: DailySparkMascotMotivationProps) {
  return (
    <div className="relative flex min-h-[580px] w-full max-w-4xl flex-col items-center justify-between rounded-3xl border border-white/10 bg-[#101114] p-8 text-white shadow-2xl text-center">
      {/* Top spacer */}
      <div className="h-4" />

      {/* Mascot & Celebration Content */}
      <div className="flex flex-col items-center justify-center space-y-6">
        {/* Animated Blob Mascot Lifting Dumbbells */}
        <div className="relative flex flex-col items-center">
          {/* 3D Floating Blob Character with Dumbbells */}
          <motion.div
            initial={{ y: 20, scale: 0.8, opacity: 0 }}
            animate={{ y: [0, -10, 0], scale: 1, opacity: 1 }}
            transition={{
              y: { repeat: Infinity, duration: 2.6, ease: "easeInOut" },
              scale: { duration: 0.5, type: "spring", bounce: 0.4 },
              opacity: { duration: 0.3 },
            }}
            className="relative z-10 size-44 select-none drop-shadow-2xl"
          >
            <svg viewBox="0 0 200 200" className="size-full">
              <defs>
                <linearGradient id="blob-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="50%" stopColor="#16a34a" />
                  <stop offset="100%" stopColor="#15803d" />
                </linearGradient>
                <linearGradient id="dumbbell-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#93c5fd" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <filter id="blob-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow
                    dx="0"
                    dy="8"
                    stdDeviation="12"
                    floodColor="rgba(34, 197, 94, 0.35)"
                  />
                </filter>
              </defs>

              {/* Main Blob Body */}
              <motion.path
                d="M 60,100 C 60,60 140,60 140,100 C 140,140 130,155 100,155 C 70,155 60,140 60,100 Z"
                fill="url(#blob-grad)"
                filter="url(#blob-glow)"
                animate={{
                  d: [
                    "M 60,100 C 60,60 140,60 140,100 C 140,140 130,155 100,155 C 70,155 60,140 60,100 Z",
                    "M 55,100 C 55,55 145,55 145,100 C 145,145 135,150 100,150 C 65,150 55,145 55,100 Z",
                    "M 60,100 C 60,60 140,60 140,100 C 140,140 130,155 100,155 C 70,155 60,140 60,100 Z",
                  ],
                }}
                transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
              />

              {/* Happy Eyes */}
              <circle cx="85" cy="95" r="4.5" fill="#0f172a" />
              <circle cx="115" cy="95" r="4.5" fill="#0f172a" />

              {/* Cute Smile */}
              <path
                d="M 92,108 Q 100,116 108,108"
                stroke="#0f172a"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />

              {/* Dumbbell held up proudly */}
              <g transform="translate(68, 30) rotate(-15)">
                <rect x="0" y="14" width="64" height="6" rx="3" fill="#cbd5e1" />
                {/* Left Weight */}
                <rect x="-8" y="4" width="12" height="26" rx="5" fill="url(#dumbbell-grad)" />
                {/* Right Weight */}
                <rect x="60" y="4" width="12" height="26" rx="5" fill="url(#dumbbell-grad)" />
              </g>

              {/* Little arms holding the dumbbell bar */}
              <path
                d="M 68,105 Q 60,75 75,48"
                stroke="#16a34a"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 132,105 Q 140,75 125,48"
                stroke="#16a34a"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </motion.div>

          {/* Pedestal Base Shadow (matching image 4) */}
          <div className="relative -mt-4 h-9 w-32 rounded-[50%] bg-gradient-to-b from-[#2a2c33] to-[#121316] shadow-xl border border-white/5" />
        </div>

        {/* Heading & Subhead */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Perfect!
          </h2>
          <p className="text-sm text-neutral-400 font-medium sm:text-base">
            Let's keep the momentum going
          </p>
        </motion.div>

        {/* Total XP Score Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
          className="pt-2"
        >
          <p className="text-[11px] font-bold tracking-widest text-neutral-500 uppercase">
            Total XP
          </p>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              {totalXp}
            </span>
            <Sparkles className="size-6 fill-emerald-400 text-emerald-400 animate-pulse" />
          </div>
        </motion.div>
      </div>

      {/* Bottom Action Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-sm pt-4"
      >
        <button
          type="button"
          onClick={onContinue}
          className="h-12 w-full rounded-full bg-[#e2e4e9] font-bold text-sm text-black shadow-lg transition-all hover:bg-white active:scale-98"
        >
          Continue
        </button>
      </motion.div>
    </div>
  );
}
