import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Trophy, Zap } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "urql";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LEADERBOARD_QUERY, MY_ENROLLMENTS_QUERY } from "@/graphql/student";
import { useAuthStore } from "@/stores/auth";

interface Course {
  id: string;
  title: string;
  description: string;
  slug: string;
  gradeLevel: string;
  isPublished: boolean;
  myProgress?: {
    completedWaves: number;
    totalWaves: number;
  } | null;
}

interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    fullName: string;
  };
  totalXp: number;
}

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuthStore();
  const [{ data: enrollmentsData, fetching: enrollmentsFetching, error: enrollmentsError }] =
    useQuery({
      query: MY_ENROLLMENTS_QUERY,
    });
  const [{ data: leaderboardData }] = useQuery({
    query: LEADERBOARD_QUERY,
    variables: { scope: "GLOBAL" },
  });

  const courses = useMemo(
    () => (enrollmentsData?.myEnrollments as Course[]) ?? [],
    [enrollmentsData],
  );

  const leaderboard = useMemo(
    () => (leaderboardData?.leaderboard as LeaderboardEntry[]) ?? [],
    [leaderboardData],
  );

  return (
    <ProtectedRoute allowedRoles={["STUDENT", "EDUCATOR", "HEAD_EDUCATOR", "ADMIN"]}>
      <main className="min-h-screen bg-background">
        <header className="border-b">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <Link to="/" className="text-lg font-semibold hover:text-primary">
              StudEd
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Zap className="h-4 w-4 text-yellow-500" />
                {user?.totalXp ?? 0} XP
              </div>
              <Link to="/courses">
                <Button variant="outline" size="sm">
                  Browse Courses
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-6xl py-10">
          <div className="mb-8 space-y-2">
            <h1 className="text-3xl font-bold">Student Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.fullName ?? "Student"}. Continue your learning journey.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    My Enrolled Courses
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {enrollmentsFetching && (
                    <p className="text-muted-foreground">Loading courses...</p>
                  )}
                  {enrollmentsError && <p className="text-destructive">Failed to load courses.</p>}

                  {!enrollmentsFetching && courses.length === 0 && (
                    <div className="rounded-lg border border-dashed p-8 text-center">
                      <p className="text-muted-foreground">
                        You are not enrolled in any courses yet.
                      </p>
                      <Link to="/courses" className="mt-4 inline-block">
                        <Button>Browse Courses</Button>
                      </Link>
                    </div>
                  )}

                  {courses.map((course) => {
                    const completed = course.myProgress?.completedWaves ?? 0;
                    const total = course.myProgress?.totalWaves ?? 0;
                    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

                    return (
                      <Link
                        key={course.id}
                        to="/courses/$courseId"
                        params={{ courseId: course.id }}
                      >
                        <div className="rounded-lg border p-4 transition-colors hover:bg-muted">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium">{course.title}</p>
                              <p className="text-sm text-muted-foreground">{course.gradeLevel}</p>
                            </div>
                            <Button size="sm">Continue</Button>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {completed} of {total} waves completed
                              </span>
                              <span className="font-medium">{progress}%</span>
                            </div>
                            <div className="mt-1 h-2 w-full rounded-full bg-secondary">
                              <div
                                className="h-2 rounded-full bg-primary"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Global Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {leaderboard.slice(0, 10).map((entry) => (
                    <div key={entry.user.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                            entry.rank <= 3 ? "bg-yellow-100 text-yellow-800" : "bg-muted"
                          }`}
                        >
                          {entry.rank}
                        </span>
                        <span className="text-foreground">{entry.user.fullName}</span>
                      </div>
                      <span className="font-medium">{entry.totalXp} XP</span>
                    </div>
                  ))}
                  {leaderboard.length === 0 && (
                    <p className="text-sm text-muted-foreground">No leaderboard data yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}
