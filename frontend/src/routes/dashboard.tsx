import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Flame, Sparkles, Trophy, Zap } from "lucide-react";
import { useQuery } from "urql";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { BadgeGrid } from "@/components/gamification/Badge";
import { LeaderboardTable } from "@/components/gamification/LeaderboardTable";
import { XPBar } from "@/components/gamification/XPBar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { LEADERBOARD_QUERY, MY_ENROLLMENTS_QUERY } from "@/graphql/courses";
import {
  BADGE_DEFS,
  type BadgeEarned,
  type BadgeInputs,
  computeBadges,
  earnedCount,
  levelFromXp,
} from "@/lib/gamification";
import { useAuthStore } from "@/stores/auth";

interface WaveProgress {
  status: string;
  attemptsCount: number;
  highestScore?: number | null;
}

interface EnrollmentWave {
  id: string;
  myProgress?: WaveProgress | null;
}

interface EnrollmentLesson {
  id: string;
  title: string;
  sequenceOrder: number;
  isPublished: boolean;
  waves: EnrollmentWave[];
}

interface CourseEnrollment {
  id: string;
  title: string;
  description: string;
  slug: string;
  gradeLevel: string;
  myProgress?: { completedWaves: number; totalWaves: number } | null;
  lessons?: EnrollmentLesson[] | null;
}

interface LeaderboardEntry {
  rank: number;
  user: { id: string; fullName: string };
  totalXp: number;
}

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function computeBadgeInputsFromEnrollments(
  enrollments: CourseEnrollment[],
  totalXp: number,
): BadgeInputs {
  let completedWaves = 0;
  let hasPerfectScore = false;
  let completedLessons = 0;
  let proficientLessons = 0;
  let completedCourses = 0;

  for (const course of enrollments) {
    const lessons = course.lessons ?? [];
    if (lessons.length === 0) continue;
    let courseAllCompleted = true;

    for (const lesson of lessons) {
      const waves = lesson.waves ?? [];
      if (waves.length === 0) continue;
      const allCompleted = waves.every((w) => w.myProgress?.status === "COMPLETED");

      if (allCompleted) {
        completedLessons++;
        const scores = waves
          .map((w) => w.myProgress?.highestScore)
          .filter((s): s is number => typeof s === "number" && s >= 0);
        if (scores.length > 0) {
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          if (avg >= 80) proficientLessons++;
        }
      } else {
        courseAllCompleted = false;
      }

      for (const w of waves) {
        if (w.myProgress?.status === "COMPLETED") completedWaves++;
        if (w.myProgress?.highestScore === 100) hasPerfectScore = true;
      }
    }

    if (courseAllCompleted && lessons.length > 0) completedCourses++;
  }

  return {
    totalXp,
    completedWaves,
    hasPerfectScore,
    completedLessons,
    proficientLessons,
    completedCourses,
  };
}

function DashboardPage() {
  const { user } = useAuthStore();
  const [{ data: enrollmentsData, fetching: enrollmentsFetching, error: enrollmentsError }] =
    useQuery({ query: MY_ENROLLMENTS_QUERY });
  const [{ data: leaderboardData, fetching: leaderboardFetching }] = useQuery({
    query: LEADERBOARD_QUERY,
    variables: { scope: "GLOBAL" },
  });

  const enrollments: CourseEnrollment[] = enrollmentsData?.myEnrollments ?? [];
  const leaderboard: LeaderboardEntry[] = leaderboardData?.leaderboard ?? [];

  const totalXp = user?.totalXp ?? 0;
  const { level } = levelFromXp(totalXp);

  const badgeInputs = computeBadgeInputsFromEnrollments(enrollments, totalXp);
  const badges: BadgeEarned[] = computeBadges(badgeInputs);
  const badgesEarned = earnedCount(badges);

  const completedWaves = badgeInputs.completedWaves;
  const completedCourses = badgeInputs.completedCourses;

  const myRankEntry = leaderboard.find((e) => e.user.id === user?.id);
  const continueCourse = enrollments.find(
    (c) =>
      (c.myProgress?.completedWaves ?? 0) > 0 &&
      (c.myProgress?.completedWaves ?? 0) < (c.myProgress?.totalWaves ?? 1),
  );
  const firstCourse = enrollments[0];
  const resumeCourse = continueCourse ?? firstCourse;
  const resumePct =
    resumeCourse && (resumeCourse.myProgress?.totalWaves ?? 0) > 0
      ? Math.round(
          ((resumeCourse.myProgress?.completedWaves ?? 0) /
            (resumeCourse.myProgress?.totalWaves ?? 1)) *
            100,
        )
      : 0;

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        {/* Hero header */}
        <div className="flex flex-col gap-4 rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {user?.fullName?.split(" ")[0] ?? "Learner"}!
            </h1>
            <p className="text-muted-foreground">
              You're on Level {level} with{" "}
              <span className="font-semibold text-foreground">{totalXp.toLocaleString()} XP</span>
              {" — "}keep the momentum going.
            </p>
          </div>
          <div className="w-full max-w-xs">
            <XPBar totalXp={totalXp} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column (2/3) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Continue Learning */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Flame className="h-5 w-5 text-orange" />
                  Continue Learning
                </CardTitle>
                <CardDescription>Pick up where you left off.</CardDescription>
              </CardHeader>
              <CardContent>
                {enrollmentsFetching ? (
                  <Skeleton className="h-24 w-full" />
                ) : resumeCourse ? (
                  <Link
                    to="/courses/$courseId"
                    params={{ courseId: resumeCourse.id }}
                    className="group flex items-center gap-4 rounded-xl border p-4 transition-all hover:border-primary/40 hover:shadow-md"
                  >
                    <ProgressRing value={resumePct} size={64} className="text-primary">
                      <span className="text-sm font-bold">{resumePct}%</span>
                    </ProgressRing>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold group-hover:text-primary">
                        {resumeCourse.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {resumeCourse.myProgress?.completedWaves ?? 0} of{" "}
                        {resumeCourse.myProgress?.totalWaves ?? 0} waves completed
                      </p>
                    </div>
                    <Button size="sm" className="shrink-0">
                      Resume
                    </Button>
                  </Link>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">You haven't started a course yet.</p>
                    <Link to="/courses">
                      <Button>Browse courses</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* My Courses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BookOpen className="h-5 w-5" />
                  My Courses
                </CardTitle>
                <CardDescription>
                  {enrollments.length} enrolled
                  {completedWaves > 0 && ` · ${completedWaves} waves completed`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {enrollmentsFetching ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                  </div>
                ) : enrollmentsError ? (
                  <p className="text-destructive">Failed to load enrollments.</p>
                ) : enrollments.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <p className="text-muted-foreground">
                      You are not enrolled in any courses yet.
                    </p>
                    <Link to="/courses">
                      <Button variant="outline">Browse courses</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {enrollments.map((course) => {
                      const completed = course.myProgress?.completedWaves ?? 0;
                      const total = course.myProgress?.totalWaves ?? 0;
                      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                      const done = total > 0 && completed === total;
                      return (
                        <Link
                          key={course.id}
                          to="/courses/$courseId"
                          params={{ courseId: course.id }}
                          className="group flex items-center gap-4 rounded-xl border p-4 transition-all hover:border-primary/40 hover:shadow-md"
                        >
                          <ProgressRing
                            value={percent}
                            size={56}
                            strokeWidth={5}
                            className={done ? "text-success" : "text-primary"}
                          >
                            <span className="text-xs font-bold">{percent}%</span>
                          </ProgressRing>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium group-hover:text-primary">
                              {course.title}
                            </p>
                            <p className="text-xs text-muted-foreground">{course.gradeLevel}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {completed}/{total} waves
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Leaderboard snapshot */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Trophy className="h-5 w-5 text-gold" />
                  Global Leaderboard
                </CardTitle>
                <CardDescription>
                  {myRankEntry
                    ? `You're ranked #${myRankEntry.rank} — ${myRankEntry.totalXp.toLocaleString()} XP`
                    : "Climb the ranks by completing waves!"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboardFetching ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <LeaderboardTable entries={leaderboard} currentUserId={user?.id} limit={5} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column (1/3) — Stats + Badges */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Zap className="h-5 w-5 text-primary" />
                  Your Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatRow
                  label="Total XP"
                  value={totalXp.toLocaleString()}
                  icon={<Zap className="h-4 w-4 text-primary" />}
                />
                <StatRow
                  label="Level"
                  value={String(level)}
                  icon={<Sparkles className="h-4 w-4 text-purple" />}
                />
                <StatRow
                  label="Waves Completed"
                  value={String(completedWaves)}
                  icon={<BookOpen className="h-4 w-4 text-success" />}
                />
                <StatRow
                  label="Courses Done"
                  value={String(completedCourses)}
                  icon={<Trophy className="h-4 w-4 text-gold" />}
                />
                <StatRow
                  label="Badges Earned"
                  value={`${badgesEarned}/${BADGE_DEFS.length}`}
                  icon={<Flame className="h-4 w-4 text-orange" />}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Achievements</CardTitle>
                <CardDescription>
                  {badgesEarned} of {BADGE_DEFS.length} unlocked
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BadgeGrid badges={badges} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function StatRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  );
}
