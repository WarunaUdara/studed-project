import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, HelpCircle, MoveRight, RotateCcw, Sparkles, XCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { playErrorSound, playSuccessSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface StepConfig {
  id: string;
  title: string;
  instruction: string;
  mode: "move_axis" | "vector_demo" | "select_point" | "identify_point";
  targetPoint: { x: number; y: number };
  initialPoint?: { x: number; y: number };
  candidatePoints?: { x: number; y: number }[];
  explanation: string;
  xBounds?: { min: number; max: number };
  yBounds?: { min: number; max: number };
}

const DEFAULT_STEPS: StepConfig[] = [
  {
    id: "step-1",
    title: "1. Horizontal Movement (x-axis)",
    instruction: "Move the point 3 grid steps to the right along the x-axis.",
    mode: "move_axis",
    initialPoint: { x: 0, y: 0 },
    targetPoint: { x: 3, y: 0 },
    explanation:
      "The horizontal line is the x-axis. Moving right increases the x-coordinate from 0 to 3.",
  },
  {
    id: "step-2",
    title: "2. Vector & Displacements",
    instruction: "Observe how horizontal and vertical distances reach point (5, 4) from the origin (0, 0).",
    mode: "vector_demo",
    initialPoint: { x: 0, y: 0 },
    targetPoint: { x: 5, y: 4 },
    explanation:
      "The origin (0, 0) is the reference point. From the origin, we go 5 steps right along the x-axis, then 4 steps up along the y-axis to reach (5, 4).",
  },
  {
    id: "step-3",
    title: "3. Plotting Coordinate Pairs",
    instruction: "Select the point that is 3 steps right and 1 step up from the origin.",
    mode: "select_point",
    targetPoint: { x: 3, y: 1 },
    candidatePoints: [
      { x: 3, y: 3 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
      { x: 3, y: 1 },
    ],
    explanation:
      "Starting at origin (0,0): 3 steps right gives x = 3. 1 step up gives y = 1. The coordinate pair is (3, 1).",
  },
  {
    id: "step-4",
    title: "4. Identifying Coordinates",
    instruction: "Find point (4, 3) on the coordinate grid.",
    mode: "select_point",
    targetPoint: { x: 4, y: 3 },
    candidatePoints: [
      { x: 2, y: 4 },
      { x: 4, y: 3 },
      { x: 3, y: 4 },
      { x: 4, y: 2 },
      { x: 1, y: 3 },
    ],
    explanation:
      "Coordinates are written as (x, y). First number = horizontal shift right, second number = vertical shift up.",
  },
];

interface CoordinatePlaneBlockProps {
  content?: string;
  metadata?: string | null;
}

export function CoordinatePlaneBlock({ content: _content, metadata }: CoordinatePlaneBlockProps) {
  let customSteps: StepConfig[] | null = null;
  if (metadata) {
    try {
      const parsed = JSON.parse(metadata);
      if (Array.isArray(parsed.steps)) {
        customSteps = parsed.steps;
      }
    } catch {
      // Use fallback steps
    }
  }

  const steps = customSteps ?? DEFAULT_STEPS;
  const [stepIdx, setStepIdx] = useState(0);
  const currentStep = steps[stepIdx] || steps[0];

  const [currentPos, setCurrentPos] = useState<{ x: number; y: number }>(
    currentStep.initialPoint ?? { x: 0, y: 0 }
  );
  const [selectedPoint, setSelectedPoint] = useState<{ x: number; y: number } | null>(null);
  const [status, setStatus] = useState<"idle" | "correct" | "incorrect">("idle");
  const [showWhy, setShowWhy] = useState(false);

  const xMax = currentStep.xBounds?.max ?? 6;
  const yMax = currentStep.yBounds?.max ?? 6;

  // Grid drawing parameters
  const padding = 40;
  const width = 360;
  const height = 360;
  const gridW = width - padding * 2;
  const gridH = height - padding * 2;

  const toSvgX = (x: number) => padding + (x / xMax) * gridW;
  const toSvgY = (y: number) => height - padding - (y / yMax) * gridH;

  const handleResetStep = () => {
    setCurrentPos(currentStep.initialPoint ?? { x: 0, y: 0 });
    setSelectedPoint(null);
    setStatus("idle");
    setShowWhy(false);
  };

  const handleNextStep = () => {
    if (stepIdx < steps.length - 1) {
      const nextIdx = stepIdx + 1;
      setStepIdx(nextIdx);
      const nextStep = steps[nextIdx];
      setCurrentPos(nextStep.initialPoint ?? { x: 0, y: 0 });
      setSelectedPoint(null);
      setStatus("idle");
      setShowWhy(false);
    } else {
      // Loop back or stay
      setStepIdx(0);
      const firstStep = steps[0];
      setCurrentPos(firstStep.initialPoint ?? { x: 0, y: 0 });
      setSelectedPoint(null);
      setStatus("idle");
      setShowWhy(false);
    }
  };

  const handleCheck = () => {
    let isCorrect = false;
    if (currentStep.mode === "move_axis") {
      isCorrect = currentPos.x === currentStep.targetPoint.x && currentPos.y === currentStep.targetPoint.y;
    } else if (currentStep.mode === "select_point") {
      isCorrect =
        selectedPoint !== null &&
        selectedPoint.x === currentStep.targetPoint.x &&
        selectedPoint.y === currentStep.targetPoint.y;
    } else if (currentStep.mode === "vector_demo") {
      isCorrect = true;
    }

    if (isCorrect) {
      setStatus("correct");
      playSuccessSound();
    } else {
      setStatus("incorrect");
      playErrorSound();
    }
  };

  return (
    <div className="rounded-3xl border bg-card p-6 shadow-xl space-y-6 max-w-2xl mx-auto border-emerald-500/20 dark:border-emerald-500/30">
      {/* Header & Step Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" /> Interactive Coordinate Geometry
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Step {stepIdx + 1} of {steps.length}
            </span>
          </div>
          <h3 className="text-xl font-bold font-serif text-foreground mt-1">
            {currentStep.title}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {steps.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setStepIdx(idx);
                const sStep = steps[idx];
                setCurrentPos(sStep.initialPoint ?? { x: 0, y: 0 });
                setSelectedPoint(null);
                setStatus("idle");
                setShowWhy(false);
              }}
              className={cn(
                "h-2.5 rounded-full transition-all duration-300",
                stepIdx === idx
                  ? "w-7 bg-emerald-500"
                  : "w-2.5 bg-muted hover:bg-muted-foreground/30"
              )}
              title={s.title}
            />
          ))}
        </div>
      </div>

      {/* Instruction Banner */}
      <div className="text-center space-y-1">
        <p className="text-base sm:text-lg font-medium text-foreground">
          {currentStep.instruction}
        </p>
        {currentStep.mode === "move_axis" && (
          <p className="text-xs text-muted-foreground">
            Current Position: <span className="font-mono font-bold text-emerald-500">({currentPos.x}, {currentPos.y})</span>
          </p>
        )}
      </div>

      {/* Interactive 2D Grid SVG */}
      <div className="relative flex justify-center items-center py-2">
        <div
          className={cn(
            "relative rounded-2xl bg-slate-950 p-4 shadow-inner border transition-all duration-300",
            status === "correct" && "ring-4 ring-emerald-500/40 border-emerald-500",
            status === "incorrect" && "ring-4 ring-rose-500/40 border-rose-500"
          )}
        >
          <svg width={width} height={height} className="overflow-visible select-none">
            {/* Gridlines */}
            {Array.from({ length: xMax + 1 }).map((_, i) => (
              <line
                key={`grid-x-${i}`}
                x1={toSvgX(i)}
                y1={toSvgY(0)}
                x2={toSvgX(i)}
                y2={toSvgY(yMax)}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />
            ))}
            {Array.from({ length: yMax + 1 }).map((_, j) => (
              <line
                key={`grid-y-${j}`}
                x1={toSvgX(0)}
                y1={toSvgY(j)}
                x2={toSvgX(xMax)}
                y2={toSvgY(j)}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />
            ))}

            {/* X-axis & Y-axis */}
            <line
              x1={toSvgX(0)}
              y1={toSvgY(0)}
              x2={toSvgX(xMax + 0.3)}
              y2={toSvgY(0)}
              stroke="#e2e8f0"
              strokeWidth="2.5"
            />
            <polygon
              points={`${toSvgX(xMax + 0.35)},${toSvgY(0)} ${toSvgX(xMax + 0.2)},${toSvgY(0) - 5} ${toSvgX(xMax + 0.2)},${toSvgY(0) + 5}`}
              fill="#e2e8f0"
            />

            <line
              x1={toSvgX(0)}
              y1={toSvgY(0)}
              x2={toSvgX(0)}
              y2={toSvgY(yMax + 0.3)}
              stroke="#e2e8f0"
              strokeWidth="2.5"
            />
            <polygon
              points={`${toSvgX(0)},${toSvgY(yMax + 0.35)} ${toSvgX(0) - 5},${toSvgY(yMax + 0.2)} ${toSvgX(0) + 5},${toSvgY(yMax + 0.2)}`}
              fill="#e2e8f0"
            />

            {/* Tick marks & Labels */}
            {Array.from({ length: xMax + 1 }).map((_, i) => (
              <g key={`tick-x-${i}`}>
                <line
                  x1={toSvgX(i)}
                  y1={toSvgY(0) - 4}
                  x2={toSvgX(i)}
                  y2={toSvgY(0) + 4}
                  stroke="#e2e8f0"
                  strokeWidth="1.5"
                />
                {i > 0 && (
                  <text
                    x={toSvgX(i)}
                    y={toSvgY(0) + 20}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="12"
                    fontWeight="600"
                  >
                    {i}
                  </text>
                )}
              </g>
            ))}

            {Array.from({ length: yMax + 1 }).map((_, j) => (
              <g key={`tick-y-${j}`}>
                <line
                  x1={toSvgX(0) - 4}
                  y1={toSvgY(j)}
                  x2={toSvgX(0) + 4}
                  y2={toSvgY(j)}
                  stroke="#e2e8f0"
                  strokeWidth="1.5"
                />
                {j > 0 && (
                  <text
                    x={toSvgX(0) - 16}
                    y={toSvgY(j) + 4}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="12"
                    fontWeight="600"
                  >
                    {j}
                  </text>
                )}
              </g>
            ))}

            {/* Origin Highlight Ring */}
            <circle
              cx={toSvgX(0)}
              cy={toSvgY(0)}
              r="7"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2.5"
            />
            <circle cx={toSvgX(0)} cy={toSvgY(0)} r="3" fill="#fbbf24" />

            {/* Vector Mode Highlights & Lines */}
            {currentStep.mode === "vector_demo" && (
              <>
                {/* Horizontal x-displacement vector */}
                <line
                  x1={toSvgX(0)}
                  y1={toSvgY(0)}
                  x2={toSvgX(currentStep.targetPoint.x)}
                  y2={toSvgY(0)}
                  stroke="#2dd4bf"
                  strokeWidth="3.5"
                />
                <text
                  x={toSvgX(currentStep.targetPoint.x / 2)}
                  y={toSvgY(0) + 22}
                  textAnchor="middle"
                  fill="#2dd4bf"
                  fontSize="14"
                  fontWeight="700"
                >
                  {currentStep.targetPoint.x}
                </text>

                {/* Vertical y-displacement vector */}
                <line
                  x1={toSvgX(currentStep.targetPoint.x)}
                  y1={toSvgY(0)}
                  x2={toSvgX(currentStep.targetPoint.x)}
                  y2={toSvgY(currentStep.targetPoint.y)}
                  stroke="#38bdf8"
                  strokeWidth="3.5"
                />
                <text
                  x={toSvgX(currentStep.targetPoint.x) + 16}
                  y={toSvgY(currentStep.targetPoint.y / 2)}
                  textAnchor="start"
                  fill="#38bdf8"
                  fontSize="14"
                  fontWeight="700"
                >
                  {currentStep.targetPoint.y}
                </text>

                {/* Target Point */}
                <circle
                  cx={toSvgX(currentStep.targetPoint.x)}
                  cy={toSvgY(currentStep.targetPoint.y)}
                  r="7"
                  fill="#60a5fa"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </>
            )}

            {/* Candidate Points for Select Mode */}
            {currentStep.mode === "select_point" &&
              currentStep.candidatePoints?.map((pt) => {
                const isSelected =
                  selectedPoint && selectedPoint.x === pt.x && selectedPoint.y === pt.y;
                return (
                  <g
                    key={`cand-${pt.x}-${pt.y}`}
                    className="cursor-pointer group"
                    onClick={() => {
                      setSelectedPoint(pt);
                      setStatus("idle");
                    }}
                  >
                    <circle
                      cx={toSvgX(pt.x)}
                      cy={toSvgY(pt.y)}
                      r="16"
                      fill="transparent"
                    />
                    <circle
                      cx={toSvgX(pt.x)}
                      cy={toSvgY(pt.y)}
                      r={isSelected ? "9" : "6"}
                      fill={isSelected ? "#10b981" : "#60a5fa"}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="transition-all duration-200 group-hover:scale-125"
                    />
                    {isSelected && (
                      <circle
                        cx={toSvgX(pt.x)}
                        cy={toSvgY(pt.y)}
                        r="14"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeDasharray="3 3"
                        className="animate-spin-slow"
                      />
                    )}
                  </g>
                );
              })}

            {/* Draggable Point along x-axis */}
            {currentStep.mode === "move_axis" && (
              <g
                className="cursor-pointer"
                onClick={() => {
                  const nextX = (currentPos.x + 1) % (xMax + 1);
                  setCurrentPos({ x: nextX, y: 0 });
                  setStatus("idle");
                }}
              >
                <circle
                  cx={toSvgX(currentPos.x)}
                  cy={toSvgY(currentPos.y)}
                  r="18"
                  fill="rgba(16,185,129,0.2)"
                />
                <circle
                  cx={toSvgX(currentPos.x)}
                  cy={toSvgY(currentPos.y)}
                  r="7"
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                {status === "correct" && (
                  <g transform={`translate(${toSvgX(currentPos.x) - 8}, ${toSvgY(currentPos.y) - 26})`}>
                    <rect width="16" height="16" rx="4" fill="#10b981" />
                    <path d="M4 8 L7 11 L12 5" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  </g>
                )}
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Axis Movement Controls for Move Mode */}
      {currentStep.mode === "move_axis" && (
        <div className="flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (currentPos.x > 0) {
                setCurrentPos({ x: currentPos.x - 1, y: 0 });
                setStatus("idle");
              }
            }}
            disabled={currentPos.x <= 0}
          >
            Move Left (-1)
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            onClick={() => {
              if (currentPos.x < xMax) {
                setCurrentPos({ x: currentPos.x + 1, y: 0 });
                setStatus("idle");
              }
            }}
            disabled={currentPos.x >= xMax}
          >
            Move Right (+1) <MoveRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Action Footer & Feedback */}
      <div className="space-y-4 pt-2 border-t">
        {status === "correct" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-emerald-600 dark:text-emerald-400 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
              <div>
                <p className="font-bold text-sm">You got it!</p>
                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
                  {currentStep.targetPoint
                    ? `Point identified at (${currentStep.targetPoint.x}, ${currentStep.targetPoint.y}).`
                    : "Great job!"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                onClick={() => setShowWhy(!showWhy)}
              >
                <HelpCircle className="h-4 w-4 mr-1" /> Why?
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-500 font-semibold"
                onClick={handleNextStep}
              >
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {status === "incorrect" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-4 text-rose-600 dark:text-rose-400 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <XCircle className="h-6 w-6 text-rose-500 shrink-0" />
              <div>
                <p className="font-bold text-sm">Not quite right</p>
                <p className="text-xs text-rose-600/80 dark:text-rose-400/80">
                  Try moving or selecting the target coordinates carefully.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
              onClick={handleResetStep}
            >
              <RotateCcw className="h-4 w-4 mr-1" /> Reset
            </Button>
          </motion.div>
        )}

        {status === "idle" && (
          <div className="flex items-center justify-between">
            <Button size="sm" variant="ghost" onClick={handleResetStep}>
              <RotateCcw className="h-4 w-4 mr-1.5" /> Start over
            </Button>
            <Button
              size="default"
              className="px-8 bg-emerald-600 text-white hover:bg-emerald-500 font-bold rounded-xl shadow-md"
              onClick={handleCheck}
            >
              Check
            </Button>
          </div>
        )}

        {/* "Why?" Explanation Popover */}
        <AnimatePresence>
          {showWhy && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-2xl bg-muted/60 p-4 border text-sm text-foreground space-y-2 overflow-hidden"
            >
              <p className="font-bold text-emerald-500 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" /> Explanation:
              </p>
              <p className="text-muted-foreground leading-relaxed">{currentStep.explanation}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
