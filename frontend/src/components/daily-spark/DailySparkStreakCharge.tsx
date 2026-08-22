import { motion, useReducedMotion } from "framer-motion";

interface DailySparkStreakChargeProps {
  onContinue: () => void;
}

export function DailySparkStreakCharge({ onContinue }: DailySparkStreakChargeProps) {
  const reduce = useReducedMotion();
  return (
    <div className="relative flex min-h-[580px] w-full max-w-4xl flex-col items-center justify-between overflow-hidden rounded-3xl border border-white/10 bg-[oklch(0.398_0.011_270.1)] p-8 text-white shadow-2xl text-center">
      {/* Top spacer */}
      <div className="h-4" />

      {/* Main Charge Battery Content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-7">
        {/* 3D Glowing Battery / Streak Charge Capsule */}
        <div className="relative flex items-center justify-center">
          {/* Intense ambient yellow-green bloom */}
          <div className="absolute size-44 rounded-full bg-lime-400/25 blur-3xl" />

          {/* Spark Particle Rays around the capsule */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={reduce ? undefined : { opacity: [0.6, 1, 0.6], scale: [0.95, 1.05, 0.95] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="absolute size-56 pointer-events-none select-none"
          >
            <svg viewBox="0 0 200 200" className="size-full">
              <path
                d="M 40,50 Q 55,40 60,35"
                stroke="oklch(0.945 0.107 122.5)"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.6"
              />
              <path
                d="M 160,50 Q 150,40 145,35"
                stroke="oklch(0.945 0.107 122.5)"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.6"
              />
              <path
                d="M 30,120 Q 45,135 60,140"
                stroke="oklch(0.945 0.107 122.5)"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.6"
              />
              <path
                d="M 170,120 Q 155,135 140,140"
                stroke="oklch(0.945 0.107 122.5)"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.6"
              />
            </svg>
          </motion.div>

          {/* 3D Battery SVG */}
          <motion.div
            initial={{ scale: 0.7, y: 15, opacity: 0 }}
            animate={reduce ? { scale: 1, opacity: 1 } : { scale: 1, y: [0, -8, 0], opacity: 1 }}
            transition={{
              scale: { type: "spring", duration: 0.7, bounce: 0.3 },
              y: { repeat: Infinity, duration: 2.8, ease: "easeInOut" },
              opacity: { duration: 0.4 },
            }}
            className="relative size-48 select-none drop-shadow-2xl"
          >
            <svg viewBox="0 0 200 200" className="size-full">
              <defs>
                {/* Cylindrical Lime/Yellow Glowing Body */}
                <linearGradient id="battery-body" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="oklch(0.972 0.069 102.1)" />
                  <stop offset="40%" stopColor="oklch(0.945 0.107 122.5)" />
                  <stop offset="100%" stopColor="oklch(0.805 0.174 123.8)" />
                </linearGradient>

                {/* Dark Metallic End-Cap Gradient */}
                <linearGradient id="battery-cap" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.689 0.027 254.5)" />
                  <stop offset="50%" stopColor="oklch(0.539 0.037 255.8)" />
                  <stop offset="100%" stopColor="oklch(0.447 0.051 261.4)" />
                </linearGradient>

                {/* Glass Inner Glow */}
                <filter id="battery-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow
                    dx="0"
                    dy="8"
                    stdDeviation="14"
                    floodColor="rgba(190, 242, 100, 0.4)"
                  />
                </filter>
              </defs>

              {/* Shadow Base below Capsule */}
              <ellipse cx="100" cy="176" rx="38" ry="9" fill="oklch(0.245 0 0)" opacity="0.35" />

              {/* Cylindrical Glass Chamber Tube */}
              {/* Outer Capsule Glow Layer */}
              <rect
                x="56"
                y="38"
                width="88"
                height="126"
                rx="44"
                fill="url(#battery-body)"
                filter="url(#battery-glow)"
              />

              {/* Front Gloss / Specular Arc */}
              <path
                d="M 68,54 C 68,48 76,44 88,44 C 74,44 72,56 72,98 C 72,140 74,152 88,152 C 76,152 68,148 68,142 Z"
                fill="oklch(1 0 89.9)"
                opacity="0.35"
              />

              {/* Metal Contact Top / Bottom Bands */}
              <rect x="68" y="34" width="64" height="10" rx="5" fill="url(#battery-cap)" />
              {/* Terminal Tip */}
              <rect x="88" y="26" width="24" height="10" rx="4" fill="url(#battery-cap)" />

              {/* Bottom Metal Base Band */}
              <rect x="68" y="158" width="64" height="10" rx="5" fill="url(#battery-cap)" />

              {/* Intense Lightning Spark Emblem Inside Glass */}
              <path
                d="M 106,62 L 86,102 L 102,102 L 94,138 L 120,94 L 102,94 Z"
                fill="oklch(0.245 0 0)"
                opacity="0.75"
              />
              <path
                d="M 104,60 L 84,100 L 100,100 L 92,136 L 118,92 L 100,92 Z"
                fill="oklch(1 0 89.9)"
              />
            </svg>
          </motion.div>
        </div>

        {/* Headings & Descriptions (Matching Screenshot 3) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            You earned 1 streak charge
          </h2>
          <p className="text-sm text-neutral-400 font-medium sm:text-base">
            Complete daily sparks to protect your streak against misses
          </p>
        </motion.div>
      </div>

      {/* Bottom Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
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
