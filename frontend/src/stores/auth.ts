import { create } from "zustand";

export type UserRole = "STUDENT" | "EDUCATOR" | "HEAD_EDUCATOR" | "ADMIN";
export type Grade =
  | "G1"
  | "G2"
  | "G3"
  | "G4"
  | "G5"
  | "G6"
  | "G7"
  | "G8"
  | "G9"
  | "G10"
  | "G11"
  | "OL"
  | "AL";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  grade?: Grade | null;
  preferredLanguage: string;
  totalXp: number;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  updateTotalXp: (totalXp: number) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) => {
    if (user !== null) {
      localStorage.setItem("studed_has_session", "true");
    }
    set({
      user,
      isAuthenticated: user !== null,
      isLoading: false,
    });
  },
  setLoading: (isLoading) => set({ isLoading }),
  updateTotalXp: (totalXp) =>
    set((state) => (state.user ? { user: { ...state.user, totalXp } } : {})),
  logout: () => {
    localStorage.removeItem("studed_has_session");
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));
