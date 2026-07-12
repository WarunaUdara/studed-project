import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, CheckCircle, GraduationCap, Search, SlidersHorizontal, X } from "lucide-react";
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

const GRADE_OPTIONS = [
  "ALL",
  "GRADE_1", "GRADE_2", "GRADE_3", "GRADE_4", "GRADE_5",
  "GRADE_6", "GRADE_7", "GRADE_8", "GRADE_9", "GRADE_10", "GRADE_11",
  "OL", "AL",
];

const GRADE_LABELS: Record<string, string> = {
  ALL: "All Grades",
  GRADE_1: "Grade 1", GRADE_2: "Grade 2", GRADE_3: "Grade 3",
  GRADE_4: "Grade 4", GRADE_5: "Grade 5", GRADE_6: "Grade 6",
  GRADE_7: "Grade 7", GRADE_8: "Grade 8", GRADE_9: "Grade 9",
  GRADE_10: "Grade 10", GRADE_11: "Grade 11",
  OL: "O/L", AL: "A/L",
};

const CARD_GRADIENTS = [
  "from-primary/15 via-purple/10 to-gold/10",
  "from-blue-500/15 via-primary/10 to-cyan-400/10",
  "from-emerald-500/15 via-teal-400/10 to-primary/10",
  "from-orange-400/15 via-amber-300/10 to-gold/10",
  "from-purple-500/15 via-pink-400/10 to-primary/10",
  "from-rose-500/15 via-orange-300/10 to-gold/10",
];

export const Route = createFileRoute("/courses/")({
  component: CoursesCatalogPage,
});

function CoursesCatalogPage() {
  const { isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: COURSES_QUERY,
    variables: { filter: { isPublished: true } },
  });
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [enrollResult, enroll] = useMutation(ENROLL_IN_COURSE_MUTATION);

  const allCourses = useMemo(
    () => data?.courses?.edges?.map((edge: { node: Course }) => edge.node) ?? [],
    [data],
  );

  const courses = useMemo(() => {
    let filtered = allCourses;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (c: Course) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q),
      );
    }
    if (gradeFilter !== "ALL") {
      filtered = filtered.filter((c: Course) => c.gradeLevel === gradeFilter);
    }
    return filtered;
  }, [allCourses, search, gradeFilter]);

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

  const enrolledCount = allCourses.filter((c: Course) => c.myProgress != null).length;
  const activeFilters = (search.trim() ? 1 : 0) + (gradeFilter !== "ALL" ? 1 : 0);

  return (
    <StudentShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
            Course Catalog
          </h1>
          <p className="text-muted-foreground">
            {allCourses.length} courses available · {enrolledCount} enrolled
          </p>
        </div>

        {/* Search + Filter bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="course-search"
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-9 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:ring-offset-1"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
            className="relative shrink-0"
          >
            <SlidersHorizontal className="mr-1.5 h-4 w-4" />
            Filter
            {activeFilters > 0 && (
              <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-foreground text-[10px] font-bold text-primary">
                {activeFilters}
              </span>
            )}
          </Button>
        </div>

        {/* Grade filter chips */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 rounded-xl border bg-card p-3">
                <p className="w-full text-xs font-medium text-muted-foreground mb-1">Grade Level</p>
                {GRADE_OPTIONS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGradeFilter(g)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      gradeFilter === g
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {GRADE_LABELS[g]}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {fetching && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {["s1", "s2", "s3", "s4", "s5", "s6"].map((s) => (
              <Skeleton key={`course-${s}`} className="h-64" />
            ))}
          </div>
        )}

        {/* Error */}
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

        {/* Empty state */}
        {!fetching && !error && courses.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed p-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">
                {allCourses.length === 0 ? "No courses yet" : "No matching courses"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {allCourses.length === 0
                  ? "New courses will appear here once educators publish them."
                  : "Try adjusting your search or filter."}
              </p>
            </div>
            {activeFilters > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setGradeFilter("ALL");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}

        {/* Course grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course: Course, i: number) => {
            const isEnrolled = course.myProgress !== null && course.myProgress !== undefined;
            const completed = course.myProgress?.completedWaves ?? 0;
            const total = course.myProgress?.totalWaves ?? 0;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
            const gradient = CARD_GRADIENTS[i % CARD_GRADIENTS.length];

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="group"
                data-testid="course-card"
              >
                <Card className="flex h-full flex-col overflow-hidden transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5">
                  {/* Header gradient */}
                  <div className={`relative h-28 overflow-hidden bg-gradient-to-br ${gradient}`}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <GraduationCap className="h-12 w-12 text-primary/25 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    {/* Grade badge on card */}
                    <span className="absolute right-3 top-3 rounded-full bg-background/80 backdrop-blur px-2.5 py-0.5 text-xs font-semibold text-foreground shadow-sm">
                      {GRADE_LABELS[course.gradeLevel] ?? course.gradeLevel}
                    </span>
                    {isEnrolled && (
                      <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-success/90 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
                        <CheckCircle className="h-3 w-3" /> Enrolled
                      </span>
                    )}
                  </div>

                  <CardContent className="flex flex-1 flex-col justify-between gap-4 p-5">
                    <div className="space-y-1.5">
                      <h3 className="text-base font-semibold leading-snug group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {course.description}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {/* Progress bar if enrolled */}
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
                          <div className="flex-1">
                            <div className="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {completed}/{total} waves complete
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between gap-2">
                        <Link to="/courses/$courseId" params={{ courseId: course.id }}>
                          <Button size="sm" variant="outline">
                            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                            {isEnrolled ? "Continue" : "View"}
                          </Button>
                        </Link>
                        {isAuthenticated && !isEnrolled && (
                          <Button
                            size="sm"
                            disabled={enrollingId === course.id || enrollResult.fetching}
                            onClick={() => handleEnroll(course.id)}
                          >
                            {enrollingId === course.id ? "Enrolling..." : "Enroll Free"}
                          </Button>
                        )}
                        {isEnrolled && percent === 100 && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-success">
                            <CheckCircle className="h-3.5 w-3.5" /> Completed
                          </span>
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
