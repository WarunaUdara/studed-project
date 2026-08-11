import { BlobSpeech, JellyBlobMascot, type JellyBlobMood } from "feral-blob";
import "feral-blob/blob.css";
import { useCallback, useRef, useState } from "react";
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
  const activeSpeech = pokeSpeech ?? externalSpeech;

  const handlePoke = useCallback(() => {
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
      {(showSpeech || activeSpeech) && (
        <div className="absolute -top-11 left-1/2 -translate-x-1/2 whitespace-nowrap z-50 pointer-events-none">
          <BlobSpeech
            mood={activeMood}
            messages={{ [activeMood]: activeSpeech ?? "Going somewhere?" }}
          />
        </div>
      )}
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
