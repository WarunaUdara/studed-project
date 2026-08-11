import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { LoginForm } from "@/components/auth/LoginForm";

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          {/* Full Screen Viewport Backdrop Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Modal Dialog Card — 100% Centered in Screen */}
          <motion.div
            className="relative z-10 my-auto w-full max-w-sm sm:max-w-md overflow-hidden rounded-[32px] border border-border/50 bg-card/95 p-7 shadow-2xl backdrop-blur-2xl"
            initial={{ scale: 0.9, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 16 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.12 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Background Glow */}
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-all hover:bg-muted hover:text-foreground hover:scale-105 active:scale-95"
              aria-label="Close login dialog"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="mb-5 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-foreground font-serif">
                Welcome back to Stud<span className="text-primary italic">Ed</span>
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Sign in to continue your learning journey
              </p>
            </div>

            {/* Form */}
            <LoginForm onSuccess={onClose} />

            {/* Footer link */}
            <p className="mt-5 text-center text-xs text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/register"
                onClick={onClose}
                className="font-semibold text-primary hover:underline"
              >
                Create one
              </Link>
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
