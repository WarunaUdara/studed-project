import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen } from "lucide-react";
import { useQuery } from "urql";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { COURSE_QUERY } from "@/graphql/courses";

interface Course {
  id: string;
  title: string;
  description: string;
  slug: string;
  gradeLevel: string;
  price?: number | null;
  isPublished: boolean;
  createdAt: string;
}

export const Route = createFileRoute("/educator/_layout/courses/$courseId")({
  component: CourseDetailPage,
});

function CourseDetailPage() {
  const { courseId } = Route.useParams();
  const [{ data, fetching, error }] = useQuery({
    query: COURSE_QUERY,
    variables: { id: courseId },
  });

  const course: Course | undefined = data?.course;

  if (fetching) {
    return <p className="text-muted-foreground">Loading course...</p>;
  }

  if (error || !course) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">Failed to load course.</p>
        <Link to="/educator/courses">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to courses
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/educator/courses">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <h2 className="text-2xl font-bold">{course.title}</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Course Details</CardTitle>
            <span className={course.isPublished ? "text-green-600" : "text-amber-600"}>
              {course.isPublished ? "Published" : "Draft"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground">{course.description}</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="rounded-full bg-secondary px-3 py-1">{course.gradeLevel}</span>
            {course.price !== null && course.price !== undefined && (
              <span className="rounded-full bg-secondary px-3 py-1">
                Rs. {course.price.toFixed(2)}
              </span>
            )}
            <span className="text-muted-foreground">Slug: {course.slug}</span>
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
          <p className="text-muted-foreground">Lessons for this course will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
