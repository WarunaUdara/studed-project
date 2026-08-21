import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "urql";
import { Skeleton } from "@/components/ui/Skeleton";
import { MY_ENROLLMENTS_QUERY } from "@/graphql/courses";
import { cn } from "@/lib/utils";

interface WaveNode {
  id: string;
  myProgress?: { status: string; highestScore?: number | null } | null;
}

interface LessonNode {
  id: string;
  title: string;
  sequenceOrder: number;
  isPublished: boolean;
  waves: WaveNode[];
}

interface EnrolledCourse {
  id: string;
  title: string;
  slug: string;
  gradeLevel: string;
  myProgress?: { completedWaves: number; totalWaves: number } | null;
  lessons?: LessonNode[] | null;
}

export interface CourseResumePoint {
  course: EnrolledCourse;
  completedWaves: number;
  totalWaves: number;
  percent: number;
  /** The first wave that is not yet completed, or null when the course is done. */
  nextWaveId: string | null;
}

/**
 * Where each enrolled course stands, and which wave to open next.
 *
 * Ordered by how far along the student is: a course that is underway comes
 * before one that has never been opened, and a finished course sinks to the
 * bottom. Finishing what you started is the useful default.
 */
export function resumePoints(courses: EnrolledCourse[]): CourseResumePoint[] {
  const points = courses.map((course) => {
    const lessons = (course.lessons ?? []).filter((l) => l.isPublished);
    const waves = [...lessons]
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
      .flatMap((l) => l.waves ?? []);

    const completedWaves =
      course.myProgress?.completedWaves ??
      waves.filter((w) => w.myProgress?.status === "COMPLETED").length;
    const totalWaves = course.myProgress?.totalWaves ?? waves.length;

    const nextWave = waves.find((w) => w.myProgress?.status !== "COMPLETED");

    return {
      course,
      completedWaves,
      totalWaves,
      percent: totalWaves > 0 ? Math.round((completedWaves / totalWaves) * 100) : 0,
      nextWaveId: nextWave?.id ?? null,
    };
  });

  return points.sort((a, b) => {
    const aDone = a.totalWaves > 0 && a.completedWaves >= a.totalWaves;
    const bDone = b.totalWaves > 0 && b.completedWaves >= b.totalWaves;
    if (aDone !== bDone) return aDone ? 1 : -1;

    const aStarted = a.completedWaves > 0;
    const bStarted = b.completedWaves > 0;
    if (aStarted !== bStarted) return aStarted ? -1 : 1;

    return b.percent - a.percent;
  });
}

/**
 * The dashboard's progress surface. The student dashboard previously carried no
 * course progress at all — no enrolled courses, no resume point, nothing that
 * said how far through anything the student was.
 */
export function DashboardContinueLearning() {
  const [{ data, fetching, error }] = useQuery<{ myEnrollments?: EnrolledCourse[] }>({
    query: MY_ENROLLMENTS_QUERY,
  });

  const points = useMemo(() => resumePoints(data?.myEnrollments ?? []), [data]);

  if (fetching) {
    return (
      <div className="space-y-3 rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
        <Skeleton className="h-4 w-32" />
        {[1, 2].map((n) => (
          <Skeleton key={n} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error || points.length === 0) {
    return (
      <div className="rounded-3xl border border-border/60 bg-card p-5 text-center shadow-sm">
        <BookOpen className="mx-auto size-6 text-muted-foreground/60" />
        <h4 className="mt-2 text-sm font-bold text-foreground">Nothing on the go</h4>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {error
            ? "We could not load your courses just now."
            : "Enrol in a course to start earning XP."}
        </p>
        <Link
          to="/courses"
          className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
        >
          Browse courses <ArrowRight className="size-3" />
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="font-extrabold text-xs uppercase tracking-wider text-foreground">
          Continue learning
        </h4>
        <Link to="/courses" className="text-[11px] font-bold text-primary hover:underline">
          All courses
        </Link>
      </div>

      <ul className="mt-4 space-y-2 border-t border-border/40 pt-3">
        {points.slice(0, 3).map((point) => {
          const done = point.totalWaves > 0 && point.completedWaves >= point.totalWaves;
          return (
            <li key={point.course.id}>
              <Link
                to="/courses/$courseId"
                params={{ courseId: point.course.slug || point.course.id }}
                data-testid={`continue-${point.course.id}`}
                className="block rounded-2xl px-3 py-2.5 transition-colors hover:bg-muted/60"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                    {point.course.title}
                  </span>
                  <span className="shrink-0 text-[11px] font-bold tabular-nums text-muted-foreground">
                    {point.completedWaves}/{point.totalWaves}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      done ? "bg-success" : "bg-primary",
                    )}
                    style={{ width: `${point.percent}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {done
                    ? "Course complete"
                    : point.completedWaves === 0
                      ? "Not started yet"
                      : `${point.percent}% through`}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
