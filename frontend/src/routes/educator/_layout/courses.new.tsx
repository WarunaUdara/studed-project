import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "urql";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select, type SelectOption } from "@/components/ui/Select";
import { CREATE_COURSE_MUTATION } from "@/graphql/courses";

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

const createCourseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  gradeLevel: z.enum(gradeValues),
  price: z.number().min(0).optional(),
});

type CreateCourseForm = z.infer<typeof createCourseSchema>;

/** Converts a title string to a URL-safe slug */
function toSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Parse raw GraphQL error into a user-friendly message */
function parseServerError(rawMessage: string): string {
  if (rawMessage.includes("duplicate key") && rawMessage.includes("idx_courses_slug")) {
    return "A course with this slug already exists. Please choose a different slug.";
  }
  return "Failed to create course. Please try again.";
}

export const Route = createFileRoute("/educator/_layout/courses/new")({
  component: CreateCoursePage,
});

function CreateCoursePage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [createResult, createCourse] = useMutation(CREATE_COURSE_MUTATION);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateCourseForm>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      gradeLevel: "G1",
      price: undefined,
    },
  });

  const onSubmit = async (values: CreateCourseForm) => {
    setServerError(null);
    const result = await createCourse({
      input: {
        title: values.title,
        description: values.description,
        slug: values.slug,
        gradeLevel: values.gradeLevel,
        price: values.price,
      },
    });

    if (result.error) {
      setServerError(parseServerError(result.error.message));
      return;
    }

    if (result.data?.createCourse) {
      navigate({ to: "/educator/courses" });
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Course</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...register("title")}
                onChange={(e) => {
                  // forward to react-hook-form
                  register("title").onChange(e);
                  // auto-fill slug from title
                  setValue("slug", toSlug(e.target.value), { shouldValidate: false });
                }}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" {...register("description")} />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug{" "}
                <span className="text-xs text-muted-foreground">(auto-generated, editable)</span>
              </Label>
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
              <Label htmlFor="price">Price (Rs.) — leave blank for free</Label>
              <Input
                id="price"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                {...register("price", { valueAsNumber: true })}
              />
              {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
            </div>

            {serverError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
                <p className="text-sm text-destructive">{serverError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting || createResult.fetching}>
                {isSubmitting || createResult.fetching ? "Creating..." : "Create Course"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/educator/courses" })}
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
