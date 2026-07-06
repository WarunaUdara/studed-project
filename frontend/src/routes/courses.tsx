import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, CheckCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "urql";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuthStore } from "@/stores/auth";
import { COURSES_QUERY } from "@/graphql/courses";
import { ENROLL_IN_COURSE_MUTATION } from "@/graphql/student";

interface Course {
  id: string;
  title: string;
  description: string;
  slug: string;
  gradeLevel: string;
  price?: number | null;
  myProgress?: {
    completedWaves: number;
    totalWaves: number;
  } | null;
}

export const Route = createFileRoute("/courses")({
  component: CoursesCatalogPage,
});

function CoursesCatalogPage() {
  const { isAuthenticated } = useAuthStore();
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: COURSES_QUERY,
    variables: { filter: { isPublished: true } },
  });
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [enrollResult, enroll] = useMutation(ENROLL_IN_COURSE_MUTATION);

  const courses = useMemo(
    () => data?.courses?.edges?.map((edge: { node: Course }) => edge.node) ?? [],
    [data],
  );

  const handleEnroll = async (courseId: string) => {
    setEnrollingId(courseId);
    const result = await enroll({ courseId });
    setEnrollingId(null);
    if (!result.error) {
      reexecuteQuery({ requestPolicy: "network-only" });
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="text-lg font-semibold hover:text-primary">
            StudEd
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <Link to="/dashboard">
                <Button variant="outline" size="sm">
                  Dashboard
                </Button>
              </Link>
            )}
            {!isAuthenticated && (
              <Link to="/login">
                <Button variant="outline" size="sm">Sign in</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl py-10">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="text-muted-foreground">Browse published courses for Sri Lankan schools.</p>
        </div>

        {fetching && <p className="text-muted-foreground">Loading courses...</p>}
        {error && <p className="text-destructive">Failed to load courses.</p>}

        {!fetching && courses.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">No published courses yet.</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course: Course) => {
            const isEnrolled = course.myProgress !== null && course.myProgress !== undefined;
            const completed = course.myProgress?.completedWaves ?? 0;
            const total = course.myProgress?.totalWaves ?? 0;

            return (
              <Card key={course.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                  <p className="line-clamp-3 text-sm text-muted-foreground">{course.description}</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-secondary px-2 py-1 text-xs">
                        {course.gradeLevel}
                      </span>
                      {isEnrolled && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" /> Enrolled
                        </span>
                      )}
                    </div>
                    {isEnrolled && total > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {completed} of {total} waves completed
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <Link to="/courses/$courseId" params={{ courseId: course.id }}>
                        <Button size="sm" variant="outline">
                          <BookOpen className="mr-1 h-4 w-4" />
                          View
                        </Button>
                      </Link>
                      {isAuthenticated && !isEnrolled && (
                        <Button
                          size="sm"
                          disabled={enrollingId === course.id || enrollResult.fetching}
                          onClick={() => handleEnroll(course.id)}
                        >
                          {enrollingId === course.id ? "Enrolling..." : "Enroll"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
