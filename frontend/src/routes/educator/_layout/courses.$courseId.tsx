import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Pencil, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "urql";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { COURSE_QUERY, CREATE_LESSON_MUTATION } from "@/graphql/courses";

interface Lesson {
  id: string;
  title: string;
  sequenceOrder: number;
  isPublished: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  slug: string;
  gradeLevel: string;
  price?: number | null;
  isPublished: boolean;
  createdAt: string;
  lessons: Lesson[];
}

export const Route = createFileRoute("/educator/_layout/courses/$courseId")({
  component: CourseDetailPage,
});

function CourseDetailPage() {
  const { courseId } = Route.useParams();
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: COURSE_QUERY,
    variables: { id: courseId },
  });
  const [createResult, createLesson] = useMutation(CREATE_LESSON_MUTATION);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [sequenceOrder, setSequenceOrder] = useState("1");
  const [formError, setFormError] = useState<string | null>(null);

  const course: Course | undefined = data?.course;

  const lessons = useMemo(() => course?.lessons ?? [], [course]);

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const result = await createLesson({
      courseId,
      input: {
        title,
        sequenceOrder: parseInt(sequenceOrder, 10) || 1,
      },
    });

    if (result.error) {
      setFormError(result.error.message);
      return;
    }

    setTitle("");
    setSequenceOrder(String((lessons.length || 0) + 2));
    setShowForm(false);
    reexecuteQuery({ requestPolicy: "network-only" });
  };

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
            <div className="flex items-center gap-3">
              <Link to="/educator/courses/$courseId/edit" params={{ courseId }}>
                <Button variant="outline" size="sm">
                  <Pencil className="mr-1 h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <span className={course.isPublished ? "text-green-600" : "text-amber-600"}>
                {course.isPublished ? "Published" : "Draft"}
              </span>
            </div>
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Lessons
            </CardTitle>
            <Button size="sm" onClick={() => setShowForm(true)} disabled={showForm}>
              <Plus className="mr-1 h-4 w-4" />
              Add Lesson
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showForm && (
            <form onSubmit={handleCreateLesson} className="space-y-3 rounded-lg border p-4">
              <div className="space-y-2">
                <Label htmlFor="lesson-title">Lesson Title</Label>
                <Input
                  id="lesson-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Algebra Basics"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lesson-order">Sequence Order</Label>
                <Input
                  id="lesson-order"
                  type="number"
                  min={1}
                  value={sequenceOrder}
                  onChange={(e) => setSequenceOrder(e.target.value)}
                />
              </div>
              {formError && <p className="text-sm text-destructive">{formError}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={createResult.fetching || !title.trim()}>
                  {createResult.fetching ? "Creating..." : "Create Lesson"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {lessons.length === 0 ? (
            <p className="text-muted-foreground">No lessons yet. Add the first lesson.</p>
          ) : (
            <div className="space-y-2">
              {lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  to="/educator/courses/$courseId/lessons/$lessonId"
                  params={{ courseId, lessonId: lesson.id }}
                >
                  <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted">
                    <div>
                      <p className="font-medium">{lesson.title}</p>
                      <p className="text-sm text-muted-foreground">Order: {lesson.sequenceOrder}</p>
                    </div>
                    <span className={lesson.isPublished ? "text-green-600" : "text-amber-600"}>
                      {lesson.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
