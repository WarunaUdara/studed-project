import {
  Award,
  CheckCircle2,
  Flame,
  Pause,
  Play,
  RotateCcw,
  Settings,
  SkipForward,
  ToggleLeft,
  ToggleRight,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { usePomodoroStore } from "@/stores/pomodoro";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/Card";

interface PomodoroTimerProps {
  onXpEarned?: (xp: number) => void;
}

export function PomodoroTimer(_props: PomodoroTimerProps) {
  const {
    timeLeft,
    durations,
    mode,
    isActive,
    task,
    sessionsCompleted,
    ambientNoise,
    autoStartBreaks,
    autoStartFocus,
    setMode,
    setTask,
    togglePlay,
    resetTimer,
    skipTimer,
    setAmbientNoise,
    updateDurations,
    setAutoStartBreaks,
    setAutoStartFocus,
  } = usePomodoroStore();

  const [showSettings, setShowSettings] = useState(false);
  const [focusMin, setFocusMin] = useState(Math.round(durations.focus / 60));
  const [shortMin, setShortMin] = useState(Math.round(durations.short / 60));
  const [longMin, setLongMin] = useState(Math.round(durations.long / 60));

  const currentDuration = durations[mode];
  const progress = (timeLeft / currentDuration) * 100;

  // Format time (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleApplyPreset = (focus: number, short: number, long: number) => {
    setFocusMin(focus);
    setShortMin(short);
    setLongMin(long);
    updateDurations({ focus, short, long });
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
    <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Flame
              className={cn(
                "h-5 w-5",
                isActive ? "animate-pulse text-primary" : "text-muted-foreground",
              )}
            />
            Focus Session Hub
          </span>
          <div className="flex items-center gap-1.5">
            {sessionsCompleted > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {sessionsCompleted} Done
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
                showSettings && "bg-muted text-primary",
              )}
              title="Customize intervals & preset options"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </CardTitle>
        <CardDescription>
          {showSettings
            ? "Customize durations and system preferences"
            : "Follow focus intervals to train your brain"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showSettings ? (
          /* SETTINGS CARD FACE */
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            {/* Quick Presets */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Quick Presets
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset(25, 5, 15)}
                  className="flex-1 rounded-md border bg-background/50 hover:bg-background/80 py-1.5 transition-colors font-medium"
                >
                  Classic (25/5)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(50, 10, 20)}
                  className="flex-1 rounded-md border bg-background/50 hover:bg-background/80 py-1.5 transition-colors font-medium"
                >
                  Double (50/10)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(15, 3, 10)}
                  className="flex-1 rounded-md border bg-background/50 hover:bg-background/80 py-1.5 transition-colors font-medium"
                >
                  Short (15/3)
                </button>
              </div>
            </div>

            {/* Custom durations inputs */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Custom Intervals (Minutes)
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-muted-foreground font-semibold">Focus</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={focusMin}
                    onChange={(e) => setFocusMin(Number(e.target.value))}
                    className="w-full rounded-lg border bg-background px-3 py-1.5 text-center outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-muted-foreground font-semibold">Short Break</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={shortMin}
                    onChange={(e) => setShortMin(Number(e.target.value))}
                    className="w-full rounded-lg border bg-background px-3 py-1.5 text-center outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-muted-foreground font-semibold">Long Break</label>
                  <input
                    type="number"
                    min="1"
                    max="45"
                    value={longMin}
                    onChange={(e) => setLongMin(Number(e.target.value))}
                    className="w-full rounded-lg border bg-background px-3 py-1.5 text-center outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Auto Start Switches */}
            <div className="space-y-3 border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Auto-start Breaks</span>
                <button
                  type="button"
                  onClick={() => setAutoStartBreaks(!autoStartBreaks)}
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  {autoStartBreaks ? (
                    <ToggleRight className="h-7 w-7 text-primary" />
                  ) : (
                    <ToggleLeft className="h-7 w-7 text-muted-foreground" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Auto-start Focus Sessions</span>
                <button
                  type="button"
                  onClick={() => setAutoStartFocus(!autoStartFocus)}
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  {autoStartFocus ? (
                    <ToggleRight className="h-7 w-7 text-primary" />
                  ) : (
                    <ToggleLeft className="h-7 w-7 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-2 border-t pt-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setFocusMin(Math.round(durations.focus / 60));
                  setShortMin(Math.round(durations.short / 60));
                  setLongMin(Math.round(durations.long / 60));
                  setShowSettings(false);
                }}
                className="flex-1"
                size="sm"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" size="sm">
                Save Preferences
              </Button>
            </div>
          </form>
        ) : (
          /* TIMER TIMER FACE */
          <>
            {/* Mode Switcher */}
            <div className="flex rounded-lg bg-muted p-1">
              {(["focus", "short", "long"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  data-testid={`pomodoro-mode-${m}`}
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex-1 rounded-md py-1.5 text-[11px] font-bold transition-all capitalize",
                    mode === m
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m === "focus" ? "focus" : m === "short" ? "short break" : "long break"}
                </button>
              ))}
            </div>

            {/* Circular SVG / Timer Countdown Display */}
            <div className="relative flex flex-col items-center justify-center py-4">
              <svg aria-hidden="true" className="h-36 w-36 -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="66"
                  className="stroke-muted fill-transparent"
                  strokeWidth="6"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="66"
                  className={cn(
                    "fill-transparent transition-all duration-300",
                    mode === "focus" ? "stroke-primary" : "stroke-success",
                  )}
                  strokeWidth="6"
                  strokeDasharray={414.69}
                  strokeDashoffset={414.69 - (414.69 * progress) / 100}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span
                  className="text-3xl font-black tabular-nums tracking-tight"
                  data-testid="pomodoro-time"
                >
                  {formatTime(timeLeft)}
                </span>
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider mt-0.5">
                  {mode === "focus" ? "focusing" : "on break"}
                </span>
              </div>
            </div>

            {/* Task Name Field */}
            {mode === "focus" && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block">
                  Current Commitment
                </label>
                <input
                  type="text"
                  placeholder="Commit to single task (Zeigarnik Effect)"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  data-testid="pomodoro-task-input"
                  aria-label="Focus task"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-xs outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                />
              </div>
            )}

            {/* Ambient Focus Sounds Selector */}
            <div className="flex items-center justify-between rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                {ambientNoise === "none" ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4 text-primary" />
                )}
                Ambient Noise
              </span>
              <div className="flex gap-1">
                {(["none", "brown", "pink", "white", "adhd"] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAmbientNoise(n)}
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase transition-all",
                      ambientNoise === n
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:text-foreground hover:bg-muted",
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

            {/* Buttons Controls */}
            <div className="flex gap-2">
              <Button
                type="button"
                data-testid="pomodoro-play-pause"
                onClick={togglePlay}
                className="flex-1 gap-1.5"
                size="sm"
              >
                {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isActive ? "Pause" : "Start"}
              </Button>

              <Button
                type="button"
                data-testid="pomodoro-reset"
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
                size="sm"
                className="px-2.5"
                aria-label="Reset timer"
                title="Reset timer"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                data-testid="pomodoro-skip"
                variant="outline"
                onClick={skipTimer}
                size="sm"
                className="px-2.5"
                aria-label="Skip timer"
                title="Skip timer"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {mode === "focus" && (
              <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground pt-1 border-t">
                <Award className="h-3 w-3 text-primary animate-bounce" />
                Finish session to earn{" "}
                <span className="font-semibold text-foreground">+10 Focus XP</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
