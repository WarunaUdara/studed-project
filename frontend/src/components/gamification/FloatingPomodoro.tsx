import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Coffee,
  Flame,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Settings,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { usePomodoroStore } from "@/stores/pomodoro";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

export function FloatingPomodoro() {
  const {
    timeLeft,
    durations,
    mode,
    isActive,
    task,
    sessionsCompleted,
    ambientNoise,
    isMinimized,
    showFloatingWidget,
    autoStartBreaks,
    autoStartFocus,
    setTask,
    togglePlay,
    resetTimer,
    skipTimer,
    setAmbientNoise,
    setIsMinimized,
    setShowFloatingWidget,
    updateDurations,
    setAutoStartBreaks,
    setAutoStartFocus,
  } = usePomodoroStore();

  const [showSettings, setShowSettings] = useState(false);
  const [focusMin, setFocusMin] = useState(Math.round(durations.focus / 60));
  const [shortMin, setShortMin] = useState(Math.round(durations.short / 60));
  const [longMin, setLongMin] = useState(Math.round(durations.long / 60));

  if (!showFloatingWidget) return null;

  const currentDuration = durations[mode];
  const progress = (timeLeft / currentDuration) * 100;

  // Format time (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateDurations({
      focus: Math.max(1, focusMin),
      short: Math.max(1, shortMin),
      long: Math.max(1, longMin),
    });
    setShowSettings(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        drag
        dragMomentum={false}
        whileHover={{ scale: 1.04 }}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 250 }}
        className="fixed bottom-6 right-6 z-50 w-64 md:w-72 cursor-grab active:cursor-grabbing select-none"
      >
        {isMinimized ? (
          /* MINIMIZED VIEW */
          <motion.div
            layoutId="pomodoro-expanded"
            onClick={() => setIsMinimized(false)}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-full border px-4 py-2.5 shadow-lg backdrop-blur-md",
              mode === "focus"
                ? "border-primary/30 bg-primary/10 hover:bg-primary/15"
                : "border-success/30 bg-success/10 hover:bg-success/15",
            )}
          >
            <div className="relative h-6 w-6">
              <svg aria-hidden="true" className="h-6 w-6 -rotate-90">
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  className="stroke-muted/40 fill-transparent"
                  strokeWidth="2.5"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  className={cn(
                    "fill-transparent transition-all duration-300",
                    mode === "focus" ? "stroke-primary" : "stroke-success",
                  )}
                  strokeWidth="2.5"
                  strokeDasharray={56.5}
                  strokeDashoffset={56.5 - (56.5 * progress) / 100}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {mode === "focus" ? (
                  <Flame className="h-3 w-3 text-primary" />
                ) : (
                  <Coffee className="h-3 w-3 text-success" />
                )}
              </div>
            </div>
            <span className="text-sm font-bold tabular-nums tracking-tight">
              {formatTime(timeLeft)}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {mode}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="ml-auto rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
          </motion.div>
        ) : (
          /* EXPANDED VIEW */
          <motion.div layoutId="pomodoro-expanded">
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-b from-card to-background shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="flex items-center gap-2 text-sm font-bold">
                  <Flame className={cn("h-4 w-4", isActive && "animate-pulse text-primary")} />
                  {mode === "focus"
                    ? "Focus Interval"
                    : mode === "short"
                      ? "Short Break"
                      : "Long Break"}
                  {sessionsCompleted > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-success">
                      <CheckCircle2 className="h-3 w-3" />
                      {sessionsCompleted}
                    </span>
                  )}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowSettings(!showSettings)}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="Settings"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMinimized(true)}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="Minimize"
                  >
                    <Minimize2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetTimer();
                      setShowFloatingWidget(false);
                    }}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="Close"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3.5">
                <AnimatePresence mode="wait">
                  {showSettings ? (
                    /* SETTINGS CARD FACE */
                    <motion.form
                      key="settings"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      onSubmit={handleSaveSettings}
                      className="space-y-3 pt-1 text-xs"
                    >
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="mb-1 block font-semibold text-muted-foreground">
                            Focus
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="90"
                            value={focusMin}
                            onChange={(e) => setFocusMin(Number(e.target.value))}
                            className="w-full rounded-md border bg-background px-2 py-1 text-center outline-none focus:border-primary/50"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block font-semibold text-muted-foreground">
                            Break
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={shortMin}
                            onChange={(e) => setShortMin(Number(e.target.value))}
                            className="w-full rounded-md border bg-background px-2 py-1 text-center outline-none focus:border-primary/50"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block font-semibold text-muted-foreground">
                            Long
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="45"
                            value={longMin}
                            onChange={(e) => setLongMin(Number(e.target.value))}
                            className="w-full rounded-md border bg-background px-2 py-1 text-center outline-none focus:border-primary/50"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Auto-start Breaks</span>
                          <input
                            type="checkbox"
                            checked={autoStartBreaks}
                            onChange={(e) => setAutoStartBreaks(e.target.checked)}
                            className="accent-primary"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Auto-start Focus</span>
                          <input
                            type="checkbox"
                            checked={autoStartFocus}
                            onChange={(e) => setAutoStartFocus(e.target.checked)}
                            className="accent-primary"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setShowSettings(false)}
                          className="flex-1"
                          size="xs"
                        >
                          Cancel
                        </Button>
                        <Button type="submit" className="flex-1" size="xs">
                          Save
                        </Button>
                      </div>
                    </motion.form>
                  ) : (
                    /* TIMER CARD FACE */
                    <motion.div
                      key="timer"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-3.5"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-2xl font-black tabular-nums tracking-tight">
                            {formatTime(timeLeft)}
                          </span>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            {mode === "focus" ? "focus time" : "break time"}
                          </p>
                        </div>

                        {/* Circular progress bar in mini view */}
                        <div className="relative h-12 w-12 -rotate-90">
                          <svg aria-hidden="true" className="h-12 w-12">
                            <circle
                              cx="24"
                              cy="24"
                              r="21"
                              className="stroke-muted fill-transparent"
                              strokeWidth="3"
                            />
                            <circle
                              cx="24"
                              cy="24"
                              r="21"
                              className={cn(
                                "fill-transparent transition-all duration-300",
                                mode === "focus" ? "stroke-primary" : "stroke-success",
                              )}
                              strokeWidth="3"
                              strokeDasharray={131.95}
                              strokeDashoffset={131.95 - (131.95 * progress) / 100}
                            />
                          </svg>
                        </div>
                      </div>

                      {mode === "focus" && (
                        <input
                          type="text"
                          placeholder="Current task commitment..."
                          value={task}
                          onChange={(e) => setTask(e.target.value)}
                          className="w-full rounded-md border bg-background px-2.5 py-1 text-[11px] outline-none placeholder:text-muted-foreground/60 focus:border-primary/50"
                        />
                      )}

                      {/* Ambient noise settings in-place */}
                      <div className="flex items-center justify-between rounded-lg bg-muted/40 p-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {ambientNoise === "none" ? (
                            <VolumeX className="h-3 w-3" />
                          ) : (
                            <Volume2 className="h-3 w-3 text-primary" />
                          )}
                          Sound Ambient
                        </span>
                        <div className="flex gap-1">
                          {(["none", "brown", "pink", "white", "adhd"] as const).map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setAmbientNoise(n)}
                              className={cn(
                                "rounded px-1 py-0.5 font-bold uppercase transition-all",
                                ambientNoise === n
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:text-foreground",
                              )}
                            >
                              {n === "none"
                                ? "off"
                                : n === "brown"
                                  ? "rain"
                                  : n === "pink"
                                    ? "ocean"
                                    : n === "white"
                                      ? "white"
                                      : "adhd"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-2">
                        <Button onClick={togglePlay} className="flex-1 gap-1" size="xs">
                          {isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                          {isActive ? "Pause" : "Start"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (isActive && mode === "focus") {
                              const confirmReset = window.confirm(
                                "Warning: Resetting the timer now will discard your current progress towards +10 XP. Continue?",
                              );
                              if (!confirmReset) return;
                            }
                            resetTimer();
                          }}
                          size="xs"
                          title="Reset"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" onClick={skipTimer} size="xs" title="Skip">
                          <SkipForward className="h-3 w-3" />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
