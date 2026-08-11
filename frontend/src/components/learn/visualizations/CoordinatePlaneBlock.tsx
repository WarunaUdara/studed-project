import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { playErrorSound, playSuccessSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import {
  type CoordinatePlaneStep,
  DEFAULT_STEPS,
  isPointInGrid,
  type Point,
  parseConfig,
  resolveGrid,
  stepTargetsMatch,
} from "./coordinatePlaneUtils";

interface CoordinatePlaneBlockProps {
  content?: string;
  metadata?: string | null;
}

const SVG_PADDING = 40;
const SVG_WIDTH = 360;
const SVG_HEIGHT = 360;

type Status = "idle" | "correct" | "incorrect";

export function CoordinatePlaneBlock({ metadata }: CoordinatePlaneBlockProps) {
  const config = useMemo(() => parseConfig(metadata), [metadata]);
  const grid = useMemo(() => resolveGrid(config.grid), [config.grid]);
  const steps: CoordinatePlaneStep[] = config.steps?.length ? config.steps : DEFAULT_STEPS;

  const [stepIdx, setStepIdx] = useState(0);
  const currentStep = steps[stepIdx] ?? steps[0];

  const [currentPos, setCurrentPos] = useState<Point>(currentStep.initial ?? { x: 0, y: 0 });
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [showWhy, setShowWhy] = useState(false);
  const [demoRevealed, setDemoRevealed] = useState(false);

  const gridW = SVG_WIDTH - SVG_PADDING * 2;
  const gridH = SVG_HEIGHT - SVG_PADDING * 2;

  const toSvgX = (x: number) => SVG_PADDING + ((x - grid.xMin) / (grid.xMax - grid.xMin)) * gridW;
  const toSvgY = (y: number) =>
    SVG_HEIGHT - SVG_PADDING - ((y - grid.yMin) / (grid.yMax - grid.yMin)) * gridH;

  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let i = Math.ceil(grid.xMin); i <= Math.floor(grid.xMax); i++) ticks.push(i);
    return ticks;
  }, [grid]);

  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let i = Math.ceil(grid.yMin); i <= Math.floor(grid.yMax); i++) ticks.push(i);
    return ticks;
  }, [grid]);

  const hasXAxis = grid.xMin <= 0 && grid.xMax >= 0;
  const hasYAxis = grid.yMin <= 0 && grid.yMax >= 0;
  const hasOrigin = isPointInGrid({ x: 0, y: 0 }, grid);

  const isVectorDemo = currentStep.mode === "vector_demo";
  const isMoveMode = currentStep.mode === "move_axis" || currentStep.mode === "move_plane";
  const isSelectMode = currentStep.mode === "select_point";

  const isCorrect =
    status === "correct" ||
    (isVectorDemo && demoRevealed) ||
    (isMoveMode && stepTargetsMatch(currentPos, currentStep.target)) ||
    (isSelectMode && stepTargetsMatch(selectedPoint, currentStep.target));

  const isLastStep = stepIdx >= steps.length - 1;

  const resetStep = () => {
    setCurrentPos(currentStep.initial ?? { x: 0, y: 0 });
    setSelectedPoint(null);
    setStatus("idle");
    setShowWhy(false);
    setDemoRevealed(false);
  };

  const goToStep = (idx: number) => {
    const next = steps[idx] ?? steps[0];
    setStepIdx(idx);
    setCurrentPos(next.initial ?? { x: 0, y: 0 });
    setSelectedPoint(null);
    setStatus("idle");
    setShowWhy(false);
    setDemoRevealed(false);
  };

  const handleCheck = () => {
    if (isMoveMode && stepTargetsMatch(currentPos, currentStep.target)) {
      setStatus("correct");
      playSuccessSound();
      return;
    }
    if (isSelectMode && stepTargetsMatch(selectedPoint, currentStep.target)) {
      setStatus("correct");
      playSuccessSound();
      return;
    }
    setStatus("incorrect");
    playErrorSound();
  };

  const handleVectorContinue = () => {
    setDemoRevealed(true);
    setStatus("correct");
    playSuccessSound();
  };

  const handleNext = () => {
    if (isLastStep) {
      goToStep(0);
      return;
    }
    goToStep(stepIdx + 1);
  };

  const movePoint = (dx: number, dy: number) => {
    const next: Point = { x: currentPos.x + dx, y: currentPos.y + dy };
    if (!isPointInGrid(next, grid)) return;
    setCurrentPos(next);
    setStatus("idle");
  };

  const canCheck = isVectorDemo ? true : isSelectMode ? selectedPoint !== null : true;
  const checkDisabled = isCorrect || !canCheck;

  return (
    <div className="rounded-3xl border bg-card p-6 shadow-xl space-y-6 max-w-2xl mx-auto border-emerald-500/20 dark:border-emerald-500/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              {config.title ?? "Interactive Coordinate Geometry"}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Step {stepIdx + 1} of {steps.length}
            </span>
          </div>
          <h3 className="text-xl font-bold font-serif text-foreground mt-1">{currentStep.title}</h3>
        </div>

        <div
          className="flex items-center gap-1.5"
          role="tablist"
          aria-label="Coordinate plane steps"
        >
          {steps.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={stepIdx === idx}
              aria-label={`Go to step ${idx + 1}: ${s.title}`}
              onClick={() => goToStep(idx)}
              className={cn(
                "h-2.5 rounded-full transition-all duration-300",
                stepIdx === idx
                  ? "w-7 bg-emerald-500"
                  : "w-2.5 bg-muted hover:bg-muted-foreground/30",
              )}
            />
          ))}
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="text-base sm:text-lg font-medium text-foreground">
          {currentStep.instruction}
        </p>
        {isMoveMode && (
          <p className="text-xs text-muted-foreground">
            Current Position:{" "}
            <span className="font-mono font-bold text-emerald-500">
              ({currentPos.x}, {currentPos.y})
            </span>
          </p>
        )}
      </div>

      <div className="relative flex justify-center items-center py-2">
        <div
          className={cn(
            "relative rounded-2xl bg-slate-950 p-4 shadow-inner border transition-all duration-300",
            status === "correct" && "ring-4 ring-emerald-500/40 border-emerald-500",
            status === "incorrect" && "ring-4 ring-rose-500/40 border-rose-500",
          )}
        >
          <div className="relative">
            <svg
              width={SVG_WIDTH}
              height={SVG_HEIGHT}
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              className="overflow-visible select-none"
              role="img"
            >
              <title>
                Coordinate grid from x={grid.xMin} to x={grid.xMax} and y={grid.yMin} to y=
                {grid.yMax}
              </title>

              {xTicks.map((i) => (
                <line
                  key={`grid-x-${i}`}
                  x1={toSvgX(i)}
                  y1={toSvgY(grid.yMin)}
                  x2={toSvgX(i)}
                  y2={toSvgY(grid.yMax)}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1"
                />
              ))}
              {yTicks.map((j) => (
                <line
                  key={`grid-y-${j}`}
                  x1={toSvgX(grid.xMin)}
                  y1={toSvgY(j)}
                  x2={toSvgX(grid.xMax)}
                  y2={toSvgY(j)}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1"
                />
              ))}

              {hasXAxis && (
                <g>
                  <line
                    x1={toSvgX(grid.xMin)}
                    y1={toSvgY(0)}
                    x2={toSvgX(grid.xMax)}
                    y2={toSvgY(0)}
                    stroke="#e2e8f0"
                    strokeWidth="2.5"
                  />
                  <polygon
                    points={`${toSvgX(grid.xMax)},${toSvgY(0)} ${toSvgX(grid.xMax) - 6},${toSvgY(0) - 5} ${toSvgX(grid.xMax) - 6},${toSvgY(0) + 5}`}
                    fill="#e2e8f0"
                  />
                </g>
              )}
              {hasYAxis && (
                <g>
                  <line
                    x1={toSvgX(0)}
                    y1={toSvgY(grid.yMin)}
                    x2={toSvgX(0)}
                    y2={toSvgY(grid.yMax)}
                    stroke="#e2e8f0"
                    strokeWidth="2.5"
                  />
                  <polygon
                    points={`${toSvgX(0)},${toSvgY(grid.yMax)} ${toSvgX(0) - 5},${toSvgY(grid.yMax) + 6} ${toSvgX(0) + 5},${toSvgY(grid.yMax) + 6}`}
                    fill="#e2e8f0"
                  />
                </g>
              )}

              {hasOrigin && (
                <g>
                  <circle
                    cx={toSvgX(0)}
                    cy={toSvgY(0)}
                    r="7"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="2.5"
                  />
                  <circle cx={toSvgX(0)} cy={toSvgY(0)} r="3" fill="#fbbf24" />
                </g>
              )}

              {xTicks.map((i) => (
                <g key={`tick-x-${i}`}>
                  {hasXAxis && (
                    <line
                      x1={toSvgX(i)}
                      y1={toSvgY(0) - 4}
                      x2={toSvgX(i)}
                      y2={toSvgY(0) + 4}
                      stroke="#e2e8f0"
                      strokeWidth="1.5"
                    />
                  )}
                  <text
                    x={toSvgX(i)}
                    y={SVG_HEIGHT - SVG_PADDING + 18}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="12"
                    fontWeight="600"
                  >
                    {i}
                  </text>
                </g>
              ))}
              {yTicks.map((j) => (
                <g key={`tick-y-${j}`}>
                  {hasYAxis && (
                    <line
                      x1={toSvgX(0) - 4}
                      y1={toSvgY(j)}
                      x2={toSvgX(0) + 4}
                      y2={toSvgY(j)}
                      stroke="#e2e8f0"
                      strokeWidth="1.5"
                    />
                  )}
                  <text
                    x={SVG_PADDING - 12}
                    y={toSvgY(j) + 4}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="12"
                    fontWeight="600"
                  >
                    {j}
                  </text>
                </g>
              ))}

              {isVectorDemo && (
                <g>
                  <line
                    x1={toSvgX(0)}
                    y1={toSvgY(0)}
                    x2={toSvgX(currentStep.target.x)}
                    y2={toSvgY(0)}
                    stroke="#2dd4bf"
                    strokeWidth="3.5"
                  />
                  <text
                    x={toSvgX(currentStep.target.x / 2)}
                    y={toSvgY(0) + 22}
                    textAnchor="middle"
                    fill="#2dd4bf"
                    fontSize="14"
                    fontWeight="700"
                  >
                    {currentStep.target.x}
                  </text>
                  <line
                    x1={toSvgX(currentStep.target.x)}
                    y1={toSvgY(0)}
                    x2={toSvgX(currentStep.target.x)}
                    y2={toSvgY(currentStep.target.y)}
                    stroke="#38bdf8"
                    strokeWidth="3.5"
                  />
                  <text
                    x={toSvgX(currentStep.target.x) + 16}
                    y={toSvgY(currentStep.target.y / 2)}
                    textAnchor="start"
                    fill="#38bdf8"
                    fontSize="14"
                    fontWeight="700"
                  >
                    {currentStep.target.y}
                  </text>
                  <circle
                    cx={toSvgX(currentStep.target.x)}
                    cy={toSvgY(currentStep.target.y)}
                    r="7"
                    fill="#60a5fa"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                </g>
              )}

              {isMoveMode && (
                <g>
                  {currentStep.mode === "move_plane" &&
                    currentPos.x !== 0 &&
                    currentPos.y !== 0 && (
                      <line
                        x1={toSvgX(0)}
                        y1={toSvgY(0)}
                        x2={toSvgX(currentPos.x)}
                        y2={toSvgY(currentPos.y)}
                        stroke="rgba(16,185,129,0.4)"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    )}
                  <circle
                    cx={toSvgX(currentPos.x)}
                    cy={toSvgY(currentPos.y)}
                    r="7"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  {status === "correct" && (
                    <g
                      transform={`translate(${toSvgX(currentPos.x) - 8}, ${toSvgY(currentPos.y) - 26})`}
                    >
                      <rect width="16" height="16" rx="4" fill="#10b981" />
                      <path
                        d="M4 8 L7 11 L12 5"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </g>
                  )}
                </g>
              )}
            </svg>

            {isSelectMode &&
              currentStep.candidatePoints?.map((pt) => {
                const isSelected = selectedPoint?.x === pt.x && selectedPoint.y === pt.y;
                return (
                  <button
                    key={`cand-${pt.x}-${pt.y}`}
                    type="button"
                    aria-label={`Select point (${pt.x}, ${pt.y})`}
                    aria-pressed={isSelected}
                    onClick={() => {
                      setSelectedPoint(pt);
                      setStatus("idle");
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    style={{ left: toSvgX(pt.x), top: toSvgY(pt.y) }}
                  >
                    <span
                      className={cn(
                        "block rounded-full border-2 border-white shadow transition-all duration-200",
                        isSelected ? "h-5 w-5 bg-emerald-500" : "h-3.5 w-3.5 bg-blue-400",
                      )}
                    />
                    {isSelected && (
                      <span className="absolute h-7 w-7 rounded-full border-2 border-dashed border-emerald-500 animate-spin-slow" />
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {isMoveMode && (
        <div className="flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="outline"
            aria-label="Move left"
            onClick={() => movePoint(-1, 0)}
            disabled={
              (currentStep.mode === "move_axis" && currentStep.axis !== "x") ||
              currentPos.x <= grid.xMin ||
              isCorrect
            }
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            aria-label="Move right"
            onClick={() => movePoint(1, 0)}
            disabled={
              (currentStep.mode === "move_axis" && currentStep.axis !== "x") ||
              currentPos.x >= grid.xMax ||
              isCorrect
            }
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            aria-label="Move up"
            onClick={() => movePoint(0, 1)}
            disabled={
              (currentStep.mode === "move_axis" && currentStep.axis !== "y") ||
              currentPos.y >= grid.yMax ||
              isCorrect
            }
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          {currentStep.mode === "move_plane" && (
            <Button
              size="sm"
              variant="outline"
              aria-label="Move down"
              onClick={() => movePoint(0, -1)}
              disabled={currentPos.y <= grid.yMin || isCorrect}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      <div className="space-y-4 pt-2 border-t">
        {isCorrect && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-emerald-600 dark:text-emerald-400 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
              <div>
                <p className="font-bold text-sm">
                  {isVectorDemo ? "Got it — see the displacement!" : "You got it!"}
                </p>
                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
                  {isVectorDemo
                    ? "Right then up reaches the target point."
                    : `Point identified at (${currentStep.target.x}, ${currentStep.target.y}).`}
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
                onClick={handleNext}
              >
                {isLastStep ? "Restart" : "Continue"}
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
              onClick={resetStep}
            >
              <RotateCcw className="h-4 w-4 mr-1" /> Reset
            </Button>
          </motion.div>
        )}

        {status === "idle" && !isCorrect && (
          <div className="flex items-center justify-between">
            <Button size="sm" variant="ghost" onClick={resetStep}>
              <RotateCcw className="h-4 w-4 mr-1.5" /> Start over
            </Button>
            {isVectorDemo ? (
              <Button
                size="default"
                className="px-8 bg-emerald-600 text-white hover:bg-emerald-500 font-bold rounded-xl shadow-md"
                onClick={handleVectorContinue}
              >
                <Check className="h-4 w-4 mr-1" /> I see it
              </Button>
            ) : (
              <Button
                size="default"
                className="px-8 bg-emerald-600 text-white hover:bg-emerald-500 font-bold rounded-xl shadow-md"
                onClick={handleCheck}
                disabled={checkDisabled}
              >
                Check
              </Button>
            )}
          </div>
        )}

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
