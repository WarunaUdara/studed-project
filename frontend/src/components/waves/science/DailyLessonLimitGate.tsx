import { motion, useReducedMotion } from "framer-motion";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DailyLessonLimitGateProps {
  onWaitTomorrow: () => void;
  onKeepLearning: () => void;
  className?: string;
}

export function DailyLessonLimitGate({
  onWaitTomorrow,
  onKeepLearning,
  className = "",
}: DailyLessonLimitGateProps) {
  const reduce = useReducedMotion();
  const float = reduce ? undefined : { y: [-4, 4, -4], rotate: [-4, 4, -4] };
  const floatReverse = reduce ? undefined : { y: [4, -4, 4], rotate: [3, -3, 3] };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative mx-auto flex w-full max-w-2xl flex-col items-center justify-between rounded-3xl border border-border/80 bg-[#0c0f17] text-white p-8 sm:p-12 shadow-2xl min-h-[540px] text-center ${className}`.trim()}
    >
      <div className="w-full flex justify-end" />

      {/* Center 3D Iridescent Padlock & Blob Mascot */}
      <div className="my-auto flex flex-col items-center justify-center space-y-6">
        <div className="relative flex items-center justify-center">
          {/* Multi-colored Gradient Halo (Purple/Pink/Cyan) */}
          <div className="absolute -top-12 size-48 rounded-full bg-gradient-to-tr from-purple-600/30 via-pink-500/25 to-cyan-400/25 blur-3xl" />

          {/* Floating Blob Mascot & Rainbow Lock */}
          <div className="relative z-20 flex items-center justify-center gap-3">
            {/* Blob Mascot */}
            <motion.div
              animate={float}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
              className="flex size-16 items-center justify-center drop-shadow-xl"
            >
              <svg viewBox="0 0 100 100" className="size-full" role="img" aria-label="Curious blob mascot">
                <title>Curious blob mascot</title>
                <rect x="18" y="18" width="64" height="64" rx="28" fill="#22c55e" />
                <ellipse cx="50" cy="74" rx="22" ry="6" fill="#15803d" opacity="0.35" />
                {/* Curious Face */}
                <rect x="36" y="36" width="28" height="28" rx="8" fill="#0f172a" />
                <rect x="42" y="42" width="16" height="16" rx="4" fill="#ffffff" />
                <rect x="47" y="47" width="6" height="6" rx="1.5" fill="#22c55e" />
              </svg>
            </motion.div>

            {/* 3D Rainbow Gradient Padlock */}
            <motion.div
              animate={floatReverse}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
              className="relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 p-3 shadow-[0_10px_30px_rgba(236,72,153,0.5)] border-2 border-white/30"
            >
              <Lock className="size-8 text-white stroke-[2.5]" />
            </motion.div>
          </div>

          {/* Iridescent Circular Pedestal */}
          <div className="absolute -bottom-8 z-10 flex flex-col items-center">
            <div className="relative size-32 rounded-full border-4 border-purple-400/80 bg-gradient-to-b from-purple-500/30 to-pink-500/20 shadow-[0_0_35px_rgba(168,85,247,0.5)] flex items-center justify-center">
              <div className="size-20 rounded-full border-2 border-purple-300/40 bg-purple-400/20" />
            </div>
            <div className="w-36 h-6 rounded-[100%] bg-purple-900/40 blur-sm -mt-2" />
          </div>
        </div>

        {/* Text Title */}
        <div className="space-y-2 pt-8 max-w-sm">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            You're out of free lessons for today
          </h2>
        </div>
      </div>

      {/* Bottom Dual Actions */}
      <div className="w-full max-w-sm flex flex-col space-y-3 pt-4">
        <Button
          variant="outline"
          onClick={onWaitTomorrow}
          className="w-full rounded-full border-neutral-700 bg-black/40 hover:bg-white/10 text-neutral-200 font-bold text-sm h-12"
        >
          Wait until tomorrow
        </Button>

        <Button
          onClick={onKeepLearning}
          className="w-full rounded-full bg-white hover:bg-neutral-200 text-black font-bold text-sm h-12 shadow-lg hover:shadow-xl transition-all"
        >
          Keep learning now
        </Button>
      </div>
    </motion.div>
  );
}
