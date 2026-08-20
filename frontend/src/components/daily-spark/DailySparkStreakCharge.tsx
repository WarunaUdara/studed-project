import { motion, useReducedMotion } from "framer-motion";

interface DailySparkStreakChargeProps {
  onContinue: () => void;
}

export function DailySparkStreakCharge({
  onContinue,
}: DailySparkStreakChargeProps) {
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
                <filter
                  id="battery-glow"
                  x="-30%"
                  y="-30%"
                  width="160%"
                  height="160%"
                >
                  <feDropShadow
                    dx="0"
                    dy="8"
                    stdDeviation="14"
                    floodColor="rgba(190, 242, 100, 0.45)"
                  />
                </filter>
              </defs>

              {/* Rotated 45-degree 3D Capsule */}
              <g transform="translate(100, 100) rotate(-35) translate(-100, -100)">
                {/* Top Cap Terminal */}
                <rect
                  x="88"
                  y="32"
                  width="24"
                  height="10"
                  rx="3"
                  fill="oklch(0.765 0.025 255.1)"
                />
                {/* Top Main Cap */}
                <rect
                  x="70"
                  y="40"
                  width="60"
                  height="24"
                  rx="8"
                  fill="url(#battery-cap)"
                />

                {/* Glowing Active Battery Body */}
                <rect
                  x="72"
                  y="62"
                  width="56"
                  height="76"
                  rx="6"
                  fill="url(#battery-body)"
                  filter="url(#battery-glow)"
                />

                {/* High-contrast White Lightning Emblem inside body */}
                <path
                  d="M 104,74 L 88,102 L 98,102 L 94,124 L 112,96 L 102,96 Z"
                  fill="oklch(1 0 89.9)"
                  stroke="oklch(0.972 0.069 102.1)"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />

                {/* Bottom Main Cap */}
                <rect
                  x="70"
                  y="136"
                  width="60"
                  height="24"
                  rx="8"
                  fill="url(#battery-cap)"
                />
                {/* Bottom Terminal */}
                <rect
                  x="84"
                  y="158"
                  width="32"
                  height="6"
                  rx="2"
                  fill="oklch(0.628 0.032 253.7)"
                />
              </g>
            </svg>
          </motion.div>
        </div>

        {/* Headline & Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-2"
        >
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            You earned a Streak Charge!
          </h2>
          <p className="text-sm font-medium text-neutral-400 sm:text-base">
            Charges save your streak if you miss a day
          </p>
        </motion.div>
      </div>

      {/* Bottom Continue Action */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-sm pt-4"
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
