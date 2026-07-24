import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  GraduationCap,
  Play,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "urql";
import { StudentShell } from "@/components/layout/StudentShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { COURSES_QUERY } from "@/graphql/courses";
import { COURSE_PLAYER_QUERY, ENROLL_IN_COURSE_MUTATION } from "@/graphql/student";
import { sanitizeGraphQLError } from "@/lib/errors";
import { cn } from "@/lib/utils";
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
  "GRADE_1",
  "GRADE_2",
  "GRADE_3",
  "GRADE_4",
  "GRADE_5",
  "GRADE_6",
  "GRADE_7",
  "GRADE_8",
  "GRADE_9",
  "GRADE_10",
  "GRADE_11",
  "OL",
  "AL",
];

const GRADE_LABELS: Record<string, string> = {
  ALL: "All Grades",
  GRADE_1: "Grade 1",
  GRADE_2: "Grade 2",
  GRADE_3: "Grade 3",
  GRADE_4: "Grade 4",
  GRADE_5: "Grade 5",
  GRADE_6: "Grade 6",
  GRADE_7: "Grade 7",
  GRADE_8: "Grade 8",
  GRADE_9: "Grade 9",
  GRADE_10: "Grade 10",
  GRADE_11: "Grade 11",
  OL: "O/L",
  AL: "A/L",
};

const SUBJECT_OPTIONS = ["ALL", "Maths", "Science", "Physics", "Chemistry", "ICT"];
const SUBJECT_LABELS: Record<string, string> = {
  ALL: "All Subjects",
  Maths: "Mathematics",
  Science: "Science",
  Physics: "Physics",
  Chemistry: "Chemistry",
  ICT: "ICT",
};

const LANGUAGE_OPTIONS = ["ALL", "Sinhala", "Tamil", "English"];
const LANGUAGE_LABELS: Record<string, string> = {
  ALL: "All Languages",
  Sinhala: "Sinhala",
  Tamil: "Tamil",
  English: "English",
};

export const Route = createFileRoute("/courses/")({
  component: CoursesCatalogPage,
});

function getSubjectGradient(title: string) {
  const t = title.toLowerCase();
  if (t.includes("math") || t.includes("physics")) {
    return "from-blue-600/15 via-primary/5 to-cyan-500/15 text-blue-600";
  }
  if (t.includes("science") || t.includes("chem")) {
    return "from-emerald-600/15 via-teal-500/5 to-green-500/15 text-emerald-600";
  }
  if (t.includes("ict") || t.includes("python") || t.includes("coding")) {
    return "from-purple-600/15 via-violet-500/5 to-fuchsia-500/15 text-purple";
  }
  return "from-stone-500/15 via-neutral-500/5 to-zinc-500/15 text-muted-foreground";
}

function CoursesCatalogPage() {
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("ALL");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [langFilter, setLangFilter] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: COURSES_QUERY,
    variables: { filter: { isPublished: true } },
  });

  const allCourses = useMemo(
    () => data?.courses?.edges?.map((edge: { node: Course }) => edge.node) ?? [],
    [data],
  );

  const courses = useMemo(() => {
    let filtered = allCourses;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (c: Course) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
      );
    }
    if (gradeFilter !== "ALL") {
      filtered = filtered.filter((c: Course) => c.gradeLevel === gradeFilter);
    }
    if (subjectFilter !== "ALL") {
      const q = subjectFilter.toLowerCase();
      filtered = filtered.filter((c: Course) => c.title.toLowerCase().includes(q));
    }
    return filtered;
  }, [allCourses, search, gradeFilter, subjectFilter]);

  const featuredCourse = useMemo(() => {
    if (courses.length === 0) return null;
    return courses.find((c: Course) => c.title.toLowerCase().includes("math")) ?? courses[0];
  }, [courses]);

  const enrolledCount = allCourses.filter((c: Course) => c.myProgress != null).length;
  const activeFilters =
    (search.trim() ? 1 : 0) +
    (gradeFilter !== "ALL" ? 1 : 0) +
    (subjectFilter !== "ALL" ? 1 : 0) +
    (langFilter !== "ALL" ? 1 : 0);

  return (
    <StudentShell>
      <div className="space-y-8 relative">
        {/* Page header */}
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-primary/80 block">
            Catalog
          </span>
          <h1 className="text-4xl font-normal font-serif text-foreground sm:text-5xl">
            Choose what to master.
          </h1>
          <p className="text-muted-foreground text-sm">
            {allCourses.length} courses available · {enrolledCount} enrolled · press{" "}
            <kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px] border">/</kbd> to search
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchInputRef}
              id="course-search"
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-input bg-card py-2.5 pl-9 pr-9 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary focus:ring-offset-1 h-11"
            />
            {search && (
              <button
                type="button"
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
            className="relative shrink-0 rounded-full h-11 px-5"
          >
            <SlidersHorizontal className="mr-1.5 h-4 w-4" />
            Filter
            {activeFilters > 0 && (
              <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-[10px] font-bold text-primary">
                {activeFilters}
              </span>
            )}
          </Button>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 rounded-2xl border bg-card p-5">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Grade Level
                  </p>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar sm:flex-wrap">
                    {GRADE_OPTIONS.map((g) => (
                      <button
                        type="button"
                        key={g}
                        onClick={() => setGradeFilter(g)}
                        className={cn(
                          "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all border shrink-0 min-h-[36px]",
                          gradeFilter === g
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background text-muted-foreground border-border hover:bg-muted/80",
                        )}
                      >
                        {GRADE_LABELS[g]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Subject
                  </p>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar sm:flex-wrap">
                    {SUBJECT_OPTIONS.map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setSubjectFilter(s)}
                        className={cn(
                          "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all border shrink-0 min-h-[36px]",
                          subjectFilter === s
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background text-muted-foreground border-border hover:bg-muted/80",
                        )}
                      >
                        {SUBJECT_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Language
                  </p>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar sm:flex-wrap">
                    {LANGUAGE_OPTIONS.map((l) => (
                      <button
                        type="button"
                        key={l}
                        onClick={() => setLangFilter(l)}
                        className={cn(
                          "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all border shrink-0 min-h-[36px]",
                          langFilter === l
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background text-muted-foreground border-border hover:bg-muted/80",
                        )}
                      >
                        {LANGUAGE_LABELS[l]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Featured Course Card */}
        {featuredCourse && !fetching && !error && (
          <Card className="rounded-[24px] overflow-hidden border bg-card lift-on-hover">
            <div className="flex flex-col md:flex-row min-h-[220px]">
              <div
                className={cn(
                  "md:w-1/3 flex items-center justify-center p-6 bg-gradient-to-br",
                  getSubjectGradient(featuredCourse.title),
                )}
              >
                <GraduationCap className="h-16 w-16 opacity-30" />
              </div>
              <div className="p-8 flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
                    Featured Course
                  </span>
                  <h2 className="text-2xl font-normal font-serif text-foreground">
                    {featuredCourse.title}
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {featuredCourse.description}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    className="rounded-full"
                    onClick={() => setSelectedCourseId(featuredCourse.id)}
                  >
                    Explore Syllabus
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Loading state */}
        {fetching && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {["s1", "s2", "s3"].map((s) => (
              <Skeleton key={`course-${s}`} className="h-64 rounded-[24px]" />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !fetching && (
          <div className="flex flex-col items-center gap-4 rounded-[24px] border border-dashed p-12 text-center">
            <Search className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">{sanitizeGraphQLError(error).title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {sanitizeGraphQLError(error).message}
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => reexecuteQuery({ requestPolicy: "network-only" })}
            >
              Try again
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!fetching && !error && courses.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-[24px] border border-dashed p-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">
                {allCourses.length === 0 ? "No courses yet" : "No matching courses"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {allCourses.length === 0
                  ? "New courses will appear here once educators publish them."
                  : "Try widening your filters."}
              </p>
            </div>
            {activeFilters > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  setSearch("");
                  setGradeFilter("ALL");
                  setSubjectFilter("ALL");
                  setLangFilter("ALL");
                }}
              >
                Reset filters
              </Button>
            )}
          </div>
        )}

        {/* Course Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course: Course, i: number) => {
            const isEnrolled = course.myProgress !== null && course.myProgress !== undefined;
            const completed = course.myProgress?.completedWaves ?? 0;
            const total = course.myProgress?.totalWaves ?? 0;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
            const gradient = getSubjectGradient(course.title);

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="group cursor-pointer"
                onClick={() => setSelectedCourseId(course.id)}
              >
                <Card className="flex h-full flex-col overflow-hidden transition-all border bg-card hover:border-primary/45 rounded-[24px]">
                  {/* Card Cover */}
                  <div className={cn("relative h-28 overflow-hidden bg-gradient-to-br", gradient)}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <GraduationCap className="h-12 w-12 opacity-20 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    {/* Serif Course Title on the Cover */}
                    <div className="absolute bottom-3 left-4 right-4">
                      <h4 className="text-lg font-serif font-normal tracking-tight text-foreground truncate">
                        {course.title}
                      </h4>
                    </div>
                    {/* Badge */}
                    <span className="absolute right-3 top-3 rounded-full bg-background/80 backdrop-blur px-2.5 py-0.5 text-[10px] font-bold text-foreground uppercase tracking-wider">
                      {GRADE_LABELS[course.gradeLevel] ?? course.gradeLevel}
                    </span>
                    {isEnrolled && (
                      <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground shadow-sm uppercase tracking-wider">
                        <CheckCircle className="h-3 w-3" /> Enrolled
                      </span>
                    )}
                  </div>

                  <CardContent className="flex flex-1 flex-col justify-between gap-4 p-5">
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {course.description}
                    </p>

                    <div className="space-y-3 border-t pt-3">
                      {/* Progress ring or price tag */}
                      {isEnrolled && total > 0 ? (
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ProgressRing
                              value={percent}
                              size={28}
                              strokeWidth={3}
                              className="text-primary"
                            >
                              <span className="text-[7px] font-bold">{percent}%</span>
                            </ProgressRing>
                            <span>
                              {completed}/{total} waves completed
                            </span>
                          </span>
                          <span className="flex items-center gap-0.5 text-primary font-bold">
                            View <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground uppercase tracking-widest text-[9px] bg-muted px-2 py-0.5 rounded">
                            Free tier
                          </span>
                          <span className="flex items-center gap-0.5 text-primary font-bold">
                            Details <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Right-side Detail Sheet */}
        <AnimatePresence>
          {selectedCourseId && (
            <CourseDetailSheet
              courseId={selectedCourseId}
              onClose={() => setSelectedCourseId(null)}
              onEnrollSuccess={() => reexecuteQuery({ requestPolicy: "network-only" })}
            />
          )}
        </AnimatePresence>
      </div>
    </StudentShell>
  );
}

function CourseDetailSheet({
  courseId,
  onClose,
  onEnrollSuccess,
}: {
  courseId: string;
  onClose: () => void;
  onEnrollSuccess: () => void;
}) {
  const { isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const [{ data, fetching, error }] = useQuery({
    query: COURSE_PLAYER_QUERY,
    variables: { id: courseId },
  });
  const [enrollResult, enroll] = useMutation(ENROLL_IN_COURSE_MUTATION);

  const course = data?.course;
  const isEnrolled = course?.myProgress !== null && course?.myProgress !== undefined;

  const handleEnroll = async () => {
    const result = await enroll({ courseId });
    if (result.error) {
      const e = sanitizeGraphQLError(result.error);
      toast({ type: "error", title: e.title, message: e.message });
    } else {
      toast({ type: "success", title: "Enrolled!", message: "You can now start learning." });
      onEnrollSuccess();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm"
      />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 z-50 h-full w-full sm:w-[420px] bg-card/95 backdrop-blur-md border-l shadow-2xl overflow-y-auto p-6"
      >
        <div className="flex items-center justify-between border-b pb-4 mb-6">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Course Detail
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {fetching ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : error || !course ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Error loading course syllabus.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded">
                {GRADE_LABELS[course.gradeLevel] ?? course.gradeLevel}
              </span>
              <h2 className="text-2xl font-serif font-normal">{course.title}</h2>
              <p className="text-sm text-muted-foreground">{course.description}</p>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Syllabus
              </h3>
              <div className="space-y-4">
                {course.lessons.map(
                  (
                    lesson: {
                      id: string;
                      title: string;
                      waves: {
                        id: string;
                        title: string;
                        xpReward: number;
                        myProgress?: { status: string } | null;
                      }[];
                    },
                    lIdx: number,
                  ) => (
                    <div key={lesson.id} className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary shrink-0" />
                        Lesson {lIdx + 1}: {lesson.title}
                      </h4>
                      <ul className="pl-6 space-y-1.5 border-l border-border/60 ml-2">
                        {lesson.waves.map(
                          (
                            wave: {
                              id: string;
                              title: string;
                              xpReward: number;
                              myProgress?: { status: string } | null;
                            },
                            wIdx: number,
                          ) => {
                            const completed = wave.myProgress?.status === "COMPLETED";
                            return (
                              <li
                                key={wave.id}
                                className="text-xs flex items-center justify-between gap-2 py-1 text-muted-foreground"
                              >
                                <span className="flex items-center gap-1.5">
                                  {completed ? (
                                    <CheckCircle className="h-3 w-3 text-success shrink-0" />
                                  ) : (
                                    <Play className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                                  )}
                                  Wave {wIdx + 1}: {wave.title}
                                </span>
                                <span className="text-[10px] tabular-nums font-medium bg-muted px-1.5 py-0.5 rounded">
                                  {wave.xpReward} XP
                                </span>
                              </li>
                            );
                          },
                        )}
                      </ul>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="border-t pt-6 flex flex-col gap-3">
              {isEnrolled ? (
                <Link to="/courses/$courseId" params={{ courseId: course.id }}>
                  <Button className="w-full rounded-full h-11" onClick={onClose}>
                    Continue Learning
                  </Button>
                </Link>
              ) : isAuthenticated ? (
                <Button
                  className="w-full rounded-full h-11"
                  onClick={handleEnroll}
                  disabled={enrollResult.fetching}
                >
                  {enrollResult.fetching ? "Enrolling..." : "Enroll Free"}
                </Button>
              ) : (
                <Link to="/login">
                  <Button className="w-full rounded-full h-11">Sign in to Enroll</Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}
