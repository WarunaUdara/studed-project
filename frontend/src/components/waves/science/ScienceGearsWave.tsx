import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Sparkles, X, XCircle } from "lucide-react";
import { useState } from "react";
import { GearTrainSvg, SingleGear } from "./GearTrainSvg";
import { InteractiveGearTrain } from "./InteractiveGearTrain";
import { Button } from "@/components/ui/button";

export interface ScienceGearsWaveProps {
  onComplete?: (xpEarned: number) => void;
  onClose?: () => void;
  className?: string;
}

export function ScienceGearsWave({
  onComplete,
  onClose,
  className = "",
}: ScienceGearsWaveProps) {
  // Steps: 0 = Intro, 1 = 2-Gear Principle, 2 = 3-Gear Opposite Neighbors, 3 = 3-Gear Evaluate, 4 = 5-Gear Interactive Tap Challenge
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2 | 3 | 4>(0);

  // Step 3 state (3-gear multiple choice)
  const [selectedOption3, setSelectedOption3] = useState<"same" | "opposite" | null>(null);
  const [evalState3, setEvalState3] = useState<"idle" | "correct" | "incorrect">("idle");

  // Step 4 state (5-gear interactive selection)
  const [selectedGearIndices, setSelectedGearIndices] = useState<number[]>([]);
  const [evalState4, setEvalState4] = useState<"idle" | "correct" | "incorrect">("idle");
  const [wrongIndices4, setWrongIndices4] = useState<number[]>([]);

  // Explanation Modal
  const [showExplanation, setShowExplanation] = useState(false);

  // Handle 3-Gear Multiple Choice Check
  const handleCheckStep3 = () => {
    if (!selectedOption3) return;
    if (selectedOption3 === "same") {
      setEvalState3("correct");
    } else {
      setEvalState3("incorrect");
    }
  };

  // Handle 5-Gear Interactive Toggle
  const handleToggleGear = (index: number) => {
    if (evalState4 === "correct") return;
    setSelectedGearIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
    if (evalState4 !== "idle") {
      setEvalState4("idle");
      setWrongIndices4([]);
    }
  };

  // Handle 5-Gear Check
  const handleCheckStep4 = () => {
    // In a 5-gear chain with index 0 as driver:
    // Index 0: same (Driver)
    // Index 1: opposite
    // Index 2: same (Correct!)
    // Index 3: opposite
    // Index 4: same (Correct!)
    // Correct selection must include both index 2 and index 4, and NO even neighbors (index 1, 3).
    const correctIndices = [2, 4];
    const hasAllCorrect =
      correctIndices.every((i) => selectedGearIndices.includes(i)) &&
      selectedGearIndices.length === correctIndices.length;

    if (hasAllCorrect) {
      setEvalState4("correct");
      setWrongIndices4([]);
      onComplete?.(30);
    } else {
      // Flag incorrect indices
      const wrongs = selectedGearIndices.filter((i) => !correctIndices.includes(i));
      setWrongIndices4(wrongs.length > 0 ? wrongs : selectedGearIndices);
      setEvalState4("incorrect");
    }
  };

  const handleResetStep4 = () => {
    setSelectedGearIndices([]);
    setEvalState4("idle");
    setWrongIndices4([]);
  };

  const totalSteps = 5;

  return (
    <div
      className={`relative mx-auto flex w-full max-w-4xl flex-col items-center justify-between rounded-3xl border border-border/80 bg-[#0c0f17] text-white p-6 sm:p-8 shadow-2xl min-h-[580px] overflow-hidden ${className}`.trim()}
    >
      {/* Top Header Bar: Close, Segmented Progress Bar, XP */}
      <div className="w-full flex items-center justify-between gap-4 pb-4">
        <button
          type="button"
          onClick={onClose}
          className="size-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close wave"
        >
          <X className="size-4" />
        </button>

        {/* 5-Step Segmented Progress Bar */}
        <div className="flex items-center gap-1.5 flex-1 max-w-sm mx-auto">
          {Array.from({ length: totalSteps }).map((_, idx) => {
            const isFinished = currentStep > idx || (currentStep === 4 && evalState4 === "correct");
            const isCurrent = currentStep === idx;
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
          <span>{currentStep >= 3 ? "30" : "15"}</span>
          <Sparkles className="size-3.5 fill-current" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="my-auto w-full flex flex-col items-center justify-center text-center py-4">
        {currentStep === 0 && (
          // Step 0: Learn Block 1 — Intro to Connecting Gears
          <motion.div
            key="step-0"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col items-center space-y-6 max-w-lg"
          >
            <div className="py-2">
              <GearTrainSvg mode="intro_3gears" isRotating={true} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                Connecting Gears
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 font-medium">
                Let's use intuition to predict the behavior of a chain of gears.
              </p>
            </div>
          </motion.div>
        )}

        {currentStep === 1 && (
          // Step 1: Learn Block 2 — Principle of Adjacent Gears
          <motion.div
            key="step-1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col items-center space-y-6 max-w-lg"
          >
            <div className="py-4">
              <GearTrainSvg mode="teaching_2gears" isRotating={true} />
            </div>

            <div className="space-y-2 max-w-md">
              <h3 className="text-base sm:text-lg font-semibold text-neutral-200 leading-relaxed">
                Adjacent gears in a chain rotate in opposite directions.
              </h3>
            </div>
          </motion.div>
        )}

        {currentStep === 2 && (
          // Step 2: Learn Block 3 — Opposite Neighbors in Chain (Screenshot 1)
          <motion.div
            key="step-2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col items-center space-y-6 max-w-lg"
          >
            <div className="space-y-1 max-w-md">
              <h3 className="text-sm sm:text-base font-semibold text-neutral-200">
                In any system of gears, each one spins opposite its neighbors.
              </h3>
            </div>

            {/* 3 Meshed Rotating Gears with Dynamic Arrows */}
            <div className="relative flex items-center justify-center py-2">
              <div className="relative -mr-6 z-10">
                <SingleGear
                  radius={52}
                  color="#eab308"
                  shadowColor="#ca8a04"
                  isRotating={true}
                  direction={-1}
                  showRotationArrow={true}
                />
              </div>
              <div className="relative -mx-6 z-0">
                <SingleGear
                  radius={52}
                  color="#14b8a6"
                  shadowColor="#0f766e"
                  isRotating={true}
                  direction={1}
                  showRotationArrow={true}
                />
              </div>
              <div className="relative -ml-6 z-10">
                <SingleGear
                  radius={52}
                  color="#eab308"
                  shadowColor="#ca8a04"
                  isRotating={true}
                  direction={-1}
                  showRotationArrow={true}
                />
              </div>
            </div>

            <p className="text-xs sm:text-sm text-neutral-400 font-medium">
              Let's see how this extends to systems with more gears.
            </p>
          </motion.div>
        )}

        {currentStep === 3 && (
          // Step 3: Evaluate Block — 3-Gear Prediction Question
          <motion.div
            key="step-3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center space-y-6 w-full max-w-xl"
          >
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-semibold text-neutral-200">
                When the yellow gear is turned in one direction, which way does the blue gear turn?
              </h3>
            </div>

            <div className="py-2">
              <GearTrainSvg
                mode="evaluate_3gears"
                isRotating={evalState3 === "correct"}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
              <button
                type="button"
                onClick={() => {
                  if (evalState3 === "idle") setSelectedOption3("same");
                }}
                disabled={evalState3 === "correct"}
                className={`relative flex items-center justify-center rounded-2xl border p-4 text-xs sm:text-sm font-semibold transition-all ${
                  evalState3 === "correct" && selectedOption3 === "same"
                    ? "border-emerald-500 bg-emerald-950/40 text-emerald-300 ring-2 ring-emerald-400/40 shadow-lg"
                    : selectedOption3 === "same"
                      ? "border-primary bg-primary/15 text-white ring-2 ring-primary/40 shadow-md"
                      : "border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                <span>In the same direction.</span>
                {evalState3 === "correct" && selectedOption3 === "same" && (
                  <CheckCircle2 className="size-4 text-emerald-400 absolute right-3" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (evalState3 === "idle") setSelectedOption3("opposite");
                }}
                disabled={evalState3 === "correct"}
                className={`relative flex items-center justify-center rounded-2xl border p-4 text-xs sm:text-sm font-semibold transition-all ${
                  evalState3 === "incorrect" && selectedOption3 === "opposite"
                    ? "border-rose-500 bg-rose-950/40 text-rose-300 ring-2 ring-rose-400/40 shadow-lg"
                    : selectedOption3 === "opposite"
                      ? "border-primary bg-primary/15 text-white ring-2 ring-primary/40 shadow-md"
                      : "border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                <span>In the opposite direction.</span>
                {evalState3 === "incorrect" && selectedOption3 === "opposite" && (
                  <XCircle className="size-4 text-rose-400 absolute right-3" />
                )}
              </button>
            </div>
          </motion.div>
        )}

        {currentStep === 4 && (
          // Step 4: Evaluate Block — 5-Gear Interactive Touch/Click Selection (Screenshots 2, 3, 4, 5)
          <motion.div
            key="step-4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center space-y-5 w-full max-w-2xl"
          >
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-semibold text-neutral-200">
                Which gears turn in the same direction as the yellow gear?
              </h3>
              <p className="text-xs text-neutral-400 font-medium">
                Tap a gear to select it.
              </p>
            </div>

            {/* Interactive 5-Gear Train */}
            <div className="py-2 w-full">
              <InteractiveGearTrain
                gearCount={5}
                selectedIndices={selectedGearIndices}
                onToggleGear={handleToggleGear}
                onReset={handleResetStep4}
                isRotating={evalState4 === "correct"}
                evaluated={evalState4 === "idle" ? null : evalState4}
                wrongIndices={wrongIndices4}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom Mascot & Dynamic Action Controls */}
      <div className="w-full flex items-end justify-between pt-4 border-t border-white/10">
        {/* Cute Green Blob Mascot (Left Corner) */}
        <div className="flex items-center gap-3">
          <div className="relative flex size-12 items-center justify-center drop-shadow-md">
            <svg viewBox="0 0 100 100" className="size-full">
              <rect x="18" y="18" width="64" height="64" rx="28" fill="#22c55e" />
              <ellipse cx="50" cy="74" rx="22" ry="6" fill="#15803d" opacity="0.3" />
              {/* Eye Visor */}
              <rect x="36" y="36" width="28" height="28" rx="8" fill="#0f172a" />
              <rect x="42" y="42" width="16" height="16" rx="4" fill="#ffffff" />
              <rect x="47" y="47" width="6" height="6" rx="1.5" fill="#22c55e" />
            </svg>
          </div>

          {/* Speech bubbles based on state */}
          <AnimatePresence>
            {(evalState3 === "correct" || evalState4 === "correct") && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                className="relative rounded-2xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md"
              >
                <span>That's it!</span>
                <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 size-3 bg-emerald-600 rotate-45" />
              </motion.div>
            )}

            {evalState4 === "incorrect" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                className="relative rounded-2xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md"
              >
                <span>You selected at least one incorrect gear.</span>
                <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 size-3 bg-amber-600 rotate-45" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {currentStep < 3 && (
            <Button
              onClick={() => setCurrentStep((p) => (p + 1) as 1 | 2 | 3)}
              className="rounded-full bg-white hover:bg-neutral-200 text-black font-bold text-xs sm:text-sm px-7 h-11 shadow-sm"
            >
              Continue
            </Button>
          )}

          {currentStep === 3 && evalState3 === "idle" && (
            <Button
              onClick={handleCheckStep3}
              disabled={!selectedOption3}
              className="rounded-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm px-7 h-11 shadow-sm"
            >
              Check
            </Button>
          )}

          {currentStep === 3 && evalState3 === "correct" && (
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
                onClick={() => setCurrentStep(4)}
                className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs sm:text-sm px-7 h-11 shadow-sm"
              >
                Continue
              </Button>
            </div>
          )}

          {currentStep === 3 && evalState3 === "incorrect" && (
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
                onClick={() => {
                  setSelectedOption3(null);
                  setEvalState3("idle");
                }}
                className="rounded-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs sm:text-sm px-7 h-11 shadow-sm"
              >
                Retry
              </Button>
            </div>
          )}

          {currentStep === 4 && evalState4 === "idle" && (
            <Button
              onClick={handleCheckStep4}
              disabled={selectedGearIndices.length === 0}
              className="rounded-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm px-7 h-11 shadow-sm"
            >
              Check
            </Button>
          )}

          {currentStep === 4 && evalState4 === "correct" && (
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
                onClick={() => onComplete?.(30)}
                className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs sm:text-sm px-7 h-11 shadow-sm"
              >
                Continue
              </Button>
            </div>
          )}

          {currentStep === 4 && evalState4 === "incorrect" && (
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
                  setEvalState4("idle");
                  setWrongIndices4([]);
                }}
                className="rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs sm:text-sm px-7 h-11 shadow-sm"
              >
                Try again
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Explanation Modal */}
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
                  Scientific Thinking: Chain of Gears
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
                <p>
                  In a linear gear chain, each gear inverts the direction of rotation:
                </p>
                <div className="rounded-2xl border border-border/60 bg-muted/40 p-3 font-mono text-xs space-y-1">
                  <div>1st Gear (Yellow): Counter-Clockwise (↺)</div>
                  <div>2nd Gear: Clockwise (↻)</div>
                  <div className="text-emerald-500 font-bold">3rd Gear: Counter-Clockwise (↺) ✓</div>
                  <div>4th Gear: Clockwise (↻)</div>
                  <div className="text-emerald-500 font-bold">5th Gear: Counter-Clockwise (↺) ✓</div>
                </div>
                <p>
                  Therefore, every <strong>odd-numbered gear</strong> (3rd and 5th) turns in the <strong>same direction</strong> as the initial yellow gear!
                </p>
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
