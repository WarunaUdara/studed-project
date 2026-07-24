import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, GraduationCap, Trophy, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "urql";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { LeaderboardRankings } from "@/components/ui/leaderboard-rankings";
import { Skeleton } from "@/components/ui/Skeleton";
import { COURSES_QUERY, LEADERBOARD_QUERY } from "@/graphql/courses";
import type { CoursesQueryData, LeaderboardQueryData } from "@/lib/graphqlTypes";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/educator/_layout/leaderboard")({
  component: EducatorLeaderboardPage,
});

const GRADES = [
  { value: "G10", label: "Grade 10" },
  { value: "G11", label: "Grade 11" },
  { value: "AL", label: "Advanced Level" },
];

function EducatorLeaderboardPage() {
  const [scope, setScope] = useState<"GLOBAL" | "COURSE" | "GRADE">("GLOBAL");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedGrade, setSelectedGrade] = useState<string>("G10");

  // Fetch educator courses to populate the course selector
  const [{ data: coursesData, fetching: coursesFetching }] = useQuery<CoursesQueryData>({
    query: COURSES_QUERY,
    variables: { filter: {} },
  });

  const courses = useMemo(() => {
    return coursesData?.courses?.edges?.map((edge) => edge.node) ?? [];
  }, [coursesData]);

  useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  // Fetch leaderboard data based on selected scope and variables
  const [{ data: leaderboardData, fetching: leaderboardFetching, error }] =
    useQuery<LeaderboardQueryData>({
      query: LEADERBOARD_QUERY,
      variables: {
        scope,
        courseId: scope === "COURSE" ? selectedCourseId : undefined,
        grade: scope === "GRADE" ? selectedGrade : undefined,
      },
      pause: scope === "COURSE" && !selectedCourseId,
    });

  const leaderboard = leaderboardData?.leaderboard ?? [];

  const trophyRankings = leaderboard.map((entry) => ({
    userId: entry.user.id,
    userName: entry.user.fullName,
    rank: entry.rank,
    value: entry.totalXp,
    byline: `${entry.totalXp.toLocaleString()} XP`,
  }));

  const activeCourseTitle =
    courses.find((course) => course.id === selectedCourseId)?.title ?? "Selected Course";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Rankings</h1>
        <p className="mt-1 text-muted-foreground">
          Monitor performance metrics and leaderboards across your student cohort.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Scope selector column */}
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Filter Scope</CardTitle>
              <CardDescription>Choose how rankings are grouped</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                type="button"
                data-testid="scope-global"
                onClick={() => setScope("GLOBAL")}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                  scope === "GLOBAL"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Users className="h-4 w-4" />
                Global Leaderboard
              </button>

              <button
                type="button"
                data-testid="scope-course"
                onClick={() => setScope("COURSE")}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                  scope === "COURSE"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <BookOpen className="h-4 w-4" />
                Course Performance
              </button>

              <button
                type="button"
                data-testid="scope-grade"
                onClick={() => setScope("GRADE")}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                  scope === "GRADE"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <GraduationCap className="h-4 w-4" />
                Grade cohorts
              </button>
            </CardContent>
          </Card>

          {/* Conditional Filters depending on active Scope selection */}
          {scope === "COURSE" && courses.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Select Course</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>
          )}

          {scope === "GRADE" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Select Grade</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                >
                  {GRADES.map((grade) => (
                    <option key={grade.value} value={grade.value}>
                      {grade.label}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Leaderboard display area */}
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Trophy className="h-5 w-5 text-gold" />
                {scope === "GLOBAL" && "Global Cohort Leaderboard"}
                {scope === "COURSE" && `Rankings: ${activeCourseTitle}`}
                {scope === "GRADE" &&
                  `Rankings: ${GRADES.find((g) => g.value === selectedGrade)?.label}`}
              </CardTitle>
              <CardDescription>
                {scope === "GLOBAL" && "Overview of student rankings across the entire platform"}
                {scope === "COURSE" &&
                  "XP accumulated strictly within this course's lessons and waves"}
                {scope === "GRADE" &&
                  "Compare student milestones within this academic grade category"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="rounded-lg bg-destructive/10 p-4 text-center text-sm text-destructive">
                  Failed to load leaderboard details. Please try again.
                </div>
              ) : leaderboardFetching || (scope === "COURSE" && coursesFetching) ? (
                <div className="space-y-2.5 py-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : trophyRankings.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                  <Users className="h-8 w-8 opacity-40" />
                  <p className="text-sm font-medium">No students ranked yet</p>
                  <p className="text-xs">
                    Once students enroll and complete waves, their names will show up here.
                  </p>
                </div>
              ) : (
                <LeaderboardRankings
                  key={`${scope}-${selectedGrade}-${selectedCourseId}`}
                  rankings={trophyRankings}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
