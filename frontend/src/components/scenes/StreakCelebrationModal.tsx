import { gsap } from "gsap";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { StreakScreen, useLiquidGlass } from "./StreakScreen";
import "./streak.css";
import { prefersReducedMotion } from "@/lib/motion";

export interface StreakCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakCount?: number;
  longestStreak?: number;
}

export function StreakCelebrationModal({
  isOpen,
  onClose,
  streakCount = 7,
  longestStreak = 12,
}: StreakCelebrationModalProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const playKeyRef = useRef(0);

  useLiquidGlass(hostRef);

  useEffect(() => {
    if (isOpen) {
      playKeyRef.current += 1;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!overlayRef.current || !panelRef.current) return;
    if (prefersReducedMotion()) {
      gsap.set([overlayRef.current, panelRef.current], {
        opacity: 1,
        scale: 1,
        y: 0,
      });
      return;
    }
    const tweens = [
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 }),
      gsap.fromTo(
        panelRef.current,
        { scale: 0.9, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.3)" },
      ),
    ];
    return () => {
      tweens.forEach((t) => {
        t.kill();
      });
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close streak celebration"
        onClick={onClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-md cursor-default"
      />
      <div
        ref={panelRef}
        className="scene-host-modal studed-theme-scene relative flex flex-col justify-between"
        role="dialog"
        aria-modal="true"
        aria-label="Streak celebration"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-black/20 text-foreground/80 backdrop-blur-md transition-all hover:bg-black/30 hover:text-foreground active:scale-95 border border-white/20 shadow-xs"
          aria-label="Close streak celebration"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Streak FeralUI Scene */}
        <StreakScreen
          playKey={playKeyRef.current}
          streakCount={streakCount}
          longestStreak={longestStreak}
          onNext={onClose}
        />
      </div>
    </div>
  );
}
