import { create } from "zustand";
import { playAmbientNoise, playSuccessSound, stopAmbientNoise } from "@/lib/sounds";

export type PomodoroMode = "focus" | "short" | "long";
export type AmbientNoiseType = "none" | "brown" | "pink" | "white" | "adhd";

export interface PomodoroDurations {
  focus: number; // in seconds
  short: number; // in seconds
  long: number; // in seconds
}

export interface PomodoroState {
  durations: PomodoroDurations;
  mode: PomodoroMode;
  isActive: boolean;
  timeLeft: number;
  task: string;
  sessionsCompleted: number;
  ambientNoise: AmbientNoiseType;
  isMinimized: boolean;
  showFloatingWidget: boolean;
  showConfetti: boolean;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;

  setMode: (mode: PomodoroMode) => void;
  setTask: (task: string) => void;
  setIsActive: (isActive: boolean) => void;
  setAmbientNoise: (noise: AmbientNoiseType) => void;
  setIsMinimized: (isMinimized: boolean) => void;
  setShowFloatingWidget: (show: boolean) => void;
  setShowConfetti: (show: boolean) => void;
  updateDurations: (durationsInMinutes: { focus: number; short: number; long: number }) => void;
  setAutoStartBreaks: (val: boolean) => void;
  setAutoStartFocus: (val: boolean) => void;
  togglePlay: () => void;
  resetTimer: () => void;
  skipTimer: () => void;
  tick: (onXpEarned?: (xp: number) => void) => void;
  hydrate: () => void;
}

const STORAGE_KEY = "studed-pomodoro-prefs";

interface PersistedPomodoro {
  durations: PomodoroDurations;
  ambientNoise: AmbientNoiseType;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  sessionsCompleted: number;
  task: string;
}

function read(): Partial<PersistedPomodoro> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<PersistedPomodoro>) : {};
  } catch {
    return {};
  }
}

function write(prefs: PersistedPomodoro) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  durations: {
    focus: 25 * 60,
    short: 5 * 60,
    long: 15 * 60,
  },
  mode: "focus",
  isActive: false,
  timeLeft: 25 * 60,
  task: "",
  sessionsCompleted: 0,
  ambientNoise: "none",
  isMinimized: false,
  showFloatingWidget: false,
  showConfetti: false,
  autoStartBreaks: false,
  autoStartFocus: false,

  setMode: (mode) => {
    const s = get();
    const newTime = s.durations[mode];
    set({ mode, timeLeft: newTime, isActive: false });
    stopAmbientNoise();
  },

  setTask: (task) => {
    set({ task });
    persist(get());
  },

  setIsActive: (isActive) => {
    set({ isActive });
    const s = get();
    if (isActive) {
      playAmbientNoise(s.ambientNoise);
    } else {
      stopAmbientNoise();
    }
  },

  setAmbientNoise: (ambientNoise) => {
    set({ ambientNoise });
    persist(get());
    const s = get();
    if (s.isActive) {
      playAmbientNoise(ambientNoise);
    }
  },

  setIsMinimized: (isMinimized) => set({ isMinimized }),
  setShowFloatingWidget: (showFloatingWidget) => set({ showFloatingWidget }),
  setShowConfetti: (showConfetti) => set({ showConfetti }),

  updateDurations: (mins) => {
    const durations = {
      focus: mins.focus * 60,
      short: mins.short * 60,
      long: mins.long * 60,
    };
    set({ durations });
    const s = get();
    // update current time if idle
    if (!s.isActive) {
      set({ timeLeft: durations[s.mode] });
    }
    persist(get());
  },

  setAutoStartBreaks: (autoStartBreaks) => {
    set({ autoStartBreaks });
    persist(get());
  },

  setAutoStartFocus: (autoStartFocus) => {
    set({ autoStartFocus });
    persist(get());
  },

  togglePlay: () => {
    const s = get();
    const nextActive = !s.isActive;
    get().setIsActive(nextActive);
    // Show mini float widget automatically when playing, unless manually dismissed
    if (nextActive) {
      set({ showFloatingWidget: true });
    }
  },

  resetTimer: () => {
    const s = get();
    set({ timeLeft: s.durations[s.mode], isActive: false });
    stopAmbientNoise();
  },

  skipTimer: () => {
    const s = get();
    set({ isActive: false });
    stopAmbientNoise();

    // Trigger completion sound
    playSuccessSound();

    if (s.mode === "focus") {
      const nextSessions = s.sessionsCompleted + 1;
      const nextMode = nextSessions % 4 === 0 ? "long" : "short";
      set({
        sessionsCompleted: nextSessions,
        mode: nextMode,
        timeLeft: s.durations[nextMode],
        showConfetti: true,
        isActive: s.autoStartBreaks,
      });
      if (s.autoStartBreaks) {
        playAmbientNoise(s.ambientNoise);
      }
    } else {
      set({
        mode: "focus",
        timeLeft: s.durations.focus,
        isActive: s.autoStartFocus,
      });
      if (s.autoStartFocus) {
        playAmbientNoise(s.ambientNoise);
      }
    }
    persist(get());
    setTimeout(() => {
      set({ showConfetti: false });
    }, 4000);
  },

  tick: (onXpEarned) => {
    const s = get();
    if (!s.isActive) return;

    if (s.timeLeft <= 1) {
      // Completed!
      set({ isActive: false });
      stopAmbientNoise();
      playSuccessSound();
      set({ showConfetti: true });

      if (s.mode === "focus") {
        const nextSessions = s.sessionsCompleted + 1;
        const nextMode = nextSessions % 4 === 0 ? "long" : "short";
        set({
          sessionsCompleted: nextSessions,
          mode: nextMode,
          timeLeft: s.durations[nextMode],
          isActive: s.autoStartBreaks,
        });

        // Award XP!
        onXpEarned?.(10);

        if (s.autoStartBreaks) {
          playAmbientNoise(s.ambientNoise);
        }
      } else {
        set({
          mode: "focus",
          timeLeft: s.durations.focus,
          isActive: s.autoStartFocus,
        });
        if (s.autoStartFocus) {
          playAmbientNoise(s.ambientNoise);
        }
      }
      persist(get());
      setTimeout(() => {
        set({ showConfetti: false });
      }, 4000);
    } else {
      set({ timeLeft: s.timeLeft - 1 });
    }
  },

  hydrate: () => {
    const p = read();
    const defaultDurations = {
      focus: 25 * 60,
      short: 5 * 60,
      long: 15 * 60,
    };
    const durations = p.durations ?? defaultDurations;
    set({
      durations,
      ambientNoise: p.ambientNoise ?? "none",
      autoStartBreaks: p.autoStartBreaks ?? false,
      autoStartFocus: p.autoStartFocus ?? false,
      sessionsCompleted: p.sessionsCompleted ?? 0,
      task: p.task ?? "",
      timeLeft: durations.focus,
    });
  },
}));

function persist(s: PomodoroState) {
  write({
    durations: s.durations,
    ambientNoise: s.ambientNoise,
    autoStartBreaks: s.autoStartBreaks,
    autoStartFocus: s.autoStartFocus,
    sessionsCompleted: s.sessionsCompleted,
    task: s.task,
  });
}
