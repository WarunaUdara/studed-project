import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { useQuery } from "urql";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { StudentShell } from "@/components/layout/StudentShell";
import { AchievementBadge } from "@/components/ui/achievement-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { MY_ENROLLMENTS_QUERY } from "@/graphql/courses";
import { BADGE_DEFS, computeBadges, earnedCount, levelFromXp } from "@/lib/gamification";
import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/achievements")({
  component: AchievementsPage,
});

interface CourseEnrollment {
  id: string;
  lessons?: {
    waves?: {
      myProgress?: {
        status: string;
        highestScore?: number | null;
      } | null;
    }[];
  }[];
}

function AchievementsPage() {
  const { user } = useAuthStore();
  const totalXp = user?.totalXp ?? 0;
  const { level } = levelFromXp(totalXp);

  const [{ data, fetching }] = useQuery({
    query: MY_ENROLLMENTS_QUERY,
  });

  const enrollments: CourseEnrollment[] = data?.myEnrollments ?? [];

  // Compute stats
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

  const badges = computeBadges({
    totalXp,
    completedWaves,
    hasPerfectScore,
    completedLessons,
    proficientLessons,
    completedCourses,
  });

  const badgesEarned = earnedCount(badges);

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <StudentShell>
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
            <p className="text-muted-foreground">
              Unlock unique badges and climb the tiers by completing waves, earning perfect scores, and gaining experience.
            </p>
          </div>

          {/* Stats Summary Grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Experience Level</CardDescription>
                <CardTitle className="text-2xl font-bold">Level {level}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{totalXp.toLocaleString()} total XP earned</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Badges Unlocked</CardDescription>
                <CardTitle className="text-2xl font-bold text-orange">
                  {badgesEarned} / {BADGE_DEFS.length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {Math.round((badgesEarned / BADGE_DEFS.length) * 100)}% of achievements unlocked
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Perfect Waves</CardDescription>
                <CardTitle className="text-2xl font-bold text-success">
                  {hasPerfectScore ? "Unlocked" : "Locked"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {hasPerfectScore ? "Scored 100% on a wave! 🎉" : "Score 100% on a wave to unlock"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Badge Showcase Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-gold" />
                Badge Showcase
              </CardTitle>
              <CardDescription>Click or hover on a badge to view unlock requirements.</CardDescription>
            </CardHeader>
            <CardContent>
              {fetching ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {badges.map((b) => (
                    <div
                      key={b.id}
                      className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
                        b.earned
                          ? "bg-card shadow-sm hover:shadow-md"
                          : "bg-muted/30 opacity-60 hover:opacity-80"
                      }`}
                    >
                      <AchievementBadge
                        achievement={{
                          id: b.id,
                          name: b.label,
                          trigger: "metric",
                          achievedAt: b.earned ? new Date().toISOString() : null,
                        }}
                        badgeSize="default"
                      />
                      <h3 className="mt-2 text-sm font-semibold">{b.label}</h3>
                      <p className="mt-0.5 text-[11px] text-muted-foreground leading-tight">
                        {b.description}
                      </p>
                      {b.earned ? (
                        <span className="mt-2 rounded-full bg-success/15 px-2 py-0.5 text-[9px] font-bold text-success">
                          Unlocked
                        </span>
                      ) : (
                        <span className="mt-2 rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold text-muted-foreground">
                          Locked
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </StudentShell>
    </ProtectedRoute>
  );
}
