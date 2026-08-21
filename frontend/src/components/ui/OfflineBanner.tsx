import { AnimatePresence, motion } from "framer-motion";
import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          className="fixed top-0 inset-x-0 z-50 bg-amber-600 text-white text-xs md:text-sm font-medium py-2 px-4 flex items-center justify-center gap-2 shadow-lg"
          role="alert"
        >
          <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
          <span>
            You are currently offline. Some features and live wave updates may be delayed.
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
