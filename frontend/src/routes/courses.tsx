import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "urql";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { COURSES_QUERY } from "@/graphql/courses";

interface Course {
  id: string;
  title: string;
  description: string;
  slug: string;
  gradeLevel: string;
  price?: number | null;
}

export const Route = createFileRoute("/courses")({
  component: CoursesCatalogPage,
});

function CoursesCatalogPage() {
  const [{ data, fetching, error }] = useQuery({
    query: COURSES_QUERY,
    variables: { filter: { isPublished: true } },
  });

  const courses = useMemo(
    () => data?.courses?.edges?.map((edge: { node: Course }) => edge.node) ?? [],
    [data],
  );

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="text-lg font-semibold hover:text-primary">
            StudEd
          </Link>
          <Link to="/login">
            <Button variant="outline">Sign in</Button>
          </Link>
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
          {courses.map((course: Course) => (
            <Card key={course.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">{course.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-4">
                <p className="line-clamp-3 text-sm text-muted-foreground">{course.description}</p>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-secondary px-2 py-1 text-xs">
                    {course.gradeLevel}
                  </span>
                  <Link to="/courses/$courseId" params={{ courseId: course.id }}>
                    <Button size="sm">
                      <BookOpen className="mr-1 h-4 w-4" />
                      View
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
