import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, SkipForward, CheckCircle2, Flame, Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface PomodoroTimerProps {
  onXpEarned?: (xp: number) => void;
}

export function PomodoroTimer({ onXpEarned }: PomodoroTimerProps) {
  const [mode, setMode] = useState<"focus" | "short" | "long">("focus");
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [task, setTask] = useState("");
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const timerRef = useRef<any>(null);

  // Time configurations in seconds
  const TIMES = {
    focus: 25 * 60,
    short: 5 * 60,
    long: 15 * 60,
  };

  // Switch modes
  const handleModeChange = (newMode: "focus" | "short" | "long") => {
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(TIMES[newMode]);
  };

  // Reset timer
  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(TIMES[mode]);
  };

  // Skip / complete session manually or transition
  const handleSkip = () => {
    setIsActive(false);
    if (mode === "focus") {
      triggerCompletion();
    } else {
      handleModeChange("focus");
    }
  };

  // Play synthetic completion alert sound
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
      oscillator.stop(audioCtx.currentTime + 1.2);
    } catch (e) {
      console.warn("AudioContext block", e);
    }
  };

  const triggerCompletion = () => {
    playAlertSound();
    if (mode === "focus") {
      setSessionsCompleted((prev) => prev + 1);
      if (onXpEarned) {
        onXpEarned(10); // Award 10 XP for completing a session
      }
      // Transition to break
      const nextBreak = (sessionsCompleted + 1) % 4 === 0 ? "long" : "short";
      handleModeChange(nextBreak);
    } else {
      handleModeChange("focus");
    }
  };

  // Timer loop
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            triggerCompletion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, mode, sessionsCompleted]);

  // Format time (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const progress = (timeLeft / TIMES[mode]) * 100;
  const currentTaskPlaceholder = mode === "focus" ? "What are we focusing on?" : "Take a deep breath...";

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Flame className={cn("h-5 w-5", isActive ? "animate-pulse text-primary" : "text-muted-foreground")} />
            Pomodoro Focus Timer
          </span>
          {sessionsCompleted > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-success">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {sessionsCompleted} Done
            </span>
          )}
        </CardTitle>
        <CardDescription>Follow focus study intervals</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode Switcher */}
        <div className="flex rounded-lg bg-muted p-1">
          {(["focus", "short", "long"] as const).map((m) => (
            <button
              key={m}
              type="button"
              data-testid={`pomodoro-mode-${m}`}
              onClick={() => handleModeChange(m)}
              className={cn(
                "flex-1 rounded-md py-1 text-[11px] font-semibold transition-all capitalize",
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
          <svg className="h-32 w-32 -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="58"
              className="stroke-muted fill-transparent"
              strokeWidth="6"
            />
            <circle
              cx="64"
              cy="64"
              r="58"
              className="stroke-primary fill-transparent transition-all duration-300"
              strokeWidth="6"
              strokeDasharray={364.4}
              strokeDashoffset={364.4 - (364.4 * progress) / 100}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl font-black tabular-nums tracking-tight" data-testid="pomodoro-time">
              {formatTime(timeLeft)}
            </span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              {mode === "focus" ? "focusing" : "break"}
            </span>
          </div>
        </div>

        {/* Task Name Field */}
        <input
          type="text"
          placeholder={currentTaskPlaceholder}
          value={task}
          onChange={(e) => setTask(e.target.value)}
          disabled={mode !== "focus"}
          data-testid="pomodoro-task-input"
          className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
        />

        {/* Buttons Controls */}
        <div className="flex gap-2">
          <Button
            type="button"
            data-testid="pomodoro-play-pause"
            onClick={() => setIsActive(!isActive)}
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
            onClick={handleReset}
            size="sm"
            className="px-2.5"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            data-testid="pomodoro-skip"
            variant="outline"
            onClick={handleSkip}
            size="sm"
            className="px-2.5"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {mode === "focus" && (
          <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
            <Award className="h-3 w-3 text-primary" />
            Finish session to gain <span className="font-semibold text-foreground">+10 Focus XP</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
