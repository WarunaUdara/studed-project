import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle, Eye, Plus, Send, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "urql";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { COURSES_QUERY, PUBLISH_COURSE_MUTATION } from "@/graphql/courses";
import { sanitizeGraphQLError } from "@/lib/errors";

interface CourseItem {
  id: string;
  title: string;
  description?: string;
  gradeLevel?: string;
  isPublished: boolean;
  createdAt: string;
  price?: number | null;
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

  const publishedCount = courses.filter((c: CourseItem) => c.isPublished).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
          <p className="mt-0.5 text-muted-foreground">
            {courses.length} total · {publishedCount} published
          </p>
        </div>
        <Link to="/educator/courses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Course
          </Button>
        </Link>
      </div>

      {/* States */}
      {error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          Failed to load courses.
        </p>
      )}

      {fetching && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      )}

      {!fetching && courses.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed p-16 text-center">
          <Sparkles className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-semibold">No courses yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first course to start teaching students.
            </p>
          </div>
          <Link to="/educator/courses/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create your first course
            </Button>
          </Link>
        </div>
      )}

      {/* Course grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course: CourseItem) => {
          return (
            <div
              key={course.id}
              data-testid="course-card"
              className="group"
            >
              <Card className="flex h-full flex-col hover:shadow-md hover:border-primary/30 transition-all hover:-translate-y-0.5">
                {/* Status bar */}
                <div className={`h-1.5 w-full rounded-t-xl ${course.isPublished ? "bg-success" : "bg-amber-400"}`} />

                <CardContent className="flex flex-1 flex-col gap-4 p-5">
                  {/* Title + status badge */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        course.isPublished
                          ? "bg-success/15 text-success"
                          : "bg-amber-500/15 text-amber-600"
                      }`}
                    >
                      {course.isPublished ? "Live" : "Draft"}
                    </span>
                  </div>

                  {/* Grade and date */}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {course.gradeLevel && (
                      <span className="rounded-full bg-muted px-2.5 py-1 font-medium">
                        {course.gradeLevel}
                      </span>
                    )}
                    <span>Created {new Date(course.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-auto flex flex-wrap gap-2">
                    <Link to="/educator/courses/$courseId" params={{ courseId: course.id }}>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Manage
                      </Button>
                    </Link>
                    {!course.isPublished && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={publishingId === course.id || publishResult.fetching}
                        onClick={() => handlePublish(course.id)}
                        className="border-success/40 text-success hover:bg-success/5"
                      >
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                        {publishingId === course.id ? "Publishing..." : "Publish"}
                      </Button>
                    )}
                    {course.isPublished && (
                      <span className="flex items-center gap-1 text-xs font-medium text-success">
                        <CheckCircle className="h-3.5 w-3.5" /> Live
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
