import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle, GraduationCap, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "urql";
import { StudentShell } from "@/components/layout/StudentShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { COURSES_QUERY } from "@/graphql/courses";
import { ENROLL_IN_COURSE_MUTATION } from "@/graphql/student";
import { sanitizeGraphQLError } from "@/lib/errors";
import { useAuthStore } from "@/stores/auth";

interface Course {
  id: string;
  title: string;
  description: string;
  slug: string;
  gradeLevel: string;
  price?: number | null;
  myProgress?: { completedWaves: number; totalWaves: number } | null;
}

export const Route = createFileRoute("/courses/")({
  component: CoursesCatalogPage,
});

function CoursesCatalogPage() {
  const { isAuthenticated } = useAuthStore();
  const { toast } = useToast();
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
    if (result.error) {
      const e = sanitizeGraphQLError(result.error);
      toast({ type: "error", title: e.title, message: e.message });
    } else {
      toast({ type: "success", title: "Enrolled!", message: "You can now start learning." });
      reexecuteQuery({ requestPolicy: "network-only" });
    }
  };

  return (
    <StudentShell>
      <div className="space-y-6">
        <div className="mb-8 space-y-2">
          <h1 className="bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
            Course Catalog
          </h1>
          <p className="text-muted-foreground">Browse published courses for Sri Lankan schools.</p>
        </div>

        {fetching && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {["s1", "s2", "s3", "s4", "s5", "s6"].map((s) => (
              <Skeleton key={`course-${s}`} className="h-56" />
            ))}
          </div>
        )}

        {error && !fetching && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed p-12 text-center">
            <Search className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">{sanitizeGraphQLError(error).title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {sanitizeGraphQLError(error).message}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => reexecuteQuery({ requestPolicy: "network-only" })}
            >
              Try again
            </Button>
          </div>
        )}

        {!fetching && !error && courses.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed p-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">No courses yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                New courses will appear here once educators publish them.
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course: Course, i: number) => {
            const isEnrolled = course.myProgress !== null && course.myProgress !== undefined;
            const completed = course.myProgress?.completedWaves ?? 0;
            const total = course.myProgress?.totalWaves ?? 0;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className="group flex h-full flex-col overflow-hidden transition-all hover:shadow-lg hover:border-primary/30">
                  <div className="relative h-24 overflow-hidden bg-gradient-to-br from-primary/15 via-purple/10 to-gold/10">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <GraduationCap className="h-10 w-10 text-primary/30 transition-transform group-hover:scale-110" />
                    </div>
                  </div>
                  <CardContent className="flex flex-1 flex-col justify-between gap-4 p-5">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold leading-tight group-hover:text-primary">
                        {course.title}
                      </h3>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {course.description}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
                          {course.gradeLevel}
                        </span>
                        {isEnrolled && (
                          <span className="flex items-center gap-1 text-xs font-medium text-success">
                            <CheckCircle className="h-3 w-3" /> Enrolled
                          </span>
                        )}
                      </div>
                      {isEnrolled && total > 0 && (
                        <div className="flex items-center gap-3">
                          <ProgressRing
                            value={percent}
                            size={36}
                            strokeWidth={4}
                            className="text-primary"
                          >
                            <span className="text-[9px] font-bold">{percent}%</span>
                          </ProgressRing>
                          <span className="text-xs text-muted-foreground">
                            {completed}/{total} waves
                          </span>
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
              </motion.div>
            );
          })}
        </div>
      </div>
    </StudentShell>
  );
}
