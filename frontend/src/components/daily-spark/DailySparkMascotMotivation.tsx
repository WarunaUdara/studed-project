import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface DailySparkMascotMotivationProps {
  totalXp: number;
  onContinue: () => void;
}

export function DailySparkMascotMotivation({
  totalXp,
  onContinue,
}: DailySparkMascotMotivationProps) {
  const reduce = useReducedMotion();
  return (
    <div className="relative flex min-h-[580px] w-full max-w-4xl flex-col items-center justify-between rounded-3xl border border-white/10 bg-[oklch(0.406_0.011_270.2)] p-8 text-white shadow-2xl text-center">
      {/* Top spacer */}
      <div className="h-4" />

      {/* Mascot & Celebration Content */}
      <div className="flex flex-col items-center justify-center space-y-6">
        {/* Animated Blob Mascot Lifting Dumbbells */}
        <div className="relative flex flex-col items-center">
          {/* 3D Floating Blob Character with Dumbbells */}
          <motion.div
            initial={{ y: 20, scale: 0.8, opacity: 0 }}
            animate={
              reduce ? { y: 0, scale: 1, opacity: 1 } : { y: [0, -10, 0], scale: 1, opacity: 1 }
            }
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
                  <stop offset="0%" stopColor="oklch(0.83 0.145 158.5)" />
                  <stop offset="50%" stopColor="oklch(0.775 0.145 158.5)" />
                  <stop offset="100%" stopColor="oklch(0.718 0.127 158.8)" />
                </linearGradient>
                <linearGradient id="dumbbell-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.906 0.047 247.2)" />
                  <stop offset="100%" stopColor="oklch(0.783 0.107 251.3)" />
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
              <path
                d="M 100,28 C 152,28 178,65 178,110 C 178,155 145,178 100,178 C 55,178 22,155 22,110 C 22,65 48,28 100,28 Z"
                fill="url(#blob-grad)"
                filter="url(#blob-glow)"
              />

              {/* Blob Cheek Highlights */}
              <ellipse
                cx="58"
                cy="118"
                rx="9"
                ry="5"
                fill="oklch(0.718 0.127 158.8)"
                opacity="0.6"
              />
              <ellipse
                cx="142"
                cy="118"
                rx="9"
                ry="5"
                fill="oklch(0.718 0.127 158.8)"
                opacity="0.6"
              />

              {/* Big Happy Anime Eyes (Matching Screenshot 4) */}
              {/* Left Eye */}
              <ellipse cx="76" cy="98" rx="8.5" ry="12" fill="oklch(0.245 0 0)" />
              <circle cx="79" cy="93" r="4.5" fill="oklch(1 0 89.9)" />
              <circle cx="73" cy="103" r="2.2" fill="oklch(1 0 89.9)" />

              {/* Right Eye */}
              <ellipse cx="124" cy="98" rx="8.5" ry="12" fill="oklch(0.245 0 0)" />
              <circle cx="127" cy="93" r="4.5" fill="oklch(1 0 89.9)" />
              <circle cx="121" cy="103" r="2.2" fill="oklch(1 0 89.9)" />

              {/* Cheerful Open Smile */}
              <path
                d="M 88,116 Q 100,132 112,116"
                stroke="oklch(0.245 0 0)"
                strokeWidth="4"
                strokeLinecap="round"
                fill="oklch(0.686 0.187 18.2)"
              />

              {/* Dumbbell Being Lifted Overhead */}
              <g className="drop-shadow-lg">
                {/* Dumbbell Bar */}
                <rect
                  x="20"
                  y="46"
                  width="160"
                  height="7"
                  rx="3.5"
                  fill="oklch(0.864 0.007 248.8)"
                />

                {/* Left Weight Plates */}
                <rect x="14" y="30" width="16" height="38" rx="6" fill="url(#dumbbell-grad)" />
                <rect x="30" y="36" width="12" height="26" rx="5" fill="url(#dumbbell-grad)" />

                {/* Right Weight Plates */}
                <rect x="170" y="30" width="16" height="38" rx="6" fill="url(#dumbbell-grad)" />
                <rect x="158" y="36" width="12" height="26" rx="5" fill="url(#dumbbell-grad)" />
              </g>

              {/* Little arms holding the dumbbell bar */}
              <path
                d="M 68,105 Q 60,75 75,48"
                stroke="oklch(0.775 0.145 158.5)"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 132,105 Q 140,75 125,48"
                stroke="oklch(0.775 0.145 158.5)"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </motion.div>

          {/* Pedestal Base Shadow (matching image 4) */}
          <div className="relative -mt-4 h-9 w-32 rounded-[50%] bg-gradient-to-b from-[oklch(0.557_0.013_272.5)] to-[oklch(0.421_0.01_270.3)] shadow-xl border border-white/5" />
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

        {/* Floating Sparkle Micro-pill */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.35, type: "spring" }}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-300"
        >
          <Sparkles className="size-3.5 text-emerald-400" />
          <span>+{totalXp} XP Streak Bonus</span>
        </motion.div>
      </div>

      {/* Bottom Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-sm pt-6"
      >
        <button
          type="button"
          onClick={onContinue}
          className="h-12 w-full rounded-full bg-[oklch(0.963_0.003_268.4)] font-bold text-sm text-black shadow-lg transition-all hover:bg-white active:scale-98"
        >
          Continue
        </button>
      </motion.div>
    </div>
  );
}
