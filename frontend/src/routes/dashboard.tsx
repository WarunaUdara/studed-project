import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  Globe,
  Sparkles,
  Trophy as TrophyIcon,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "urql";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PomodoroTimer } from "@/components/gamification/PomodoroTimer";
import { StreakFlame } from "@/components/gamification/StreakFlame";
import { XPBar } from "@/components/gamification/XPBar";
import { StudentShell } from "@/components/layout/StudentShell";
import { AchievementBadge, type UserAchievement } from "@/components/ui/achievement-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { PointsLevelsTimeline } from "@/components/ui/points-levels-timeline";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ACHIEVEMENTS_QUERY, LEADERBOARD_QUERY, MY_ENROLLMENTS_QUERY } from "@/graphql/courses";
import { sanitizeGraphQLError } from "@/lib/errors";
import { BADGE_DEFS, levelFromXp } from "@/lib/gamification";
import {
  buildLevelTimeline,
  type CourseEnrollment,
  computeBadgeInputsFromEnrollments,
  levelName,
} from "@/lib/gamificationUtils";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

interface LeaderboardEntry {
  rank: number;
  user: { id: string; fullName: string };
  totalXp: number;
}

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user, updateTotalXp } = useAuthStore();
  const { toast } = useToast();
  const [{ data: enrollmentsData, fetching: enrollmentsFetching, error: enrollmentsError }] =
    useQuery({ query: MY_ENROLLMENTS_QUERY });
  const [{ data: leaderboardData, fetching: leaderboardFetching }] = useQuery({
    query: LEADERBOARD_QUERY,
    variables: { scope: "GLOBAL" },
  });
  const [{ data: achievementsData }] = useQuery({ query: ACHIEVEMENTS_QUERY });

  const enrollments: CourseEnrollment[] = enrollmentsData?.myEnrollments ?? [];
  const leaderboard: LeaderboardEntry[] = leaderboardData?.leaderboard ?? [];
  const serverUnlockedAchievements: Array<{ id: string; unlockedAt: string }> =
    achievementsData?.achievements ?? [];

  const totalXp = user?.totalXp ?? 0;
  const { level, xpIntoLevel, xpForNextLevel } = levelFromXp(totalXp);

  const badgeInputs = computeBadgeInputsFromEnrollments(enrollments, totalXp);

  const completedWaves = badgeInputs.completedWaves;
  const completedCourses = badgeInputs.completedCourses;

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

  const unlockedMap = new Map<string, string>(
    serverUnlockedAchievements.map((a) => [a.id, a.unlockedAt]),
  );

  const trophyAchievements: UserAchievement[] = BADGE_DEFS.map((b) => {
    const unlockedAt = unlockedMap.get(b.id) ?? null;
    return {
      id: b.id,
      name: b.label,
      trigger: "metric" as const,
      achievedAt: unlockedAt,
    };
  });

  const badgesEarned = serverUnlockedAchievements.length;

  const levelTimeline = buildLevelTimeline(totalXp);

  const [curriculum, setCurriculum] = useState<"LOCAL" | "GLOBAL">("LOCAL");
  const [gamifyTab, setGamifyTab] = useState<"stats" | "badges" | "timeline">("stats");

  // Dynamic Exam countdown based on student grade level
  const examInfo = useMemo(() => {
    const now = new Date();
    const grade = user?.grade?.toUpperCase() ?? "G10";
    let examName = "Term Test Evaluation";
    let targetDate = new Date(now.getFullYear(), 11, 15); // Default to December 15 of current year

    if (grade === "G10" || grade === "G11") {
      examName = "G.C.E. O/L Examination";
      targetDate = new Date("2026-12-10T09:00:00");
    } else if (grade === "G12" || grade === "G13" || grade === "AL") {
      examName = "G.C.E. A/L Examination";
      targetDate = new Date("2026-11-25T09:00:00");
    }

    const diffMs = targetDate.getTime() - now.getTime();
    const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return { name: examName, daysRemaining: diffDays };
  }, [user]);

  const handleXpEarned = (xp: number) => {
    updateTotalXp(totalXp + xp);
    toast({
      type: "success",
      title: "Focus Session Complete!",
      message: `Great job focusing! You gained +${xp} XP towards your goals.`,
    });
  };

  // Dynamic calculations
  const xpToNextLevel = xpForNextLevel - xpIntoLevel;

  // Find the current active lesson and wave
  const resumeInfo = useMemo(() => {
    if (!resumeCourse) return null;
    const lessons = resumeCourse.lessons ?? [];
    for (const l of lessons) {
      const waves = l.waves ?? [];
      for (let wIdx = 0; wIdx < waves.length; wIdx++) {
        const wave = waves[wIdx];
        if (wave.myProgress?.status !== "COMPLETED") {
          return {
            lessonTitle: l.title,
            waveName: `Wave ${wIdx + 1}`,
            note: "Resume your learning journey",
            waveId: wave.id,
          };
        }
      }
    }
    // Fallback if everything is completed or no waves
    return {
      lessonTitle: lessons[0]?.title ?? "Introductory",
      waveName: "Wave 1",
      note: "Review your completed waves",
      waveId: lessons[0]?.waves?.[0]?.id ?? "",
    };
  }, [resumeCourse]);

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <StudentShell>
        <div className="space-y-8">
          {/* 1. Greeting band (Dawn gradient, no border, Instrument Serif) */}
          <div className="rounded-[24px] bg-gradient-dawn p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-normal font-serif text-foreground sm:text-5xl">
                Good evening, {user?.fullName?.split(" ")[0] ?? "Learner"}.
              </h1>
              <p className="text-muted-foreground text-sm">
                You're {xpToNextLevel} XP from Level {level + 1}. ({totalXp.toLocaleString()} XP
                total)
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <StreakFlame dayCount={user?.streak ?? 0} size="md" />
              <XPBar totalXp={totalXp} className="min-w-[140px]" compact />
            </div>
          </div>

          {/* AI Nudge (Conditional) */}
          <div className="relative overflow-hidden rounded-[24px] border border-primary/20 bg-card/90 backdrop-blur-sm p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-primary">
                <Sparkles className="h-3 w-3 text-primary" /> AI Tutor Nudge
              </span>
              <p className="text-sm text-foreground font-medium">
                You stumbled on quadratic factorization twice this week. Want a 5-minute refresher?
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" className="rounded-full border-primary/30 text-primary hover:bg-primary/10">
                Review with AI
              </Button>
            </div>
          </div>

          {/* 2. Continue Learning — Hero Card spanning full width */}
          <Card className="rounded-[24px] overflow-hidden">
            <CardContent className="p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              {enrollmentsFetching ? (
                <Skeleton className="h-24 w-full" />
              ) : resumeCourse ? (
                <>
                  <div className="space-y-2 flex-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary/80 block">
                      {resumeCourse.title}
                    </span>
                    <h2 className="text-3xl font-normal font-serif text-foreground">
                      {resumeInfo?.lessonTitle}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {resumeInfo?.waveName} · {resumeInfo?.note}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 shrink-0 w-full md:w-auto justify-between md:justify-end">
                    <ProgressRing
                      value={resumePct}
                      size={72}
                      strokeWidth={6}
                      className="text-primary"
                    >
                      <span className="text-sm font-bold">{resumePct}%</span>
                    </ProgressRing>
                    {resumeInfo?.waveId ? (
                      <Link to="/waves/$waveId" params={{ waveId: resumeInfo.waveId }}>
                        <Button size="lg" className="rounded-full px-8 gap-2">
                          <ArrowRight className="h-5 w-5" /> Continue
                        </Button>
                      </Link>
                    ) : (
                      <Link to="/courses/$courseId" params={{ courseId: resumeCourse.id }}>
                        <Button size="lg" className="rounded-full px-8 gap-2">
                          <ArrowRight className="h-5 w-5" /> Continue
                        </Button>
                      </Link>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 py-6 text-center w-full">
                  <BookOpen className="h-10 w-10 text-muted-foreground" />
                  <h3 className="text-2xl font-serif font-normal text-foreground">
                    Your first lesson is waiting
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Explore our courses and start learning today.
                  </p>
                  <Link to="/courses">
                    <Button className="rounded-full px-6">Browse Courses</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. Up Next row */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Up next for you
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Card 1: Next Wave */}
              <Card className="p-5 flex flex-col justify-between min-h-[140px] lift-on-hover">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
                    Next Wave
                  </span>
                  <h4 className="text-base font-semibold truncate">
                    {resumeInfo?.lessonTitle
                      ? `${resumeInfo.lessonTitle} — Next Steps`
                      : "Ready to study"}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    Move forward to build solid concepts step by step.
                  </p>
                </div>
                {resumeInfo?.waveId ? (
                  <Link to="/waves/$waveId" params={{ waveId: resumeInfo.waveId }} className="mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-primary p-0 hover:bg-transparent"
                    >
                      Study Now <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/courses" className="mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-primary p-0 hover:bg-transparent"
                    >
                      Browse courses <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </Card>

              {/* Card 2: Revision (AI suggested) */}
              <Card className="p-5 flex flex-col justify-between min-h-[140px] border-primary/20 bg-primary/5 lift-on-hover">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                      Revision
                    </span>
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary uppercase tracking-wider">
                      <Sparkles className="h-2.5 w-2.5" /> AI Suggested
                    </span>
                  </div>
                  <h4 className="text-base font-semibold">Spaced Repetition</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    Strengthen neural paths: refresh topics decaying from memory.
                  </p>
                </div>
                <Link to="/dashboard" className="mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-primary p-0 hover:bg-transparent"
                  >
                    Refresh Memory <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </Card>

              {/* Card 3: New Course Suggestion */}
              <Card className="p-5 flex flex-col justify-between min-h-[140px] lift-on-hover">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Suggestion
                  </span>
                  <h4 className="text-base font-semibold">Explore New Horizon</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    Broaden your understanding by trying subjects outside your grade.
                  </p>
                </div>
                <Link to="/courses" className="mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground p-0 hover:bg-transparent"
                  >
                    Browse All <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </Card>
            </div>
          </div>

          {/* Grid Layout for Courses, Stats, activity, and Leaderboard */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left column (2/3) */}
            <div className="space-y-6 lg:col-span-2">
              {/* My Courses */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-xl">
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      My Courses
                    </span>
                    <Link
                      to="/courses"
                      className="text-xs text-primary font-semibold hover:underline"
                    >
                      View all
                    </Link>
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
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-6 text-center">
                      <p className="text-sm font-medium">
                        {sanitizeGraphQLError(enrollmentsError).title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {sanitizeGraphQLError(enrollmentsError).message}
                      </p>
                      <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                        Try again
                      </Button>
                    </div>
                  ) : enrollments.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-6 text-center">
                      <p className="text-muted-foreground text-sm">
                        You are not enrolled in any courses yet.
                      </p>
                      <Link to="/courses">
                        <Button variant="outline" className="rounded-full">
                          Browse courses
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {enrollments.slice(0, 6).map((course) => {
                        const completed = course.myProgress?.completedWaves ?? 0;
                        const total = course.myProgress?.totalWaves ?? 0;
                        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                        const done = total > 0 && completed === total;
                        return (
                          <Link
                            key={course.id}
                            to="/courses/$courseId"
                            params={{ courseId: course.id }}
                            className="group flex items-center gap-4 rounded-xl border p-4 transition-all hover:border-primary/40 hover:shadow-md bg-card"
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

              {/* 5. This Week strip */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Weekly activity */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Weekly Activity</CardTitle>
                    <CardDescription>Keep active to grow your streak</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between py-4">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayName, i) => {
                      const completed = i < 3; // Mocking activity: Mon-Wed completed
                      const isToday = i === 4; // Mocking Friday today
                      return (
                        <div key={dayName} className="flex flex-col items-center gap-2">
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {dayName[0]}
                          </span>
                          <span
                            className={cn(
                              "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                              completed
                                ? "bg-primary text-primary-foreground"
                                : isToday
                                  ? "bg-primary/20 text-primary animate-pulse ring-2 ring-primary/40"
                                  : "bg-muted text-muted-foreground",
                            )}
                          >
                            {completed ? "✓" : i + 1}
                          </span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Leaderboard Peek */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>Leaderboard Peek</span>
                      <Link
                        to="/leaderboard"
                        className="text-xs text-primary font-semibold hover:underline"
                      >
                        View board
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {leaderboardFetching ? (
                      <Skeleton className="h-20 w-full" />
                    ) : (
                      leaderboard.slice(0, 3).map((e) => (
                        <div
                          key={e.user.id}
                          className="flex items-center justify-between text-xs border-b pb-1.5 last:border-0 last:pb-0"
                        >
                          <span className="flex items-center gap-2 font-medium">
                            <span className="text-muted-foreground w-4">#{e.rank}</span>
                            <span className="truncate max-w-[100px]">{e.user.fullName}</span>
                          </span>
                          <span className="tabular-nums text-muted-foreground">{e.totalXp} XP</span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right column (1/3) */}
            <div className="space-y-6">
              {/* Exam & Curriculum Tracker Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                    Curriculum & Exam Tracker
                  </CardTitle>
                  <CardDescription>Track your national study milestone</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex rounded-lg bg-muted p-1">
                    <button
                      type="button"
                      onClick={() => setCurriculum("LOCAL")}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all",
                        curriculum === "LOCAL"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Award className="h-3.5 w-3.5" />
                      Sri Lankan
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurriculum("GLOBAL")}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all",
                        curriculum === "GLOBAL"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Globe className="h-3.5 w-3.5" />
                      Global
                    </button>
                  </div>

                  <div className="rounded-xl border bg-muted/40 p-3.5 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      {examInfo.name}
                    </p>
                    <p className="mt-1.5 text-3xl font-black text-primary tabular-nums">
                      {examInfo.daysRemaining}
                    </p>
                    <p className="text-xs text-muted-foreground">days remaining</p>
                  </div>
                </CardContent>
              </Card>

              {/* Pomodoro Focus Timer */}
              <PomodoroTimer onXpEarned={handleXpEarned} />

              {/* Gamification Hub Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Gamification Hub</CardTitle>
                  <CardDescription>Manage achievements and path progress</CardDescription>
                  <div className="mt-3 flex border-b">
                    {(["stats", "badges", "timeline"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setGamifyTab(t)}
                        className={cn(
                          "flex-1 pb-2 text-xs font-medium border-b-2 capitalize transition-all",
                          gamifyTab === t
                            ? "border-primary text-primary font-bold"
                            : "border-transparent text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {t === "timeline" ? "path" : t}
                      </button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="pt-3">
                  {gamifyTab === "stats" && (
                    <div className="space-y-4">
                      <StatRow
                        label="Total XP"
                        value={totalXp.toLocaleString()}
                        icon={<Zap className="h-4 w-4 text-primary" />}
                      />
                      <StatRow
                        label="Level"
                        value={`${level} — ${levelName(level)}`}
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
                        icon={<TrophyIcon className="h-4 w-4 text-gold" />}
                      />
                      <StatRow
                        label="Badges Earned"
                        value={`${badgesEarned}/${BADGE_DEFS.length}`}
                        icon={<Sparkles className="h-4 w-4 text-orange" />}
                      />
                    </div>
                  )}

                  {gamifyTab === "badges" && (
                    <div>
                      <div className="mb-2 text-xs text-muted-foreground">
                        {badgesEarned} of {BADGE_DEFS.length} badges unlocked
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {trophyAchievements.map((a) => (
                          <AchievementBadge key={a.id} achievement={a} badgeSize="sm" />
                        ))}
                      </div>
                    </div>
                  )}

                  {gamifyTab === "timeline" && (
                    <div className="max-h-[300px] overflow-y-auto pr-1">
                      <PointsLevelsTimeline
                        levels={levelTimeline}
                        currentPoints={totalXp}
                        currentLevelLabel="You are here"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </StudentShell>
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
