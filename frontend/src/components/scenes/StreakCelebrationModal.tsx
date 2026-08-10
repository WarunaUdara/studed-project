import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { StreakScreen, useLiquidGlass } from "./StreakScreen";
import "./streak.css";

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
  const [playKey, setPlayKey] = useState(0);

  useLiquidGlass(hostRef);

  useEffect(() => {
    if (isOpen) {
      setPlayKey((k) => k + 1);
    }
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <motion.div
            ref={hostRef}
            className="scene-host-modal studed-theme-scene relative flex flex-col justify-between"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
            onClick={(e) => e.stopPropagation()}
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
              playKey={playKey}
              streakCount={streakCount}
              longestStreak={longestStreak}
              onNext={onClose}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
