import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "urql";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { COURSE_QUERY, UPDATE_COURSE_MUTATION } from "@/graphql/courses";

const grades: SelectOption[] = [
  { value: "G1", label: "Grade 1" },
  { value: "G2", label: "Grade 2" },
  { value: "G3", label: "Grade 3" },
  { value: "G4", label: "Grade 4" },
  { value: "G5", label: "Grade 5" },
  { value: "G6", label: "Grade 6" },
  { value: "G7", label: "Grade 7" },
  { value: "G8", label: "Grade 8" },
  { value: "G9", label: "Grade 9" },
  { value: "G10", label: "Grade 10" },
  { value: "G11", label: "Grade 11" },
  { value: "OL", label: "O/L" },
  { value: "AL", label: "A/L" },
];

const gradeValues = grades.map((g) => g.value) as [string, ...string[]];

const updateCourseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  gradeLevel: z.enum(gradeValues),
  price: z.number().min(0).optional(),
});

type UpdateCourseForm = z.infer<typeof updateCourseSchema>;

/** Parse raw GraphQL error into a user-friendly message */
function parseServerError(rawMessage: string): string {
  if (rawMessage.includes("duplicate key") && rawMessage.includes("idx_courses_slug")) {
    return "A course with this slug already exists. Please choose a different slug.";
  }
  return "Failed to update course. Please try again.";
}

export const Route = createFileRoute("/educator/_layout/courses/$courseId/edit")({
  component: EditCoursePage,
});

function EditCoursePage() {
  const { courseId } = Route.useParams();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [{ data, fetching: loadingCourse }] = useQuery({
    query: COURSE_QUERY,
    variables: { id: courseId },
  });
  const [updateResult, updateCourse] = useMutation(UPDATE_COURSE_MUTATION);

  const course = data?.course;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateCourseForm>({
    resolver: zodResolver(updateCourseSchema),
  });

  useEffect(() => {
    if (course) {
      reset({
        title: course.title,
        description: course.description,
        slug: course.slug,
        gradeLevel: course.gradeLevel,
        price: course.price ?? undefined,
      });
    }
  }, [course, reset]);

  const onSubmit = async (values: UpdateCourseForm) => {
    setServerError(null);
    const input: Record<string, unknown> = {
      title: values.title,
      description: values.description,
      slug: values.slug,
      gradeLevel: values.gradeLevel,
    };
    if (values.price !== undefined) {
      input.price = values.price;
    }

    const result = await updateCourse({ id: courseId, input });
    if (result.error) {
      setServerError(parseServerError(result.error.message));
      return;
    }
    navigate({ to: "/educator/courses/$courseId", params: { courseId } });
  };

  if (loadingCourse) {
    return (
      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">Course not found.</p>
        <Link to="/educator/courses">
          <Button variant="outline">Back to courses</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit Course</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register("title")} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                rows={4}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" {...register("slug")} placeholder="my-course-slug" />
              {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gradeLevel">Grade Level</Label>
              <Select id="gradeLevel" options={grades} {...register("gradeLevel")} />
              {errors.gradeLevel && (
                <p className="text-sm text-destructive">{errors.gradeLevel.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (Rs.)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                step="0.01"
                {...register("price", { valueAsNumber: true })}
              />
              {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
            </div>

            {serverError && <p className="text-sm text-destructive">{serverError}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting || updateResult.fetching}>
                {isSubmitting || updateResult.fetching ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigate({ to: "/educator/courses/$courseId", params: { courseId } })
                }
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
