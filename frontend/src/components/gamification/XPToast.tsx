import { AnimatePresence, motion } from "framer-motion";
import { Zap } from "lucide-react";
import { useEffect } from "react";

export interface XPToastProps {
  amount: number;
  show: boolean;
  onDismiss: () => void;
  duration?: number;
}

export function XPToast({ amount, show, onDismiss, duration = 2600 }: XPToastProps) {
  useEffect(() => {
    if (!show || amount <= 0) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [show, amount, duration, onDismiss]);

  return (
    <AnimatePresence>
      {show && amount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.6 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
          className="pointer-events-none fixed left-1/2 top-24 z-50 -translate-x-1/2"
          role="status"
          aria-live="assertive"
        >
          <div className="flex items-center gap-2 rounded-full border border-gold/30 bg-gradient-to-r from-gold to-orange px-5 py-2.5 shadow-lg shadow-gold/30">
            <Zap className="h-5 w-5 fill-white text-white" />
            <span className="text-base font-extrabold text-white drop-shadow">+{amount} XP</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
