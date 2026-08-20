import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface LessonCompleteCelebrationProps {
  totalXp?: number;
  onContinue: () => void;
  className?: string;
}

export function LessonCompleteCelebration({
  totalXp = 140,
  onContinue,
  className = "",
}: LessonCompleteCelebrationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative mx-auto flex w-full max-w-2xl flex-col items-center justify-between rounded-3xl border border-border/80 bg-[#0c0f17] text-white p-8 sm:p-12 shadow-2xl min-h-[540px] text-center ${className}`.trim()}
    >
      <div className="w-full flex justify-end">
        <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs">
          <span>{totalXp}</span>
          <Sparkles className="size-3.5 fill-current" />
        </div>
      </div>

      {/* Center Golden Pedestal & Floating Blob Mascot */}
      <div className="my-auto flex flex-col items-center justify-center space-y-6">
        <div className="relative flex items-center justify-center">
          {/* Radiant Light Beams & Halo Glow */}
          <div className="absolute -top-16 size-48 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-40 rounded-full bg-emerald-500/20 blur-2xl" />

          {/* Floating Blob Mascot */}
          <motion.div
            animate={{ y: [-6, 6, -6], rotate: [-2, 2, -2] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="relative z-20 flex size-20 items-center justify-center drop-shadow-[0_10px_25px_rgba(34,197,94,0.5)]"
          >
            <svg viewBox="0 0 100 100" className="size-full">
              <rect x="18" y="18" width="64" height="64" rx="28" fill="#22c55e" />
              <ellipse cx="50" cy="74" rx="22" ry="6" fill="#15803d" opacity="0.35" />
              {/* Cute Smiling Face with Eye Visor */}
              <rect x="36" y="36" width="28" height="28" rx="8" fill="#0f172a" />
              <rect x="42" y="42" width="16" height="16" rx="4" fill="#ffffff" />
              <rect x="47" y="47" width="6" height="6" rx="1.5" fill="#22c55e" />
            </svg>
          </motion.div>

          {/* Golden Circular Pedestal Platform */}
          <div className="absolute -bottom-8 z-10 flex flex-col items-center">
            {/* 3D Glowing Golden Ring */}
            <div className="relative size-32 rounded-full border-4 border-amber-400 bg-amber-500/20 shadow-[0_0_30px_rgba(251,191,36,0.6)] flex items-center justify-center">
              <div className="size-20 rounded-full border-2 border-amber-300/60 bg-amber-400/30 flex items-center justify-center">
                <div className="size-8 rounded-full bg-amber-300/80 shadow-inner" />
              </div>
            </div>
            {/* Base platform ellipse */}
            <div className="w-36 h-6 rounded-[100%] bg-amber-600/40 blur-sm -mt-2" />
          </div>
        </div>

        {/* Text Title & XP */}
        <div className="space-y-3 pt-8">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            Lesson complete!
          </h2>
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
              TOTAL XP
            </div>
            <div className="text-4xl sm:text-5xl font-black text-white flex items-center justify-center gap-1.5">
              <span>{totalXp}</span>
              <span className="text-emerald-400 text-2xl font-bold">✦ <Zap className="inline size-6" fill="currentColor" /></span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Continue Button */}
      <div className="w-full max-w-sm pt-4">
        <Button
          onClick={onContinue}
          className="w-full rounded-full bg-white hover:bg-neutral-200 text-black font-bold text-sm h-12 shadow-lg hover:shadow-xl transition-all"
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
}
