import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { JellyBlobMascot } from "feral-blob";
import "feral-blob/blob.css";
import { playClickSound, playSuccessSound } from "@/lib/sounds";

export interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export function LogoutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
}: LogoutConfirmModalProps) {
  const [hoverTarget, setHoverTarget] = useState<"cancel" | "confirm" | null>(null);
  const [isPoked, setIsPoked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Strict emotion rules as specified:
  // 1. Clicked character -> "hmm"
  // 2. Hover Log Out button -> "sad"
  // 3. Normal / default / Cancel hover -> "neutral"
  const mood = isPoked
    ? "hmm"
    : hoverTarget === "confirm"
      ? "sad"
      : "neutral";

  const speech = isPoked
    ? "Hmm?"
    : hoverTarget === "confirm"
      ? "Aww, don't go..."
      : hoverTarget === "cancel"
        ? "Yay, stay with me!"
        : "Going somewhere?";

  const gaze = isPoked
    ? { x: 0, y: -12 }
    : hoverTarget === "confirm"
      ? { x: 22, y: 18 }
      : hoverTarget === "cancel"
        ? { x: -18, y: 12 }
        : { x: 0, y: 0 };

  const handleMascotPoke = () => {
    playClickSound();
    setIsPoked(true);
    setTimeout(() => {
      setIsPoked(false);
    }, 1200);
  };

  const handleHoverCancel = () => {
    if (hoverTarget !== "cancel") {
      playClickSound();
      setHoverTarget("cancel");
    }
  };

  const handleHoverConfirm = () => {
    if (hoverTarget !== "confirm") {
      playClickSound();
      setHoverTarget("confirm");
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 select-none">
          {/* Full Screen Viewport Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Modal Card */}
          <motion.div
            className="relative z-10 my-auto w-full max-w-[340px] sm:max-w-[360px] overflow-hidden rounded-[32px] border border-white/10 bg-[#16171a]/95 p-7 shadow-2xl backdrop-blur-2xl text-center"
            initial={{ scale: 0.9, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 16 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.12 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Reactive Glow behind mascot */}
            <motion.div
              className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-44 w-44 rounded-full blur-3xl transition-colors duration-500"
              animate={{
                backgroundColor:
                  hoverTarget === "cancel"
                    ? "rgba(16, 185, 129, 0.25)"
                    : hoverTarget === "confirm"
                      ? "rgba(244, 63, 94, 0.25)"
                      : "rgba(255, 255, 255, 0.08)",
              }}
            />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/70 transition-all hover:bg-white/20 hover:text-white hover:scale-105 active:scale-95 z-20"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Dynamic Speech Bubble */}
            <div className="flex flex-col items-center pt-1 min-h-[44px] justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={speech}
                  initial={{ opacity: 0, y: 4, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="relative inline-block"
                >
                  <div
                    className={`rounded-2xl border px-4 py-1.5 text-xs font-bold shadow-lg transition-colors duration-300 ${hoverTarget === "cancel"
                        ? "border-emerald-500/40 bg-emerald-950/80 text-emerald-300 shadow-emerald-900/30"
                        : hoverTarget === "confirm"
                          ? "border-rose-500/40 bg-rose-950/80 text-rose-300 shadow-rose-900/30"
                          : "border-white/15 bg-[#252730] text-white shadow-black/40"
                      }`}
                  >
                    {speech}
                  </div>
                  {/* Downward triangle tail */}
                  <div
                    className={`absolute left-1/2 -bottom-1 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-r border-b transition-colors duration-300 ${hoverTarget === "cancel"
                        ? "border-emerald-500/40 bg-emerald-950/80"
                        : hoverTarget === "confirm"
                          ? "border-rose-500/40 bg-rose-950/80"
                          : "border-white/15 bg-[#252730]"
                      }`}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Character Mascot with smooth spring animation */}
              <motion.div
                onClick={handleMascotPoke}
                className="jelly-mint relative my-3 inline-flex h-32 w-32 cursor-pointer flex-col items-center justify-center select-none"
                animate={{
                  scale: hoverTarget === "cancel" ? 1.08 : hoverTarget === "confirm" ? 0.94 : isPoked ? 1.1 : 1,
                  y: hoverTarget === "cancel" ? -4 : hoverTarget === "confirm" ? 4 : isPoked ? -6 : 0,
                  rotate: isPoked ? [0, -12, 12, -6, 6, 0] : hoverTarget === "cancel" ? -3 : hoverTarget === "confirm" ? 3 : 0,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <JellyBlobMascot mood={mood} gaze={gaze} />
              </motion.div>
            </div>

            {/* Title & Description */}
            <div className="mt-1 space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-white font-sans">
                Log Out?
              </h2>
              <p className="text-xs text-white/60 leading-relaxed px-2">
                You'll need to sign in again to access your account.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center gap-3">
              {/* Cancel Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={(e) => {
                  e.stopPropagation();
                  playSuccessSound();
                  handleDismiss();
                }}
                onMouseEnter={() => {
                  playClickSound();
                  setHoverTarget("cancel");
                }}
                onMouseLeave={() => setHoverTarget(null)}
                className={`flex-1 rounded-2xl h-11 text-sm font-bold transition-all duration-200 border ${
                  hoverTarget === "cancel"
                    ? "bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/30"
                    : "bg-[#252730] border-white/10 text-white/90 hover:bg-[#2f313d]"
                }`}
              >
                Cancel
              </motion.button>

              {/* Log Out Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.96 }}
                disabled={isSubmitting}
                onClick={(e) => {
                  e.stopPropagation();
                  playClickSound();
                  onConfirm();
                }}
                onMouseEnter={() => {
                  playClickSound();
                  setHoverTarget("confirm");
                }}
                onMouseLeave={() => setHoverTarget(null)}
                className={`flex-1 rounded-2xl h-11 text-sm font-bold transition-all duration-200 border ${
                  hoverTarget === "confirm"
                    ? "bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-600/30"
                    : "bg-[#2f1b1d] border-rose-900/40 text-rose-400 hover:bg-rose-600 hover:text-white"
                }`}
              >
                {isSubmitting ? "Logging out..." : "Log Out"}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
