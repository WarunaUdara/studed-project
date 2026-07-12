import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Plus, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "urql";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { COURSES_QUERY, PUBLISH_COURSE_MUTATION } from "@/graphql/courses";
import { sanitizeGraphQLError } from "@/lib/errors";

interface CourseItem {
  id: string;
  title: string;
  description: string;
  slug: string;
  gradeLevel: string;
  price?: number | null;
  isPublished: boolean;
}

export const Route = createFileRoute("/educator/_layout/courses/")({
  component: EducatorCoursesPage,
});

function EducatorCoursesPage() {
  const { toast } = useToast();
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: COURSES_QUERY,
    variables: { filter: {} },
  });
  const [publishResult, publishCourse] = useMutation(PUBLISH_COURSE_MUTATION);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const courses = useMemo(
    () => data?.courses?.edges?.map((edge: { node: CourseItem }) => edge.node) ?? [],
    [data],
  );

  const handlePublish = async (id: string) => {
    setPublishingId(id);
    const result = await publishCourse({ id });
    setPublishingId(null);
    if (result.error) {
      const e = sanitizeGraphQLError(result.error);
      toast({ type: "error", title: e.title, message: e.message });
    } else {
      toast({ type: "success", title: "Published", message: "Course is now visible to students." });
      reexecuteQuery({ requestPolicy: "network-only" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Courses</h2>
        <Link to="/educator/courses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Course
          </Button>
        </Link>
      </div>

      {fetching && <p className="text-muted-foreground">Loading courses...</p>}
      {error && <p className="text-destructive">Failed to load courses.</p>}

      {!fetching && courses.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No courses yet.</p>
          <p className="text-sm text-muted-foreground">Create your first course to get started.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course: CourseItem) => (
          <Card key={course.id} data-testid="course-card">
            <CardHeader>
              <CardTitle className="text-lg">{course.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="rounded-full bg-secondary px-2 py-1">{course.gradeLevel}</span>
                <span className={course.isPublished ? "text-green-600" : "text-amber-600"}>
                  {course.isPublished ? "Published" : "Draft"}
                </span>
              </div>
              {course.price !== null && course.price !== undefined && (
                <p className="text-sm font-medium">Rs. {course.price.toFixed(2)}</p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <Link to="/educator/courses/$courseId" params={{ courseId: course.id }}>
                  <Button variant="outline" size="sm">
                    <Eye className="mr-1 h-4 w-4" />
                    View
                  </Button>
                </Link>
                {!course.isPublished && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={publishingId === course.id || publishResult.fetching}
                    onClick={() => handlePublish(course.id)}
                  >
                    <Upload className="mr-1 h-4 w-4" />
                    Publish
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
