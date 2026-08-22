import { AnimatePresence, motion } from "framer-motion";
import { Flag, HelpCircle, PartyPopper, Sparkles, X, Zap } from "lucide-react";
import { useState } from "react";
import { FractionTriangle, TRIANGLE_REGIONS } from "./FractionTriangle";
import type { SparkTask } from "./types";

interface DailySparkTaskCardProps {
  task: SparkTask;
  courseTitle?: string;
  currentIndex: number;
  totalTasks: number;
  currentXp: number;
  onCorrect: (xpEarned: number) => void;
  onExit: () => void;
}

export function DailySparkTaskCard({
  task,
  courseTitle,
  currentIndex,
  totalTasks,
  currentXp,
  onCorrect,
  onExit,
}: DailySparkTaskCardProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleToggleRegion = (id: string) => {
    if (isEvaluated && isCorrect) return;
    setIsEvaluated(false);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCheck = () => {
    // Calculate total fractional area of selected pieces
    let selectedArea = 0;
    for (const region of TRIANGLE_REGIONS) {
      if (selectedIds.has(region.id)) {
        selectedArea += region.areaFraction;
      }
    }

    const diff = Math.abs(selectedArea - task.targetFraction);
    const passed = diff < 0.001;

    setIsEvaluated(true);
    setIsCorrect(passed);
  };

  const handleContinue = () => {
    onCorrect(task.xpReward);
    setSelectedIds(new Set());
    setIsEvaluated(false);
    setIsCorrect(false);
    setShowExplanation(false);
  };

  const handleReset = () => {
    setSelectedIds(new Set());
    setIsEvaluated(false);
    setIsCorrect(false);
  };

  return (
    <div className="relative flex min-h-[580px] w-full max-w-4xl flex-col justify-between rounded-3xl border border-white/10 bg-[oklch(0.421_0.01_270.3)] p-6 text-white shadow-2xl transition-all sm:p-8">
      {/* Top Header & Step Progress Bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Close Button */}
        <button
          type="button"
          onClick={onExit}
          className="flex size-9 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Exit Daily Spark"
        >
          <X className="size-5" />
        </button>

        {/* Center: Segmented Pills Progress Bar */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalTasks }).map((_, i) => {
            const isCompleted = i < currentIndex || (i === currentIndex && isCorrect);
            const isCurrent = i === currentIndex && !isCorrect;

            return (
              <div
                key={i}
                className={`h-2 transition-all duration-300 ${
                  isCompleted
                    ? "w-4 rounded-full bg-emerald-500"
                    : isCurrent
                      ? "w-7 rounded-full bg-white"
                      : "size-2 rounded-full bg-neutral-700"
                }`}
              />
            );
          })}
        </div>

        {/* Right: XP & Energy Counter */}
        <div className="flex items-center gap-1.5 font-bold text-sm tracking-tight text-neutral-300">
          <span className="text-white">{currentXp}</span>
          <Sparkles className="size-4 fill-emerald-400 text-emerald-400" />
          <Zap className="size-4 fill-amber-400 text-amber-400" />
        </div>
      </div>

      {/* Main Challenge Area Card */}
      <div
        className={`relative my-4 flex flex-1 flex-col items-center justify-center rounded-2xl border p-6 transition-all duration-300 sm:p-8 ${
          isCorrect
            ? "border-emerald-500/80 bg-[oklch(0.458_0.014_160.2)] shadow-lg shadow-emerald-950/40"
            : "border-white/5 bg-[oklch(0.456_0.011_274.1)]"
        }`}
      >
        {/* Flag Icon on Top-Left (as seen in screenshot 2) */}
        {isCorrect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-4 left-4 text-neutral-500"
          >
            <Flag className="size-4 fill-neutral-500" />
          </motion.div>
        )}

        {/* Challenge Prompt */}
        <div className="mb-6 text-center">
          {courseTitle && (
            <div className="mb-2.5 flex items-center justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-bold text-emerald-400">
                <Sparkles className="size-3 text-emerald-400" />
                {courseTitle}
              </span>
            </div>
          )}
          <h2 className="flex items-center justify-center gap-1.5 text-lg font-bold text-neutral-100 sm:text-xl">
            <span>Color</span>
            <span className="inline-flex flex-col items-center px-1 text-sm leading-none font-extrabold text-white">
              <span className="border-b-2 border-white pb-0.5">{task.numerator}</span>
              <span className="pt-0.5">{task.denominator}</span>
            </span>
            <span>of the triangle.</span>
          </h2>
        </div>

        {/* Geometric Partition Triangle */}
        <FractionTriangle
          selectedIds={selectedIds}
          onToggleRegion={handleToggleRegion}
          disabled={isCorrect}
          isCorrect={isCorrect}
        />
      </div>

      {/* Bottom Action & Feedback Bar */}
      <div className="mt-2 min-h-[56px] w-full">
        <AnimatePresence mode="wait">
          {!isEvaluated ? (
            <div key="action-uncheck" className="flex justify-center">
              <button
                type="button"
                onClick={handleCheck}
                disabled={selectedIds.size === 0}
                className={`h-12 w-full max-w-sm rounded-full font-bold text-sm transition-all duration-200 ${
                  selectedIds.size > 0
                    ? "bg-white text-black shadow-lg hover:bg-neutral-200 active:scale-98"
                    : "cursor-not-allowed bg-neutral-800 text-neutral-500"
                }`}
              >
                Check
              </button>
            </div>
          ) : isCorrect ? (
            <motion.div
              key="action-correct"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-wrap items-center justify-between gap-4"
            >
              {/* Left Indicator */}
              <div className="flex items-center gap-2">
                <PartyPopper className="size-5 text-emerald-400" />
                <span className="font-extrabold text-base text-white">Correct!</span>
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowExplanation(true)}
                  className="h-11 rounded-full bg-neutral-800 px-5 font-bold text-sm text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white"
                >
                  Why?
                </button>
                <button
                  type="button"
                  onClick={handleContinue}
                  className="h-11 rounded-full bg-emerald-500 px-8 font-bold text-sm text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 active:scale-98"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="action-incorrect"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="size-5 text-amber-400" />
                <span className="font-bold text-sm text-amber-400">
                  Not quite the target area. Try another combination!
                </span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="h-11 rounded-full bg-neutral-800 px-6 font-bold text-sm text-white transition-colors hover:bg-neutral-700"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* "Why?" Explanation Popover Modal */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center rounded-3xl bg-black/80 p-6 backdrop-blur-md"
            onClick={() => setShowExplanation(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-white/20 bg-[oklch(0.501_0.014_270.1)] p-6 shadow-2xl text-left"
            >
              <h3 className="text-lg font-bold text-white mb-2">
                Geometric Proof &amp; Explanation
              </h3>
              <p className="text-sm text-neutral-300 leading-relaxed mb-6">{task.explanation}</p>
              <button
                type="button"
                onClick={() => setShowExplanation(false)}
                className="w-full h-10 rounded-full bg-white text-black font-bold text-sm hover:bg-neutral-200 transition-colors"
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
