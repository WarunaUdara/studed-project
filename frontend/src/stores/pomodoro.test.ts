import { beforeEach, describe, expect, it } from "vitest";
import { usePomodoroStore } from "./pomodoro";

describe("usePomodoroStore", () => {
  beforeEach(() => {
    // Reset Zustand store state before each test
    usePomodoroStore.setState({
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
    });
  });

  it("initializes with default 25-minute focus session state", () => {
    const state = usePomodoroStore.getState();
    expect(state.mode).toBe("focus");
    expect(state.timeLeft).toBe(25 * 60);
    expect(state.isActive).toBe(false);
    expect(state.sessionsCompleted).toBe(0);
  });

  it("switches modes and updates initial time left", () => {
    const store = usePomodoroStore.getState();
    store.setMode("short");

    const updated = usePomodoroStore.getState();
    expect(updated.mode).toBe("short");
    expect(updated.timeLeft).toBe(5 * 60);
    expect(updated.isActive).toBe(false);
  });

  it("toggles play state and shows floating widget on play", () => {
    const store = usePomodoroStore.getState();
    expect(store.isActive).toBe(false);

    store.togglePlay();
    const playing = usePomodoroStore.getState();
    expect(playing.isActive).toBe(true);
    expect(playing.showFloatingWidget).toBe(true);

    store.togglePlay();
    const paused = usePomodoroStore.getState();
    expect(paused.isActive).toBe(false);
  });

  it("resets timer duration to current mode duration", () => {
    const store = usePomodoroStore.getState();
    store.togglePlay();
    usePomodoroStore.setState({ timeLeft: 120 });

    store.resetTimer();
    const reset = usePomodoroStore.getState();
    expect(reset.timeLeft).toBe(25 * 60);
    expect(reset.isActive).toBe(false);
  });

  it("updates custom durations and updates time when idle", () => {
    const store = usePomodoroStore.getState();
    store.updateDurations({ focus: 50, short: 10, long: 20 });

    const updated = usePomodoroStore.getState();
    expect(updated.durations.focus).toBe(50 * 60);
    expect(updated.durations.short).toBe(10 * 60);
    expect(updated.durations.long).toBe(20 * 60);
    expect(updated.timeLeft).toBe(50 * 60);
  });

  it("skips focus session, increments completion count, and transitions to short break", () => {
    const store = usePomodoroStore.getState();
    store.skipTimer();

    const state = usePomodoroStore.getState();
    expect(state.sessionsCompleted).toBe(1);
    expect(state.mode).toBe("short");
    expect(state.timeLeft).toBe(5 * 60);
    expect(state.showConfetti).toBe(true);
  });

  it("rotates to long break after 4 completed focus sessions", () => {
    usePomodoroStore.setState({ sessionsCompleted: 3, mode: "focus" });
    const store = usePomodoroStore.getState();

    store.skipTimer();
    const state = usePomodoroStore.getState();
    expect(state.sessionsCompleted).toBe(4);
    expect(state.mode).toBe("long");
    expect(state.timeLeft).toBe(15 * 60);
  });
});
