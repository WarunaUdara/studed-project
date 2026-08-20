import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Home } from "lucide-react";
import { HelmetCompanion } from "@/components/mascot/HelmetCompanion";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_notFound" as never)({
  component: NotFoundPage,
});

export function NotFoundPage() {
  const reduce = useReducedMotion();
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Helmet 404 Mascot */}
        <div className="relative flex flex-col items-center justify-center">
          <p className="text-[9rem] font-black leading-none text-muted/30 select-none">404</p>
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={reduce ? undefined : { y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
          >
            <HelmetCompanion size="lg" mood="hmm" gaze={{ x: 8, y: -6 }} />
          </motion.div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. Let's get you back on
            track.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/">
            <Button>
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <Link to="/courses">
            <Button variant="outline">
              <BookOpen className="mr-2 h-4 w-4" />
              Browse Courses
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
