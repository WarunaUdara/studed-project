import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Gem,
  PartyPopper,
  Play,
  RotateCcw,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export type ProgramCommandType = "move_forward" | "turn_left" | "turn_right";

export interface ProgramCommand {
  id: string;
  type: ProgramCommandType;
  label: string;
}

export type Direction = "NORTH" | "EAST" | "SOUTH" | "WEST";

export interface MazeGridConfig {
  rows: number;
  cols: number;
  startPos: { x: number; y: number };
  startDir: Direction;
  gemPos: { x: number; y: number };
  initialCommands: ProgramCommand[];
  correctSolution: ProgramCommandType[];
  explanationSteps: {
    title: string;
    description: string;
    robotPos: { x: number; y: number };
    robotDir: Direction;
    collectedGem?: boolean;
  }[];
}

const DEFAULT_MAZE_CONFIG: MazeGridConfig = {
  rows: 3,
  cols: 3,
  startPos: { x: 0, y: 2 }, // Bottom-left
  startDir: "NORTH",
  gemPos: { x: 2, y: 0 }, // Top-right
  initialCommands: [
    { id: "c1", type: "move_forward", label: "move forward" },
    { id: "c2", type: "move_forward", label: "move forward" },
    { id: "c3", type: "turn_right", label: "turn right" },
    { id: "c4", type: "move_forward", label: "move forward" },
    { id: "c5", type: "move_forward", label: "move forward" },
  ],
  correctSolution: ["move_forward", "move_forward", "turn_right", "move_forward", "move_forward"],
  explanationSteps: [
    {
      title: "Step 1 & 2: Move Forward Twice",
      description: "From the bottom row, move up 2 cells to reach the top-left cell.",
      robotPos: { x: 0, y: 0 },
      robotDir: "NORTH",
    },
    {
      title: "Step 3: Turn Right",
      description: "Rotate 90 degrees clockwise to face East toward the target gem.",
      robotPos: { x: 0, y: 0 },
      robotDir: "EAST",
    },
    {
      title: "Step 4 & 5: Move Forward Twice",
      description: "Move forward 2 cells to the right to reach the gem.",
      robotPos: { x: 2, y: 0 },
      robotDir: "EAST",
      collectedGem: true,
    },
  ],
};

export interface BlobProgramMazeProps {
  config?: MazeGridConfig;
  onSuccess?: (xpEarned: number) => void;
  onFinish?: () => void;
  className?: string;
}

export function BlobProgramMaze({
  config = DEFAULT_MAZE_CONFIG,
  onSuccess,
  onFinish,
  className = "",
}: BlobProgramMazeProps) {
  const reduce = useReducedMotion();
  const [commands, setCommands] = useState<ProgramCommand[]>(config.initialCommands);
  const [robotPos, setRobotPos] = useState(config.startPos);
  const [robotDir, setRobotDir] = useState<Direction>(config.startDir);
  const [pathTrail, setPathTrail] = useState<{ x: number; y: number }[]>([config.startPos]);
  const [status, setStatus] = useState<"idle" | "running" | "success" | "failure">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [commandExecutionIndex, setCommandExecutionIndex] = useState<number>(-1);
  const [failedCommandIndex, setFailedCommandIndex] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanationStep, setExplanationStep] = useState(0);

  const resetMaze = () => {
    setRobotPos(config.startPos);
    setRobotDir(config.startDir);
    setPathTrail([config.startPos]);
    setStatus("idle");
    setErrorMessage(null);
    setCommandExecutionIndex(-1);
    setFailedCommandIndex(null);
  };

  // Reorder commands: swap item up or down
  const moveCommand = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= commands.length || status === "running") return;
    const updated = [...commands];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setCommands(updated);
    if (status !== "idle") {
      resetMaze();
    }
  };

  const getNextPos = (pos: { x: number; y: number }, dir: Direction) => {
    switch (dir) {
      case "NORTH":
        return { x: pos.x, y: pos.y - 1 };
      case "SOUTH":
        return { x: pos.x, y: pos.y + 1 };
      case "EAST":
        return { x: pos.x + 1, y: pos.y };
      case "WEST":
        return { x: pos.x - 1, y: pos.y };
    }
  };

  const getNextDir = (current: Direction, turn: "left" | "right"): Direction => {
    const order: Direction[] = ["NORTH", "EAST", "SOUTH", "WEST"];
    const idx = order.indexOf(current);
    if (turn === "right") {
      return order[(idx + 1) % 4];
    } else {
      return order[(idx + 3) % 4];
    }
  };

  const handleRunProgram = async () => {
    if (status === "running") return;
    resetMaze();
    setStatus("running");

    let currentPos = { ...config.startPos };
    let currentDir = config.startDir;
    const trail = [{ ...currentPos }];

    for (let i = 0; i < commands.length; i++) {
      setCommandExecutionIndex(i);
      const cmd = commands[i];

      // Delay for step animation
      await new Promise((r) => setTimeout(r, 450));

      if (cmd.type === "move_forward") {
        const next = getNextPos(currentPos, currentDir);
        // Check bounds
        if (next.x < 0 || next.x >= config.cols || next.y < 0 || next.y >= config.rows) {
          setFailedCommandIndex(i);
          setErrorMessage("Out of bounds.");
          setStatus("failure");
          return;
        }
        currentPos = next;
        trail.push({ ...currentPos });
        setRobotPos(currentPos);
        setPathTrail([...trail]);
      } else if (cmd.type === "turn_left") {
        currentDir = getNextDir(currentDir, "left");
        setRobotDir(currentDir);
      } else if (cmd.type === "turn_right") {
        currentDir = getNextDir(currentDir, "right");
        setRobotDir(currentDir);
      }
    }

    // Check final position
    await new Promise((r) => setTimeout(r, 300));
    if (currentPos.x === config.gemPos.x && currentPos.y === config.gemPos.y) {
      setStatus("success");
      onSuccess?.(30);
    } else {
      setStatus("failure");
      setErrorMessage("Robot did not reach the gem.");
    }
  };

  // Character rotation angle based on direction
  const getRotationDeg = (dir: Direction) => {
    switch (dir) {
      case "NORTH":
        return 0;
      case "EAST":
        return 90;
      case "SOUTH":
        return 180;
      case "WEST":
        return 270;
    }
  };

  return (
    <div
      className={`relative mx-auto flex w-full max-w-2xl flex-col items-center rounded-3xl border border-border/80 bg-card p-6 text-foreground shadow-2xl backdrop-blur-md ${className}`.trim()}
    >
      {/* Top Header & Task Instruction */}
      <div className="w-full text-center space-y-1 mb-4">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground pb-2 border-b border-border/40">
          <div className="flex items-center gap-1.5 text-primary font-mono text-[11px]">
            <Sparkles className="size-3.5 text-primary" />
            <span>PYTHON & CS ALGORITHMS</span>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" />
            <span className="size-2 rounded-full bg-primary" />
            <span className="size-2 rounded-full bg-muted border border-border/60" />
          </div>

          <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
            <span>+30 XP</span>
          </div>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-foreground pt-2">
          Drag or reorder the program commands. Make the robot reach the gem.
        </h3>
      </div>

      {/* Grid Arena Card */}
      <div className="relative w-full max-w-[380px] overflow-hidden rounded-2xl border border-border/70 bg-[#0b101e] dark:bg-[#070b14] shadow-inner text-white">
        {/* Banner Top Info / Error Bar */}
        <div className="flex h-9 items-center justify-between px-3 bg-[#131b2e] border-b border-white/10 text-xs">
          {errorMessage && status === "failure" ? (
            <div className="flex items-center gap-1.5 text-rose-400 font-bold">
              <AlertTriangle className="size-3.5" />
              <span>{errorMessage}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-purple-300 font-bold">
              <Gem className="size-4" />
              <span>1 left</span>
            </div>
          )}

          <button
            type="button"
            onClick={resetMaze}
            className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </button>
        </div>

        {/* 2D Grid Canvas */}
        <div className="relative p-6 flex items-center justify-center">
          <div
            className="grid gap-1.5 rounded-xl border-2 border-indigo-500/40 bg-indigo-950/30 p-2 shadow-2xl"
            style={{
              gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
              width: "240px",
              height: "240px",
            }}
          >
            {Array.from({ length: config.rows * config.cols }).map((_, idx) => {
              const cx = idx % config.cols;
              const cy = Math.floor(idx / config.cols);

              const isRobotHere = robotPos.x === cx && robotPos.y === cy;
              const isGemHere = config.gemPos.x === cx && config.gemPos.y === cy;
              const isTrailHere = pathTrail.some((p) => p.x === cx && p.y === cy);

              return (
                <div
                  key={idx}
                  className={`relative flex items-center justify-center rounded-lg border transition-colors ${
                    isTrailHere
                      ? "border-blue-400/40 bg-blue-500/15"
                      : "border-indigo-500/20 bg-indigo-900/20"
                  }`}
                >
                  {/* Target Gem */}
                  {isGemHere && !(status === "success" && isRobotHere) && (
                    <motion.div
                      animate={reduce ? undefined : { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 2.2 }}
                      className="drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]"
                    >
                      <Gem className="size-7 text-purple-400" />
                    </motion.div>
                  )}

                  {/* Cute Blob Mascot Robot */}
                  {isRobotHere && (
                    <motion.div
                      layout
                      animate={{ rotate: getRotationDeg(robotDir) }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className="relative z-20 flex size-12 items-center justify-center"
                    >
                      {/* Blob Mascot Body SVG with Heading Triangle */}
                      <svg viewBox="0 0 100 100" className="size-full filter drop-shadow-md">
                        {/* Heading Arrow Indicator */}
                        <polygon points="50,10 62,25 38,25" fill="#facc15" />
                        {/* Blob Rounded Character */}
                        <rect x="20" y="25" width="60" height="60" rx="28" fill="#10b981" />
                        {/* Shading */}
                        <ellipse cx="50" cy="78" rx="20" ry="5" fill="#047857" opacity="0.4" />
                        {/* Eyes */}
                        <circle cx="38" cy="48" r="5" fill="#ffffff" />
                        <circle cx="40" cy="48" r="2.5" fill="#0f172a" />
                        <circle cx="62" cy="48" r="5" fill="#ffffff" />
                        <circle cx="60" cy="48" r="2.5" fill="#0f172a" />
                        {/* Cute Smile */}
                        <path
                          d="M 44,60 Q 50,66 56,60"
                          stroke="#0f172a"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          fill="none"
                        />
                      </svg>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Command Sequence Block List */}
        <div className="border-t border-white/10 bg-[#090d18] p-3.5 space-y-2">
          <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
            Program Commands ({commands.length})
          </div>

          <div className="space-y-1.5">
            {commands.map((cmd, idx) => {
              const isExecuting = commandExecutionIndex === idx && status === "running";
              const isFailed = failedCommandIndex === idx;
              const isSuccess = status === "success";

              return (
                <div
                  key={cmd.id}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-mono transition-all ${
                    isFailed
                      ? "border-rose-500 bg-rose-950/40 text-rose-300"
                      : isSuccess
                        ? "border-emerald-500/60 bg-emerald-950/40 text-emerald-300"
                        : isExecuting
                          ? "border-primary bg-primary/20 text-white shadow-md ring-2 ring-primary/40"
                          : "border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isSuccess ? (
                      <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                    ) : isFailed ? (
                      <XCircle className="size-4 text-rose-400 shrink-0" />
                    ) : (
                      <span className="w-4 font-bold text-neutral-500">{idx + 1}</span>
                    )}

                    <span className="font-bold text-white">{cmd.label}</span>
                  </div>

                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0 || status === "running"}
                      onClick={() => moveCommand(idx, idx - 1)}
                      className="rounded p-1 text-neutral-400 hover:bg-white/10 hover:text-white disabled:opacity-20"
                      aria-label="Move up"
                    >
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === commands.length - 1 || status === "running"}
                      onClick={() => moveCommand(idx, idx + 1)}
                      className="rounded p-1 text-neutral-400 hover:bg-white/10 hover:text-white disabled:opacity-20"
                      aria-label="Move down"
                    >
                      <ArrowDown className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Evaluation Action Bar */}
      <div className="mt-5 flex w-full max-w-[380px] items-center justify-between gap-3">
        {status === "idle" || status === "running" ? (
          <Button
            onClick={handleRunProgram}
            disabled={status === "running"}
            className="w-full rounded-full h-12 font-bold text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
          >
            <Play className="size-4 mr-2 fill-current" />
            {status === "running" ? "Executing..." : "Check"}
          </Button>
        ) : status === "success" ? (
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-bold text-emerald-500 text-sm">
              <PartyPopper className="size-4" />
              <span>Correct!</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExplanation(true)}
                className="rounded-full text-xs font-bold"
              >
                Why?
              </Button>
              <Button
                onClick={onFinish}
                className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold px-5 shadow-sm"
              >
                Continue
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-bold text-rose-500 text-sm">
              <XCircle className="size-4" />
              <span>Incorrect</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExplanation(true)}
                className="rounded-full text-xs font-bold"
              >
                Why?
              </Button>
              <Button
                onClick={resetMaze}
                className="rounded-full bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold px-5"
              >
                Retry
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Explanation Popover Modal (Screenshot 5) */}
      <AnimatePresence>
        {showExplanation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-3xl border border-border/80 bg-card p-6 text-foreground shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <h4 className="text-lg font-bold font-serif text-foreground">Explanation</h4>
                <button
                  type="button"
                  onClick={() => setShowExplanation(false)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="py-4 space-y-3 text-center">
                <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 font-mono text-xs text-left space-y-1.5">
                  <div className="text-primary font-bold">move forward</div>
                  <div className="text-primary font-bold">move forward</div>
                  <div className="text-purple-500 font-bold">turn right</div>
                  <div className="text-primary font-bold">move forward</div>
                  <div className="text-primary font-bold">move forward</div>
                </div>

                <div className="space-y-1 pt-2">
                  <h5 className="font-bold text-sm text-foreground">
                    {config.explanationSteps[explanationStep]?.title}
                  </h5>
                  <p className="text-xs text-muted-foreground">
                    {config.explanationSteps[explanationStep]?.description}
                  </p>
                </div>

                {/* Explanation Slider Stepper */}
                <div className="flex items-center justify-center gap-3 pt-3">
                  <button
                    type="button"
                    disabled={explanationStep === 0}
                    onClick={() => setExplanationStep((p) => Math.max(0, p - 1))}
                    className="p-1 rounded-full text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronLeft className="size-4" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    {config.explanationSteps.map((_, i) => (
                      <span
                        key={i}
                        className={`size-2 rounded-full transition-colors ${
                          i === explanationStep ? "bg-primary" : "bg-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={explanationStep === config.explanationSteps.length - 1}
                    onClick={() =>
                      setExplanationStep((p) => Math.min(config.explanationSteps.length - 1, p + 1))
                    }
                    className="p-1 rounded-full text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>

              <div className="pt-3">
                <Button
                  onClick={() => setShowExplanation(false)}
                  className="w-full rounded-full font-bold text-xs"
                >
                  Got it
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
