import { AnimatePresence, motion } from "framer-motion";
import { JellyBlobMascot, type JellyBlobMood } from "feral-blob";
import "feral-blob/blob.css";
import { useCallback, useRef, useState } from "react";
import { playClickSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export interface HelmetCompanionProps {
  mood?: JellyBlobMood;
  gaze?: { x: number; y: number };
  speech?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  peeking?: boolean;
  showSpeech?: boolean;
  onOverpoke?: () => void;
  onPoke?: (count: number) => void;
}

const POKE_DIALOGS = [
  { text: "Hey!", mood: "neutral" as const },
  { text: "That tickles!", mood: "hmm" as const },
  { text: "Whoa, steady!", mood: "sideEye" as const },
  { text: "Are you testing my physics?", mood: "sideEye" as const },
  { text: "Wiggling intensifies!", mood: "neutral" as const },
  { text: "Hmph. Rude!", mood: "angry" as const },
];

export function HelmetCompanion({
  mood: externalMood = "neutral",
  gaze = { x: 0, y: 0 },
  speech: externalSpeech,
  className,
  size = "md",
  peeking = false,
  showSpeech = false,
  onOverpoke,
  onPoke,
}: HelmetCompanionProps) {
  const [, setPokeCount] = useState(0);
  const [pokeSpeech, setPokeSpeech] = useState<string | null>(null);
  const [pokeMood, setPokeMood] = useState<JellyBlobMood | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeMood = pokeMood ?? externalMood;
  const activeSpeech = pokeSpeech ?? externalSpeech ?? (showSpeech ? "Hi there!" : undefined);

  const handlePoke = useCallback(() => {
    playClickSound();
    setPokeCount((prev) => {
      const next = prev + 1;
      const dialogIdx = Math.min(next - 1, POKE_DIALOGS.length - 1);
      const dialog = POKE_DIALOGS[dialogIdx];

      setPokeSpeech(dialog.text);
      setPokeMood(dialog.mood);

      if (onPoke) onPoke(next);

      if (next >= 6 && onOverpoke) {
        onOverpoke();
      }

      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => {
        setPokeCount(0);
        setPokeSpeech(null);
        setPokeMood(null);
      }, 3000);

      return next;
    });
  }, [onOverpoke, onPoke]);

  const sizeClass =
    size === "sm"
      ? "h-20 w-20"
      : size === "lg"
        ? "h-36 w-36"
        : size === "xl"
          ? "h-44 w-44"
          : "h-28 w-28";

  return (
    <div
      onClick={handlePoke}
      className={cn(
        "jelly-mint relative inline-flex flex-col items-center justify-center transition-transform hover:scale-105 select-none pointer-events-auto cursor-pointer",
        sizeClass,
        peeking && "absolute -top-14 right-4 z-50 drop-shadow-md",
        className,
      )}
    >
      <div className="absolute bottom-full -mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap z-50 pointer-events-none">
        <AnimatePresence mode="wait">
          {activeSpeech && (
            <motion.div
              key={activeSpeech}
              initial={{ opacity: 0, y: 4, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="relative inline-block"
            >
              <div
                className={cn(
                  "rounded-2xl border px-3.5 py-1.5 text-xs font-bold shadow-md transition-colors duration-300 backdrop-blur-md",
                  activeMood === "angry"
                    ? "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-300 shadow-rose-500/10"
                    : activeMood === "sideEye" || activeMood === "hmm"
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300 shadow-amber-500/10"
                      : (activeMood as string) === "happy" || (activeMood as string) === "excited"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 shadow-emerald-500/10"
                        : "border-border bg-card/95 text-foreground shadow-xs",
                )}
              >
                {activeSpeech}
              </div>
              {/* Downward triangle tail */}
              <div
                className={cn(
                  "absolute left-1/2 -bottom-1 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-r border-b transition-colors duration-300",
                  activeMood === "angry"
                    ? "border-rose-500/40 bg-rose-500/10"
                    : activeMood === "sideEye" || activeMood === "hmm"
                      ? "border-amber-500/40 bg-amber-500/10"
                      : (activeMood as string) === "happy" || (activeMood as string) === "excited"
                        ? "border-emerald-500/40 bg-emerald-500/10"
                        : "border-border bg-card/95",
                )}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <JellyBlobMascot
        mood={activeMood}
        gaze={gaze}
        onOverpoke={() => {
          setPokeMood("angry");
          setPokeSpeech("Hmph. Rude!");
          if (onOverpoke) onOverpoke();
        }}
      />
    </div>
  );
}
