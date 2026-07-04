import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "urql";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { COURSE_QUERY } from "@/graphql/courses";

interface Lesson {
  id: string;
  title: string;
  sequenceOrder: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  slug: string;
  gradeLevel: string;
  price?: number | null;
  isPublished: boolean;
  lessons: Lesson[];
}

export const Route = createFileRoute("/courses/$courseId")({
  component: CourseCatalogDetailPage,
});

function CourseCatalogDetailPage() {
  const { courseId } = Route.useParams();
  const [{ data, fetching, error }] = useQuery({
    query: COURSE_QUERY,
    variables: { id: courseId },
  });

  const course: Course | undefined = data?.course;
  const lessons = useMemo(() => course?.lessons ?? [], [course]);

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
        {fetching && <p className="text-muted-foreground">Loading course...</p>}
        {error && <p className="text-destructive">Failed to load course.</p>}

        {!fetching && !course && <p className="text-muted-foreground">Course not found.</p>}

        {course && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Link to="/courses">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">{course.title}</h1>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>About this course</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{course.description}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="rounded-full bg-secondary px-3 py-1">{course.gradeLevel}</span>
                  {course.price !== null && course.price !== undefined && (
                    <span className="rounded-full bg-secondary px-3 py-1">
                      Rs. {course.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Lessons
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lessons.length === 0 ? (
                  <p className="text-muted-foreground">No lessons published yet.</p>
                ) : (
                  <div className="space-y-2">
                    {lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <p className="font-medium">{lesson.title}</p>
                        <span className="text-sm text-muted-foreground">
                          Order {lesson.sequenceOrder}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </section>
    </main>
  );
}
