import { create } from "zustand";

export type Language = "EN" | "SI";
export type Theme = "light" | "dark";

export interface UiPreferencesState {
  language: Language;
  theme: Theme;
  reducedMotion: boolean;
  leaderboardOptOut: boolean;
  showRankNotifs: boolean;
  soundEnabled: boolean;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  setReducedMotion: (v: boolean) => void;
  setLeaderboardOptOut: (v: boolean) => void;
  setShowRankNotifs: (v: boolean) => void;
  setSoundEnabled: (v: boolean) => void;
  toggleLanguage: () => void;
  toggleTheme: () => void;
  hydrate: () => void;
}

const STORAGE_KEY = "studed-ui-prefs";

interface PersistedPrefs {
  language: Language;
  theme: Theme;
  reducedMotion: boolean;
  leaderboardOptOut: boolean;
  showRankNotifs: boolean;
  soundEnabled: boolean;
}

function read(): Partial<PersistedPrefs> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<PersistedPrefs>) : {};
  } catch {
    return {};
  }
}

function write(prefs: PersistedPrefs) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore: storage may be unavailable
  }
}

export const useUiPrefs = create<UiPreferencesState>((set, get) => ({
  language: "EN",
  theme: "light",
  reducedMotion: false,
  leaderboardOptOut: false,
  showRankNotifs: true,
  soundEnabled: true,
  setLanguage: (language) => {
    set({ language });
    persist(get());
  },
  toggleLanguage: () => {
    const next = get().language === "EN" ? "SI" : "EN";
    set({ language: next });
    persist(get());
  },
  setTheme: (theme) => {
    set({ theme });
    persist(get());
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  },
  toggleTheme: () => {
    const next = get().theme === "light" ? "dark" : "light";
    get().setTheme(next);
  },
  setReducedMotion: (reducedMotion) => {
    set({ reducedMotion });
    persist(get());
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("reduce-motion", reducedMotion);
    }
  },
  setLeaderboardOptOut: (leaderboardOptOut) => {
    set({ leaderboardOptOut });
    persist(get());
  },
  setShowRankNotifs: (showRankNotifs) => {
    set({ showRankNotifs });
    persist(get());
  },
  setSoundEnabled: (soundEnabled) => {
    set({ soundEnabled });
    persist(get());
  },
  hydrate: () => {
    const p = read();
    const theme = p.theme ?? "light";

    set({
      language: p.language ?? "EN",
      theme,
      reducedMotion: p.reducedMotion ?? false,
      leaderboardOptOut: p.leaderboardOptOut ?? false,
      showRankNotifs: p.showRankNotifs ?? true,
      soundEnabled: p.soundEnabled ?? true,
    });

    const reduce = p.reducedMotion ?? false;
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("reduce-motion", reduce);
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  },
}));

function persist(s: UiPreferencesState) {
  write({
    language: s.language,
    theme: s.theme,
    reducedMotion: s.reducedMotion,
    leaderboardOptOut: s.leaderboardOptOut,
    showRankNotifs: s.showRankNotifs,
    soundEnabled: s.soundEnabled,
  });
}
