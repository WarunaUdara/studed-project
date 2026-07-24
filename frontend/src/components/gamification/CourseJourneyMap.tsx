import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Compass,
  Lock,
  Play,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { StreakFlame } from "@/components/gamification/StreakFlame";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { playClickSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export interface JourneyWave {
  id: string;
  title: string;
  sequenceOrder: number;
  xpReward: number;
  difficulty: string;
  lessonId: string;
  lessonTitle: string;
  lessonOrder: number;
  state: "completed" | "current" | "locked";
  attemptsCount?: number;
  highestScore?: number | null;
}

export interface JourneyLesson {
  id: string;
  title: string;
  sequenceOrder: number;
  waves: {
    id: string;
    title: string;
    sequenceOrder: number;
    xpReward: number;
    difficulty: string;
    myProgress?: {
      status: string;
      attemptsCount?: number;
      highestScore?: number | null;
    } | null;
  }[];
}

interface CourseJourneyMapProps {
  courseId?: string;
  courseTitle: string;
  gradeLevel: string;
  lessons: JourneyLesson[];
  isEnrolled: boolean;
  onEnroll?: () => void;
  isEnrolling?: boolean;
}

interface Point {
  x: number;
  y: number;
}

const VIEW_W = 480;

export function CourseJourneyMap({
  courseTitle,
  gradeLevel,
  lessons,
  isEnrolled,
  onEnroll,
  isEnrolling,
}: CourseJourneyMapProps) {
  const reduce = useReducedMotion();
  const gradientId = useId();
  const pathRef = useRef<SVGPathElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [selectedWaveId, setSelectedWaveId] = useState<string | null>(null);

  // Flatten lessons & waves into a single sequential journey list
  const { waves: flattenedWaves, completedCount, totalCount, currentWaveId } = useMemo(() => {
    const list: JourneyWave[] = [];
    let completed = 0;
    let currentFound = false;
    let firstUncompletedId: string | null = null;

    lessons.forEach((l, lIdx) => {
      l.waves.forEach((w) => {
        const isDone = w.myProgress?.status === "COMPLETED";
        let state: "completed" | "current" | "locked" = "locked";

        if (isDone) {
          state = "completed";
          completed++;
        } else if (!currentFound && isEnrolled) {
          state = "current";
          currentFound = true;
          firstUncompletedId = w.id;
        } else {
          state = "locked";
        }

        list.push({
          id: w.id,
          title: w.title,
          sequenceOrder: w.sequenceOrder,
          xpReward: w.xpReward,
          difficulty: w.difficulty,
          lessonId: l.id,
          lessonTitle: l.title,
          lessonOrder: l.sequenceOrder || lIdx + 1,
          state,
          attemptsCount: w.myProgress?.attemptsCount ?? 0,
          highestScore: w.myProgress?.highestScore ?? null,
        });
      });
    });

    // If enrolled but no current found (e.g. all done or none done), set default
    if (isEnrolled && !currentFound && list.length > 0) {
      if (completed === list.length) {
        list[list.length - 1].state = "current";
        firstUncompletedId = list[list.length - 1].id;
      } else {
        list[0].state = "current";
        firstUncompletedId = list[0].id;
      }
    }

    return {
      waves: list,
      completedCount: completed,
      totalCount: list.length,
      currentWaveId: firstUncompletedId,
    };
  }, [lessons, isEnrolled]);

  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Calculate dynamic SVG viewBox height based on total waves (min 400px, 80px per node)
  const nodeSpacing = 85;
  const viewH = Math.max(450, flattenedWaves.length * nodeSpacing + 100);

  // Generate smooth S-Curve SVG path string dynamically based on wave count
  const pathD = useMemo(() => {
    if (flattenedWaves.length === 0) return `M 240 50 L 240 ${viewH - 50}`;

    let d = `M 240 40`;
    const startY = 40;
    const endY = viewH - 50;
    const totalStep = (endY - startY) / Math.max(1, flattenedWaves.length - 1);

    flattenedWaves.forEach((_, i) => {
      if (i === 0) return;
      const prevY = startY + (i - 1) * totalStep;
      const currY = startY + i * totalStep;
      const midY = (prevY + currY) / 2;

      // Oscillate X between left curve (120), center (240), and right curve (360)
      const prevX = i % 2 === 1 ? (i % 4 === 1 ? 350 : 130) : 240;
      const currX = (i + 1) % 2 === 1 ? ((i + 1) % 4 === 1 ? 350 : 130) : 240;

      d += ` C ${prevX} ${midY}, ${currX} ${midY}, ${currX} ${currY}`;
    });

    return d;
  }, [flattenedWaves, viewH]);

  // Compute node coordinates along path
  useEffect(() => {
    const path = pathRef.current;
    if (!path || flattenedWaves.length === 0) return;
    const len = path.getTotalLength();
    const count = flattenedWaves.length;

    const pts: Point[] = [];
    for (let i = 0; i < count; i++) {
      const fraction = count === 1 ? 0.5 : i / (count - 1);
      pts.push(path.getPointAtLength(len * fraction));
    }
    setPoints(pts);
  }, [flattenedWaves, pathD]);

  // Completed fraction along the trail
  const completedFraction = useMemo(() => {
    if (flattenedWaves.length === 0) return 0;
    const currentIdx = flattenedWaves.findIndex((w) => w.state === "current");
    if (currentIdx === -1) return completedCount === totalCount ? 1 : 0;
    return currentIdx / Math.max(1, flattenedWaves.length - 1);
  }, [flattenedWaves, completedCount, totalCount]);

  const currentPoint = useMemo(() => {
    const currentIdx = flattenedWaves.findIndex((w) => w.state === "current");
    if (currentIdx !== -1 && points[currentIdx]) return points[currentIdx];
    return points[0] || null;
  }, [flattenedWaves, points]);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-xl backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary border border-primary/20">
                {gradeLevel}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Gamified Course Journey
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              {courseTitle}
            </h1>
            <p className="text-xs text-muted-foreground max-w-xl">
              Traverse the interactive wave map. Complete 5-minute atomic waves to earn XP and climb the national leaderboard.
            </p>
          </div>

          <div className="flex items-center gap-6 shrink-0 justify-between md:justify-end">
            <ProgressRing
              value={progressPct}
              size={80}
              strokeWidth={7}
              className="text-primary"
            >
              <div className="text-center">
                <span className="text-base font-black">{progressPct}%</span>
                <span className="block text-[9px] uppercase font-bold text-muted-foreground">
                  Mastery
                </span>
              </div>
            </ProgressRing>

            {!isEnrolled ? (
              <Button
                onClick={onEnroll}
                disabled={isEnrolling}
                size="lg"
                className="rounded-full px-6 font-bold shadow-lg gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {isEnrolling ? "Enrolling..." : "Enroll to Unlock Path"}
              </Button>
            ) : currentWaveId ? (
              <Link to="/waves/$waveId" params={{ waveId: currentWaveId }}>
                <Button size="lg" className="rounded-full px-7 font-bold shadow-lg gap-2">
                  <Play className="h-4 w-4 fill-current" /> Continue Journey
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Interactive Map Container */}
      <Card className="relative overflow-hidden rounded-3xl border bg-card/90 shadow-2xl backdrop-blur">
        {/* Map Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary animate-spin-slow" />
            <span className="text-xs font-extrabold uppercase tracking-widest text-foreground">
              Learning Path · {completedCount} of {totalCount} Waves Cleared
            </span>
          </div>
          <div className="flex items-center gap-3">
            <StreakFlame dayCount={7} size="sm" />
            <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-3 py-1 text-xs font-bold text-gold border border-gold/30">
              <Zap className="h-3.5 w-3.5 fill-gold text-gold" />
              +{flattenedWaves.reduce((acc, w) => acc + (w.state === "completed" ? w.xpReward : 0), 0)} XP
            </span>
          </div>
        </div>

        {/* Map Area */}
        <div className="relative py-8 px-4 flex justify-center">
          <div className="relative w-full max-w-[500px]">
            <svg
              viewBox={`0 0 ${VIEW_W} ${viewH}`}
              className="block h-auto w-full select-none"
              role="img"
              aria-label="Course Journey Map"
            >
              <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--success)" />
                  <stop offset="50%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--purple)" />
                </linearGradient>
              </defs>

              {/* Background Dotted Game Trail */}
              <path
                ref={pathRef}
                d={pathD}
                fill="none"
                stroke="var(--border)"
                strokeWidth={5}
                strokeLinecap="round"
                strokeDasharray="1 14"
              />

              {/* Completed Trail Fill */}
              <motion.path
                d={pathD}
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth={6}
                strokeLinecap="round"
                initial={{ pathLength: reduce ? completedFraction : 0 }}
                animate={{ pathLength: completedFraction }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />

              {/* Travelling Glow Orb */}
              {!reduce && (
                <>
                  <circle r={12} fill="var(--primary)" opacity={0.25}>
                    <animateMotion dur="8s" repeatCount="indefinite" path={pathD} />
                  </circle>
                  <circle r={5} fill="var(--primary)">
                    <animateMotion dur="8s" repeatCount="indefinite" path={pathD} />
                  </circle>
                </>
              )}
            </svg>

            {/* Render Node Buttons along Path */}
            <div className="absolute inset-0">
              {points.map((p, idx) => {
                const wave = flattenedWaves[idx];
                if (!wave) return null;

                const left = `${(p.x / VIEW_W) * 100}%`;
                const top = `${(p.y / viewH) * 100}%`;
                const isSelected = selectedWaveId === wave.id;
                const isCurrent = wave.state === "current";
                const isCompleted = wave.state === "completed";
                const isLocked = wave.state === "locked";

                // Check if this wave starts a new lesson header
                const showLessonHeader =
                  idx === 0 || flattenedWaves[idx - 1].lessonId !== wave.lessonId;

                return (
                  <div
                    key={wave.id}
                    className="absolute"
                    style={{ left, top, transform: "translate(-50%, -50%)" }}
                  >
                    {/* Lesson Section Badge Header */}
                    {showLessonHeader && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-card/95 border px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-primary shadow-md backdrop-blur">
                          <Trophy className="h-3 w-3 text-gold" />
                          Lesson {wave.lessonOrder}: {wave.lessonTitle}
                        </span>
                      </div>
                    )}

                    {/* Node Interactive Button */}
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", damping: 18, stiffness: 260 }}
                      onClick={() => {
                        playClickSound();
                        setSelectedWaveId(isSelected ? null : wave.id);
                      }}
                      className={cn(
                        "relative flex items-center justify-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4",
                        isCompleted &&
                          "h-11 w-11 bg-success text-success-foreground shadow-lg shadow-success/30 ring-2 ring-success/50",
                        isCurrent &&
                          "h-14 w-14 bg-primary text-primary-foreground shadow-2xl shadow-primary/50 ring-4 ring-primary/30",
                        isLocked &&
                          "h-10 w-10 bg-muted/80 text-muted-foreground ring-1 ring-border opacity-70 hover:opacity-100",
                      )}
                    >
                      {isCompleted && <Check className="h-5 w-5 stroke-[3]" />}
                      {isCurrent && <Play className="h-6 w-6 fill-current ml-0.5" />}
                      {isLocked && <Lock className="h-4 w-4" />}

                      {/* Active Beacon Pulse Ring for Current Node */}
                      {isCurrent && !reduce && (
                        <motion.span
                          className="absolute inset-0 rounded-full border-2 border-primary"
                          animate={{ scale: [1, 1.8], opacity: [0.8, 0] }}
                          transition={{
                            duration: 2,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeOut",
                          }}
                        />
                      )}
                    </motion.button>

                    {/* Node Label Title Below */}
                    <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
                      <span
                        className={cn(
                          "text-[11px] font-bold block max-w-[120px] truncate drop-shadow-sm",
                          isCurrent && "text-primary font-black scale-105",
                          isCompleted && "text-foreground",
                          isLocked && "text-muted-foreground",
                        )}
                      >
                        {wave.title}
                      </span>
                    </div>

                    {/* Interactive Tooltip Card on Click / Selection */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 10 }}
                          className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 z-50 w-64 rounded-2xl border bg-card/95 p-4 shadow-2xl backdrop-blur text-left"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                                Wave {wave.sequenceOrder}
                              </span>
                              <span
                                className={cn(
                                  "text-[10px] font-extrabold uppercase tracking-wider",
                                  isCompleted && "text-success",
                                  isCurrent && "text-primary",
                                  isLocked && "text-muted-foreground",
                                )}
                              >
                                {isCompleted ? "Completed" : isCurrent ? "Active Wave" : "Locked"}
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-foreground leading-snug">
                              {wave.title}
                            </h4>

                            <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-b py-2">
                              <span className="flex items-center gap-1 font-semibold text-gold">
                                <Zap className="h-3.5 w-3.5 fill-gold" /> +{wave.xpReward} XP
                              </span>
                              <span className="capitalize font-medium">{wave.difficulty}</span>
                              {wave.highestScore !== null && (
                                <span className="font-bold text-success">
                                  {wave.highestScore}% Best
                                </span>
                              )}
                            </div>

                            {isLocked ? (
                              <p className="text-[11px] text-muted-foreground italic">
                                {!isEnrolled
                                  ? "Enroll in this course to unlock this wave."
                                  : "Complete previous waves to unlock this milestone."}
                              </p>
                            ) : (
                              <Link
                                to="/waves/$waveId"
                                params={{ waveId: wave.id }}
                                className="block pt-1"
                              >
                                <Button size="sm" className="w-full font-bold gap-1.5">
                                  {isCompleted ? "Review Wave" : "Launch Wave"}{" "}
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {/* Drifting XP Particles from Current Node */}
              {currentPoint &&
                !reduce &&
                [0, 1, 2].map((i) => (
                  <motion.span
                    key={`xp-particle-${i}`}
                    className="pointer-events-none absolute z-30 inline-flex items-center gap-0.5 rounded-full bg-gold/90 px-2 py-0.5 text-[10px] font-black text-white shadow-lg"
                    style={{
                      left: `${(currentPoint.x / VIEW_W) * 100}%`,
                      top: `${(currentPoint.y / viewH) * 100}%`,
                    }}
                    animate={{ y: [-10, -60], x: [0, i === 1 ? 16 : -14], opacity: [0, 1, 0] }}
                    transition={{
                      duration: 2.8,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: i * 0.9,
                      ease: "easeOut",
                    }}
                  >
                    +50 XP
                  </motion.span>
                ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
