import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Trophy } from "lucide-react";
import { useQuery } from "urql";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { LEADERBOARD_QUERY, MY_ENROLLMENTS_QUERY } from "@/graphql/courses";
import { useAuthStore } from "@/stores/auth";

interface CourseEnrollment {
  id: string;
  title: string;
  description: string;
  slug: string;
  gradeLevel: string;
  myProgress?: {
    completedWaves: number;
    totalWaves: number;
  } | null;
}

interface LeaderboardEntry {
  rank: number;
  user: { fullName: string };
  totalXp: number;
}

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuthStore();
  const [{ data: enrollmentsData, fetching: enrollmentsFetching, error: enrollmentsError }] =
    useQuery({ query: MY_ENROLLMENTS_QUERY });
  const [{ data: leaderboardData, fetching: leaderboardFetching, error: leaderboardError }] =
    useQuery({ query: LEADERBOARD_QUERY, variables: { scope: "GLOBAL" } });

  const enrollments = enrollmentsData?.myEnrollments ?? [];
  const leaderboard = leaderboardData?.leaderboard ?? [];

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.fullName}.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  My Enrollments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {enrollmentsFetching && <p className="text-muted-foreground">Loading...</p>}
                {enrollmentsError && (
                  <p className="text-destructive">Failed to load enrollments.</p>
                )}
                {!enrollmentsFetching && enrollments.length === 0 && (
                  <div className="text-center">
                    <p className="text-muted-foreground">
                      You are not enrolled in any courses yet.
                    </p>
                    <Link to="/courses" className="mt-3 inline-block">
                      <Button>Browse courses</Button>
                    </Link>
                  </div>
                )}
                <div className="space-y-4">
                  {enrollments.map((course: CourseEnrollment) => {
                    const completed = course.myProgress?.completedWaves ?? 0;
                    const total = course.myProgress?.totalWaves ?? 0;
                    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                    return (
                      <div key={course.id} className="rounded-md border p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{course.title}</p>
                            <p className="text-xs text-muted-foreground">{course.gradeLevel}</p>
                          </div>
                          <Link to="/courses/$courseId" params={{ courseId: course.id }}>
                            <Button variant="outline" size="sm">
                              Continue
                            </Button>
                          </Link>
                        </div>
                        <div className="mt-3">
                          <Progress value={percent} />
                          <p className="mt-1 text-xs text-muted-foreground">
                            {completed} of {total} waves completed ({percent}%)
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
              <CardContent>
                {leaderboardFetching && <p className="text-muted-foreground">Loading...</p>}
                {leaderboardError && (
                  <p className="text-destructive">Failed to load leaderboard.</p>
                )}
                {!leaderboardFetching && leaderboard.length === 0 && (
                  <p className="text-muted-foreground">No leaderboard entries yet.</p>
                )}
                <ol className="space-y-3">
                  {leaderboard.map((entry: LeaderboardEntry) => (
                    <li key={entry.rank} className="flex items-center justify-between">
                      <span className="text-sm">
                        #{entry.rank} {entry.user.fullName}
                      </span>
                      <span className="text-sm font-medium">{entry.totalXp} XP</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
