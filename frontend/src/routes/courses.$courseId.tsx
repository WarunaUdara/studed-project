import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, CheckCircle, Clock, Lock, PlayCircle, Zap } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "urql";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { COURSE_PLAYER_QUERY } from "@/graphql/student";
import { sanitizeGraphQLError } from "@/lib/errors";
import { cn } from "@/lib/utils";

interface Wave {
  id: string;
  title: string;
  sequenceOrder: number;
  xpReward: number;
  difficulty: string;
  isPublished: boolean;
  myProgress?: {
    status: string;
    attemptsCount: number;
    highestScore?: number | null;
  } | null;
}

interface Lesson {
  id: string;
  title: string;
  sequenceOrder: number;
  isPublished: boolean;
  waves: Wave[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  gradeLevel: string;
  isPublished: boolean;
  myProgress?: { completedWaves: number; totalWaves: number } | null;
  lessons: Lesson[];
}

export const Route = createFileRoute("/courses/$courseId")({
  component: CoursePlayerPage,
});

function CoursePlayerPage() {
  const { courseId } = Route.useParams();
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: COURSE_PLAYER_QUERY,
    variables: { id: courseId },
  });

  const course: Course | undefined = data?.course;

  const completedWaves = course?.myProgress?.completedWaves ?? 0;
  const totalWaves = course?.myProgress?.totalWaves ?? 0;
  const progress = totalWaves > 0 ? Math.round((completedWaves / totalWaves) * 100) : 0;

  const lessons = useMemo(() => course?.lessons ?? [], [course]);

  if (fetching) {
    return (
      <main className="mx-auto max-w-6xl space-y-4 p-4 pt-6 sm:p-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  if (error || !course) {
    const e = sanitizeGraphQLError(error);
    return (
      <main className="mx-auto max-w-6xl p-6">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed p-12 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">{e.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{e.message}</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => reexecuteQuery({ requestPolicy: "network-only" })}
            >
              Try again
            </Button>
            <Link to="/courses">
              <Button>Back to courses</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 pt-6 sm:p-6 sm:pt-8">
      <Link to="/courses">
        <Button variant="ghost" size="sm" className="mb-6 gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Courses
        </Button>
      </Link>

      {/* Course header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-6"
      >
        <div className="flex flex-wrap items-start gap-6">
          <ProgressRing
            value={progress}
            size={88}
            strokeWidth={7}
            className="shrink-0 text-primary"
          >
            <div className="text-center">
              <span className="text-lg font-bold">{progress}%</span>
              <span className="block text-[10px] text-muted-foreground">complete</span>
            </div>
          </ProgressRing>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                {course.gradeLevel}
              </span>
              <span className="text-xs text-muted-foreground">
                {course.isPublished ? "Published" : "Draft"}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{course.title}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">{course.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-success" /> {completedWaves} completed
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4 text-primary" /> {totalWaves} total waves
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Lessons */}
      <div className="space-y-6">
        {lessons.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No lessons in this course yet.</p>
          </div>
        )}
        {lessons.map((lesson, lessonIdx) => (
          <motion.div
            key={lesson.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: lessonIdx * 0.05 }}
          >
            <Card className="overflow-hidden">
              <div className="flex items-center gap-3 border-b bg-muted/30 px-6 py-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                  {lesson.sequenceOrder || lessonIdx + 1}
                </span>
                <h2 className="text-lg font-semibold">{lesson.title}</h2>
              </div>
              <CardContent className="space-y-2 p-4">
                {lesson.waves.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-muted-foreground">
                    No waves in this lesson yet.
                  </p>
                ) : (
                  lesson.waves.map((wave) => {
                    const isCompleted = wave.myProgress?.status === "COMPLETED";
                    const isStarted = wave.myProgress?.status === "STARTED";
                    const isLocked = wave.myProgress?.status === "LOCKED";

                    const content = (
                      <div className={cn(
                        "flex items-center justify-between rounded-xl border p-4 transition-all",
                        isLocked
                          ? "bg-muted/10 opacity-60 border-border"
                          : "group hover:border-primary/30 hover:bg-primary/5 cursor-pointer"
                      )}>
                        <div className="flex items-center gap-3">
                          {isLocked ? (
                            <Lock className="h-5 w-5 shrink-0 text-muted-foreground" />
                          ) : isCompleted ? (
                            <CheckCircle className="h-5 w-5 shrink-0 text-success" />
                          ) : isStarted ? (
                            <Clock className="h-5 w-5 shrink-0 text-orange" />
                          ) : (
                            <PlayCircle className="h-5 w-5 shrink-0 text-primary" />
                          )}
                          <div>
                            <p className={cn("font-medium", !isLocked && "group-hover:text-primary")}>
                              {wave.title}
                            </p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>{wave.difficulty}</span>
                              <span className="flex items-center gap-0.5">
                                <Zap className="h-3 w-3 text-gold" /> {wave.xpReward} XP
                              </span>
                              {wave.myProgress?.highestScore !== null &&
                                wave.myProgress?.highestScore !== undefined && (
                                  <span>Best: {wave.myProgress.highestScore}%</span>
                                )}
                            </div>
                          </div>
                        </div>
                        {isLocked ? (
                          <span className="text-sm font-medium text-muted-foreground">Locked</span>
                        ) : isCompleted ? (
                          <span className="text-sm font-medium text-success">Completed</span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="group-hover:bg-primary group-hover:text-primary-foreground"
                          >
                            Start
                          </Button>
                        )}
                      </div>
                    );

                    if (isLocked) {
                      return <div key={wave.id}>{content}</div>;
                    }

                    return (
                      <Link key={wave.id} to="/waves/$waveId" params={{ waveId: wave.id }}>
                        {content}
                      </Link>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
