import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";
import { HelmetCompanion } from "@/components/mascot/HelmetCompanion";
import { Button } from "@/components/ui/button";

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

  const mood =
    hoverTarget === "confirm" ? "sad" : hoverTarget === "cancel" ? "happy" : "neutral";

  const speech =
    hoverTarget === "confirm"
      ? "Aww, don't go..."
      : hoverTarget === "cancel"
        ? "Yay, stay with me!"
        : "Going somewhere?";

  const gaze =
    hoverTarget === "confirm"
      ? { x: 22, y: 12 }
      : hoverTarget === "cancel"
        ? { x: -22, y: 12 }
        : { x: 0, y: 0 };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-sm overflow-hidden rounded-[28px] border border-border/40 bg-card/95 p-7 pt-8 shadow-2xl backdrop-blur-xl text-center"
            initial={{ scale: 0.92, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 12 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Cancel logout"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Speech Bubble Pill */}
            <div className="mx-auto min-h-[36px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={speech}
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="inline-flex items-center justify-center rounded-full border border-border/60 bg-muted/80 px-4 py-1.5 text-xs font-semibold text-foreground shadow-xs"
                >
                  {speech}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Mint Green Mascot */}
            <div className="my-4 flex justify-center">
              <HelmetCompanion size="lg" mood={mood} gaze={gaze} />
            </div>

            {/* Title & Description */}
            <h2 className="text-2xl font-bold tracking-tight text-foreground font-serif">
              Log Out?
            </h2>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed px-2">
              You'll need to sign in again to access your account.
            </p>

            {/* Interactive Action Buttons */}
            <div className="mt-6 flex items-center gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 rounded-2xl h-11 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                onClick={onClose}
                onMouseEnter={() => setHoverTarget("cancel")}
                onMouseLeave={() => setHoverTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="lg"
                className="flex-1 rounded-2xl h-11 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-destructive/20"
                onClick={onConfirm}
                disabled={isSubmitting}
                onMouseEnter={() => setHoverTarget("confirm")}
                onMouseLeave={() => setHoverTarget(null)}
              >
                {isSubmitting ? "Logging out..." : "Log Out"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
