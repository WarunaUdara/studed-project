import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, Clock, Lock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/Card";

export interface TrackWave {
  id: string;
  title: string;
  sequenceOrder: number;
  xpReward: number;
  state: "completed" | "current" | "key_gated" | "locked";
  difficulty?: string;
}

export interface TrackLesson {
  id: string;
  title: string;
  levelNumber: number;
  waves: TrackWave[];
}

export interface StudEdCourseTrackMapProps {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  totalLessons?: number;
  totalWaves?: number;
  lessons: TrackLesson[];
  activeLessonId?: string;
  keysAvailable?: number;
  className?: string;
}

export function StudEdCourseTrackMap({
  courseTitle = "Scientific Thinking",
  courseDescription = "Open your eyes to the world around you by solving puzzles with science.",
  totalLessons = 40,
  totalWaves = 487,
  lessons,
  activeLessonId,
  keysAvailable = 0,
  className = "",
}: StudEdCourseTrackMapProps) {
  const [selectedWave, setSelectedWave] = useState<TrackWave | null>(null);

  // Active lesson
  const currentLesson =
    lessons.find((l) => l.id === activeLessonId) || lessons[0] || {
      id: "lesson-1",
      title: "Gears",
      levelNumber: 1,
      waves: [
        { id: "w1", title: "Connecting Gears", sequenceOrder: 1, xpReward: 30, state: "completed" },
        { id: "w2", title: "Gears Changing Speeds", sequenceOrder: 2, xpReward: 30, state: "key_gated" },
        { id: "w3", title: "Compound Gears", sequenceOrder: 3, xpReward: 30, state: "locked" },
        { id: "w4", title: "Gear Trains & Ratios", sequenceOrder: 4, xpReward: 50, state: "locked" },
      ],
    };

  const activeWave =
    selectedWave ||
    currentLesson.waves.find((w) => w.state === "current" || w.state === "key_gated") ||
    currentLesson.waves[0];

  return (
    <div className={`mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 lg:grid-cols-12 ${className}`.trim()}>
      {/* Left Column: Course Overview Card */}
      <div className="lg:col-span-5 space-y-4">
        <Card className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl">
          <CardContent className="p-0 space-y-6">
            {/* 3D Course Icon / Lightbulb & Gears */}
            <div className="relative flex size-20 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-400/30 p-3 shadow-inner">
              <span className="text-4xl">💡⚙️</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight">
                {courseTitle}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {courseDescription}
              </p>
            </div>

            {/* Course Metrics with StudEd terminology: Lessons & Waves */}
            <div className="flex items-center gap-6 pt-2 border-t border-border/60 text-xs font-semibold text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="text-base">☕</span>
                <span>{totalLessons} Lessons</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">⚡</span>
                <span>{totalWaves} Waves</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Vertical Wave Pedestal Track */}
      <div className="lg:col-span-7 flex flex-col items-center space-y-8">
        {/* Level / Chapter Banner */}
        <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-card/80 p-3 text-center shadow-lg">
          <div className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
            LEVEL {currentLesson.levelNumber}
          </div>
          <div className="text-sm sm:text-base font-bold text-foreground">
            {currentLesson.title}
          </div>
        </div>

        {/* Wave Pedestal Sequence */}
        <div className="flex flex-col items-center space-y-12 w-full py-4">
          {currentLesson.waves.map((wave) => {
            const isCompleted = wave.state === "completed";
            const isCurrent = wave.state === "current";
            const isKeyGated = wave.state === "key_gated";
            const isLocked = wave.state === "locked";
            const isSelected = activeWave?.id === wave.id;

            return (
              <div
                key={wave.id}
                className="relative flex items-center justify-center cursor-pointer group"
                onClick={() => setSelectedWave(wave)}
              >
                {/* Connecting Line to next wave */}
                <div className="relative flex flex-col items-center">
                  {/* Floating Blob Mascot or Lock on top of pedestal */}
                  <div className="relative -mb-4 z-20 flex items-center justify-center">
                    {/* Active Wave: Floating Green Blob Mascot */}
                    {isCurrent && (
                      <motion.div
                        animate={{ y: [-4, 4, -4] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        className="flex size-14 items-center justify-center drop-shadow-[0_8px_20px_rgba(34,197,94,0.5)]"
                      >
                        <svg viewBox="0 0 100 100" className="size-full">
                          <rect x="18" y="18" width="64" height="64" rx="28" fill="#22c55e" />
                          <ellipse cx="50" cy="74" rx="22" ry="6" fill="#15803d" opacity="0.3" />
                          <rect x="36" y="36" width="28" height="28" rx="8" fill="#0f172a" />
                          <rect x="42" y="42" width="16" height="16" rx="4" fill="#ffffff" />
                          <rect x="47" y="47" width="6" height="6" rx="1.5" fill="#22c55e" />
                        </svg>
                      </motion.div>
                    )}

                    {/* Key-Gated Wave: Floating Blob with Iridescent Lock */}
                    {isKeyGated && (
                      <motion.div
                        animate={{ y: [-3, 3, -3] }}
                        transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                        className="flex items-center gap-1 drop-shadow-xl"
                      >
                        <div className="size-12">
                          <svg viewBox="0 0 100 100" className="size-full">
                            <rect x="18" y="18" width="64" height="64" rx="28" fill="#22c55e" />
                            <ellipse cx="50" cy="74" rx="22" ry="6" fill="#15803d" opacity="0.3" />
                            <rect x="36" y="36" width="28" height="28" rx="8" fill="#0f172a" />
                            <rect x="42" y="42" width="16" height="16" rx="4" fill="#ffffff" />
                            <rect x="47" y="47" width="6" height="6" rx="1.5" fill="#22c55e" />
                          </svg>
                        </div>
                        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 border border-white/40 shadow-lg">
                          <Lock className="size-5 text-white stroke-[2.5]" />
                        </div>
                      </motion.div>
                    )}

                    {/* Future Locked: Small metallic padlock */}
                    {isLocked && (
                      <div className="flex size-8 items-center justify-center rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400">
                        <Lock className="size-4" />
                      </div>
                    )}
                  </div>

                  {/* 3D Pedestal Disc Base */}
                  <div className="relative flex flex-col items-center">
                    {/* Completed Pedestal: Golden Ring with Checkmark */}
                    {isCompleted && (
                      <div className="relative size-24 rounded-full border-4 border-amber-400 bg-amber-500/20 shadow-[0_0_25px_rgba(251,191,36,0.5)] flex items-center justify-center">
                        <div className="size-14 rounded-full border-2 border-amber-300/60 bg-amber-400/40 flex items-center justify-center text-amber-900 dark:text-amber-200">
                          <Check className="size-7 stroke-[3.5]" />
                        </div>
                      </div>
                    )}

                    {/* Current Pedestal: Glowing Radiant Green/Gold Ring */}
                    {isCurrent && (
                      <div className="relative size-24 rounded-full border-4 border-emerald-400 bg-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.6)] flex items-center justify-center">
                        <div className="size-14 rounded-full border-2 border-emerald-300/60 bg-white shadow-inner flex items-center justify-center">
                          <div className="size-6 rounded-full bg-emerald-400 shadow-md" />
                        </div>
                      </div>
                    )}

                    {/* Key-Gated Pedestal: Purple/Gold Glow Disc */}
                    {isKeyGated && (
                      <div className="relative size-24 rounded-full border-4 border-purple-400/80 bg-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.5)] flex items-center justify-center">
                        <div className="size-14 rounded-full border-2 border-purple-300/40 bg-purple-400/30" />
                      </div>
                    )}

                    {/* Locked Pedestal: Subtle Grey Disc */}
                    {isLocked && (
                      <div className="relative size-20 rounded-full border-2 border-neutral-700 bg-neutral-800/60 shadow-md flex items-center justify-center">
                        <div className="size-10 rounded-full border border-neutral-600 bg-neutral-700/40" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Wave Title Label (Right Side of Pedestal) */}
                <div className="absolute left-32 whitespace-nowrap">
                  <span
                    className={`text-xs sm:text-sm font-semibold transition-colors ${
                      isSelected
                        ? "text-foreground font-bold"
                        : isCompleted
                          ? "text-muted-foreground"
                          : isLocked
                            ? "text-neutral-500"
                            : "text-foreground"
                    }`}
                  >
                    {wave.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Active Wave Action Card / Sheet */}
        {activeWave && (
          <motion.div
            key={activeWave.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md rounded-3xl border border-border/80 bg-card p-6 shadow-2xl space-y-4"
          >
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-foreground">
                {activeWave.title}
              </h3>

              {activeWave.state === "key_gated" && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-amber-500 dark:text-amber-400 font-semibold">
                  <Clock className="size-3.5" />
                  <span>You're out of keys for today ({keysAvailable} 🗝️)</span>
                </div>
              )}

              {activeWave.state === "completed" && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-500 font-semibold">
                  <Check className="size-3.5 stroke-[3]" />
                  <span>Wave completed · +{activeWave.xpReward} XP</span>
                </div>
              )}
            </div>

            {/* Action CTA based on Wave State */}
            <div>
              {activeWave.state === "current" && (
                <Link to="/waves/$waveId" params={{ waveId: activeWave.id }} className="w-full">
                  <Button className="w-full rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm h-12 shadow-lg">
                    Start Wave
                  </Button>
                </Link>
              )}

              {activeWave.state === "key_gated" && (
                <div className="space-y-2">
                  <Button
                    onClick={() => window.location.assign("/dashboard")}
                    className="w-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-amber-400 hover:opacity-90 text-white font-bold text-sm h-12 shadow-lg"
                  >
                    Unlock all lessons now
                  </Button>
                </div>
              )}

              {activeWave.state === "completed" && (
                <Link to="/waves/$waveId" params={{ waveId: activeWave.id }} className="w-full">
                  <Button
                    variant="outline"
                    className="w-full rounded-full border-neutral-700 text-foreground font-bold text-sm h-12"
                  >
                    Practice Again
                  </Button>
                </Link>
              )}

              {activeWave.state === "locked" && (
                <Button
                  disabled
                  className="w-full rounded-full bg-neutral-800 text-neutral-500 font-bold text-sm h-12"
                >
                  Locked
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
