import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Sparkles, X, XCircle } from "lucide-react";
import { useState } from "react";
import { DailyLessonLimitGate } from "./DailyLessonLimitGate";
import { GearGraphSvg } from "./GearGraphSvg";
import {
  GearNetworkPuzzle,
  SCIENCE_GEAR_PUZZLES,
  solveGearDirections,
} from "./gear-network-engine";
import { LessonCompleteCelebration } from "./LessonCompleteCelebration";
import { Button } from "@/components/ui/button";

export interface ScientificThinkingGearsMasterProps {
  puzzles?: GearNetworkPuzzle[];
  onComplete?: (totalXpEarned: number) => void;
  onClose?: () => void;
  className?: string;
}

export function ScientificThinkingGearsMaster({
  puzzles = SCIENCE_GEAR_PUZZLES,
  onComplete,
  onClose,
  className = "",
}: ScientificThinkingGearsMasterProps) {
  const [stage, setStage] = useState<"playing" | "celebrating" | "limit_gate">("playing");
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [evalState, setEvalState] = useState<"idle" | "correct" | "incorrect">("idle");
  const [wrongNodeIds, setWrongNodeIds] = useState<string[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);

  const puzzle = puzzles[currentPuzzleIndex] || puzzles[0];
  const { depths } = solveGearDirections(
    puzzle.nodes,
    puzzle.edges,
    puzzle.driverId,
    puzzle.driverDirection ?? -1,
  );

  // Toggle selection in tap-to-select puzzles
  const handleToggleNode = (nodeId: string) => {
    if (evalState === "correct") return;
    setSelectedNodeIds((prev) =>
      prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId],
    );
    if (evalState !== "idle") {
      setEvalState("idle");
      setWrongNodeIds([]);
    }
  };

  const handleResetSelections = () => {
    setSelectedNodeIds([]);
    setEvalState("idle");
    setWrongNodeIds([]);
  };

  // Evaluate current puzzle
  const handleCheck = () => {
    if (puzzle.type === "multiple_choice") {
      if (selectedOption === null) return;
      const isCorrect = puzzle.options?.[selectedOption]?.isCorrect ?? false;
      if (isCorrect) {
        setEvalState("correct");
      } else {
        setEvalState("incorrect");
      }
    } else if (puzzle.type === "tap_to_select") {
      // Find all target correct nodes: any node (excluding driver) with even depth (0, 2, 4...)
      const targetCorrectIds = puzzle.nodes
        .filter((n) => !n.isDriver && (depths[n.id] ?? 0) % 2 === 0)
        .map((n) => n.id);

      const hasAllCorrect =
        targetCorrectIds.every((id) => selectedNodeIds.includes(id)) &&
        selectedNodeIds.length === targetCorrectIds.length;

      if (hasAllCorrect) {
        setEvalState("correct");
        setWrongNodeIds([]);
      } else {
        const wrongs = selectedNodeIds.filter((id) => !targetCorrectIds.includes(id));
        setWrongNodeIds(wrongs.length > 0 ? wrongs : selectedNodeIds);
        setEvalState("incorrect");
      }
    }
  };

  // Advance to next puzzle or finish wave
  const handleAdvance = () => {
    if (currentPuzzleIndex < puzzles.length - 1) {
      setCurrentPuzzleIndex((prev) => prev + 1);
      setSelectedOption(null);
      setSelectedNodeIds([]);
      setEvalState("idle");
      setWrongNodeIds([]);
    } else {
      onComplete?.(140);
      setStage("celebrating");
    }
  };

  const isLastPuzzle = currentPuzzleIndex === puzzles.length - 1;
  const isLearnDemo = puzzle.type === "learn_demo";

  if (stage === "celebrating") {
    return (
      <LessonCompleteCelebration
        totalXp={140}
        onContinue={() => setStage("limit_gate")}
        className={className}
      />
    );
  }

  if (stage === "limit_gate") {
    return (
      <DailyLessonLimitGate
        onWaitTomorrow={() => {
          if (onClose) onClose();
          else window.location.assign("/dashboard");
        }}
        onKeepLearning={() => {
          window.location.assign("/dashboard");
        }}
        className={className}
      />
    );
  }

  return (
    <div
      className={`relative mx-auto flex w-full max-w-4xl flex-col items-center justify-between rounded-3xl border border-border/80 bg-[#0c0f17] text-white p-6 sm:p-8 shadow-2xl min-h-[580px] overflow-hidden ${className}`.trim()}
    >
      {/* Top Header: Close, Multi-Segment Progress Bar, XP */}
      <div className="w-full flex items-center justify-between gap-4 pb-4">
        <button
          type="button"
          onClick={onClose}
          className="size-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close wave"
        >
          <X className="size-4" />
        </button>

        {/* Segmented Step Progress Bar */}
        <div className="flex items-center gap-1.5 flex-1 max-w-sm mx-auto">
          {puzzles.map((_, idx) => {
            const isFinished =
              currentPuzzleIndex > idx ||
              (currentPuzzleIndex === idx && (evalState === "correct" || isLearnDemo));
            const isCurrent = currentPuzzleIndex === idx;

            return (
              <div
                key={idx}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                  isFinished || isCurrent
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                    : "bg-neutral-800"
                }`}
              />
            );
          })}
        </div>

        {/* XP Counter */}
        <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs">
          <span>{currentPuzzleIndex * 30 + (evalState === "correct" ? 30 : 0)}</span>
          <Sparkles className="size-3.5 fill-current" />
        </div>
      </div>

      {/* Main Puzzle Stage */}
      <div className="my-auto w-full flex flex-col items-center justify-center text-center py-2 space-y-4">
        {/* Title & Subtitle */}
        <div className="space-y-1 max-w-xl">
          <h2 className="text-base sm:text-lg font-bold text-neutral-100">
            {puzzle.subtitle}
          </h2>
          {puzzle.teachingNote && (
            <p className="text-xs text-neutral-400 font-medium">{puzzle.teachingNote}</p>
          )}
        </div>

        {/* 2D Gear Graph Arena */}
        <div className="w-full flex items-center justify-center py-2">
          <GearGraphSvg
            puzzle={puzzle}
            selectedIds={selectedNodeIds}
            onToggleNode={handleToggleNode}
            onReset={handleResetSelections}
            isRotating={isLearnDemo || evalState === "correct"}
            evaluated={evalState === "idle" ? null : evalState}
            wrongIds={wrongNodeIds}
          />
        </div>

        {/* Multiple Choice Options if puzzle type is multiple_choice */}
        {puzzle.type === "multiple_choice" && puzzle.options && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
            {puzzle.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectOpt = opt.isCorrect;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (evalState === "idle") setSelectedOption(idx);
                  }}
                  disabled={evalState === "correct"}
                  className={`relative flex items-center justify-center rounded-2xl border p-4 text-xs sm:text-sm font-semibold transition-all ${
                    evalState === "correct" && isSelected && isCorrectOpt
                      ? "border-emerald-500 bg-emerald-950/40 text-emerald-300 ring-2 ring-emerald-400/40 shadow-lg"
                      : evalState === "incorrect" && isSelected && !isCorrectOpt
                        ? "border-rose-500 bg-rose-950/40 text-rose-300 ring-2 ring-rose-400/40 shadow-lg"
                        : isSelected
                          ? "border-primary bg-primary/15 text-white ring-2 ring-primary/40 shadow-md"
                          : "border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  <span>{opt.label}</span>
                  {evalState === "correct" && isSelected && isCorrectOpt && (
                    <CheckCircle2 className="size-4 text-emerald-400 absolute right-3" />
                  )}
                  {evalState === "incorrect" && isSelected && !isCorrectOpt && (
                    <XCircle className="size-4 text-rose-400 absolute right-3" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Controls & Blob Mascot */}
      <div className="w-full flex items-end justify-between pt-4 border-t border-white/10">
        {/* Blob Mascot (Left Corner) */}
        <div className="flex items-center gap-3">
          <div className="relative flex size-12 items-center justify-center drop-shadow-md">
            <svg viewBox="0 0 100 100" className="size-full">
              <rect x="18" y="18" width="64" height="64" rx="28" fill="#22c55e" />
              <ellipse cx="50" cy="74" rx="22" ry="6" fill="#15803d" opacity="0.3" />
              {/* Visor */}
              <rect x="36" y="36" width="28" height="28" rx="8" fill="#0f172a" />
              <rect x="42" y="42" width="16" height="16" rx="4" fill="#ffffff" />
              <rect x="47" y="47" width="6" height="6" rx="1.5" fill="#22c55e" />
            </svg>
          </div>

          {/* Speech bubble feedback */}
          <AnimatePresence>
            {evalState === "correct" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                className="relative rounded-2xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md"
              >
                <span>That's it!</span>
                <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 size-3 bg-emerald-600 rotate-45" />
              </motion.div>
            )}

            {evalState === "incorrect" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                className="relative rounded-2xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md"
              >
                <span>
                  {puzzle.type === "tap_to_select"
                    ? "You selected at least one incorrect gear."
                    : "Not quite. Think about the chain parity!"}
                </span>
                <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 size-3 bg-amber-600 rotate-45" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isLearnDemo && (
            <Button
              onClick={handleAdvance}
              className="rounded-full bg-white hover:bg-neutral-200 text-black font-bold text-xs sm:text-sm px-7 h-11 shadow-sm"
            >
              {isLastPuzzle ? "Finish" : "Continue"}
            </Button>
          )}

          {!isLearnDemo && evalState === "idle" && (
            <Button
              onClick={handleCheck}
              disabled={
                puzzle.type === "multiple_choice"
                  ? selectedOption === null
                  : selectedNodeIds.length === 0
              }
              className="rounded-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm px-7 h-11 shadow-sm"
            >
              Check
            </Button>
          )}

          {!isLearnDemo && evalState === "correct" && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExplanation(true)}
                className="rounded-full border-neutral-700 text-neutral-300 hover:bg-white/10 text-xs font-bold h-11 px-4"
              >
                Why?
              </Button>
              <Button
                onClick={handleAdvance}
                className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs sm:text-sm px-7 h-11 shadow-sm"
              >
                {isLastPuzzle ? "Finish" : "Continue"}
              </Button>
            </div>
          )}

          {!isLearnDemo && evalState === "incorrect" && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExplanation(true)}
                className="rounded-full border-neutral-700 text-neutral-300 hover:bg-white/10 text-xs font-bold h-11 px-4"
              >
                See answer
              </Button>
              <Button
                onClick={() => {
                  setEvalState("idle");
                  setWrongNodeIds([]);
                }}
                className="rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs sm:text-sm px-7 h-11 shadow-sm"
              >
                Try again
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Explanation Walkthrough Modal */}
      <AnimatePresence>
        {showExplanation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-foreground">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 text-foreground shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h4 className="text-lg font-bold font-serif text-foreground">
                  {puzzle.explanation.title}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowExplanation(false)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {puzzle.explanation.steps.map((step, idx) => (
                  <p key={idx}>{step}</p>
                ))}

                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-300 font-medium">
                  💡 {puzzle.explanation.rule}
                </div>
              </div>

              <Button
                onClick={() => setShowExplanation(false)}
                className="w-full rounded-full font-bold text-xs"
              >
                Got it
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
