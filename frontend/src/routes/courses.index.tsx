import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle,
  Play,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "urql";
import { LearningPathRibbon } from "@/components/learning-paths/LearningPathRibbon";
import type { CourseNode, LearningPathDef, PathCategory } from "@/components/learning-paths/types";
import { StudentShell } from "@/components/layout/StudentShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { COURSES_QUERY } from "@/graphql/courses";
import { COURSE_PLAYER_QUERY, ENROLL_IN_COURSE_MUTATION } from "@/graphql/student";
import { sanitizeGraphQLError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/courses/")({
  component: CoursesCatalogPage,
});

const CATEGORY_TABS: { id: PathCategory; label: string; icon: string }[] = [
  { id: "ALL", label: "All Paths", icon: "✨" },
  { id: "MATH", label: "Mathematics", icon: "📐" },
  { id: "CS", label: "Programming & CS", icon: "💻" },
  { id: "SCIENCE", label: "Science & Physics", icon: "🔬" },
  { id: "LANGUAGES", label: "Languages", icon: "📚" },
];

function CoursesCatalogPage() {
  const [search, setSearch] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("search") || "";
    }
    return "";
  });
  const [activeCategory, setActiveCategory] = useState<PathCategory>("ALL");
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

  const allCourses: CourseNode[] = useMemo(
    () => data?.courses?.edges?.map((edge: { node: CourseNode }) => edge.node) ?? [],
    [data],
  );

  // Group and structure courses into curated Learning Paths
  const learningPaths: LearningPathDef[] = useMemo(() => {
    const query = search.trim().toLowerCase();

    // Helper filter
    const matchesSearch = (c: CourseNode) => {
      if (!query) return true;
      return c.title.toLowerCase().includes(query) || c.description.toLowerCase().includes(query);
    };

    // Math Courses
    const mathCourses = allCourses.filter(
      (c) =>
        matchesSearch(c) &&
        (c.title.toLowerCase().includes("math") ||
          c.title.toLowerCase().includes("geometry") ||
          c.slug.includes("geometry") ||
          c.slug.includes("math")),
    );

    // CS & Coding Courses
    const csCourses = allCourses.filter(
      (c) =>
        matchesSearch(c) &&
        (c.title.toLowerCase().includes("python") ||
          c.title.toLowerCase().includes("code") ||
          c.slug.includes("python")),
    );

    // Science & Physics Courses
    const scienceCourses = allCourses.filter(
      (c) =>
        matchesSearch(c) &&
        (c.title.toLowerCase().includes("science") ||
          c.title.toLowerCase().includes("physic") ||
          c.slug.includes("science") ||
          c.slug.includes("physics")),
    );

    // Languages Courses
    const langCourses = allCourses.filter(
      (c) =>
        matchesSearch(c) &&
        (c.title.toLowerCase().includes("english") ||
          c.title.toLowerCase().includes("sinhala") ||
          c.title.toLowerCase().includes("tamil") ||
          c.slug.includes("english")),
    );

    // Other/Additional Courses (e.g. educator drafts / test courses)
    const categorizedIds = new Set([
      ...mathCourses.map((c) => c.id),
      ...csCourses.map((c) => c.id),
      ...scienceCourses.map((c) => c.id),
      ...langCourses.map((c) => c.id),
    ]);
    const extraCourses = allCourses.filter((c) => !categorizedIds.has(c.id) && matchesSearch(c));

    const paths: LearningPathDef[] = [];

    if (mathCourses.length > 0) {
      paths.push({
        id: "math-foundations",
        title: "Math Foundations",
        subtitle: "Strengthen algebra, geometry, and arithmetic skills step-by-step.",
        levelBadge: "GRADES 4–11 · O/L",
        category: "MATH",
        courses: mathCourses,
      });
    }

    if (csCourses.length > 0) {
      paths.push({
        id: "programming-cs",
        title: "Programming & Computer Science",
        subtitle: "Speak the language of computers and build programs in Python.",
        levelBadge: "FOUNDATIONAL · ALL AGES",
        category: "CS",
        courses: csCourses,
      });
    }

    if (scienceCourses.length > 0) {
      paths.push({
        id: "science-physics",
        title: "Natural Science & Physics",
        subtitle: "Explore physics mechanics, cellular biology, and chemistry laws.",
        levelBadge: "SCIENCE · O/L & A/L",
        category: "SCIENCE",
        courses: scienceCourses,
      });
    }

    if (langCourses.length > 0) {
      paths.push({
        id: "languages-expression",
        title: "Languages & Humanities",
        subtitle: "Master grammar, literature analysis, and expressive writing.",
        levelBadge: "TRILINGUAL · O/L",
        category: "LANGUAGES",
        courses: langCourses,
      });
    }

    if (extraCourses.length > 0) {
      paths.push({
        id: "additional-explorations",
        title: "Additional Explorations",
        subtitle: "Explore custom courses and specialized modules published by educators.",
        levelBadge: "EXPLORATORY",
        category: "ALL",
        courses: extraCourses,
      });
    }

    return paths;
  }, [allCourses, search]);

  const filteredPaths = useMemo(() => {
    if (activeCategory === "ALL") return learningPaths;
    return learningPaths.filter((p) => p.category === activeCategory);
  }, [learningPaths, activeCategory]);

  const totalEnrolled = allCourses.filter((c) => c.myProgress != null).length;

  return (
    <StudentShell>
      <div className="space-y-8 relative pb-12">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Learning Paths
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Step-by-step paths to mastery · {allCourses.length} courses available · {totalEnrolled} enrolled
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchInputRef}
              id="course-search"
              type="text"
              placeholder="What do you want to learn? (press /)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-border bg-card/80 py-2.5 pl-9 pr-9 text-xs sm:text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary h-11 backdrop-blur-sm transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills (Minimal, Playful, Low-Distraction) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all shrink-0 border",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-sm scale-102"
                    : "bg-card text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground",
                )}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Loading skeleton */}
        {fetching && (
          <div className="space-y-6">
            {["s1", "s2"].map((s) => (
              <Skeleton key={s} className="h-72 w-full rounded-[28px]" />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !fetching && (
          <div className="flex flex-col items-center gap-4 rounded-[28px] border border-dashed p-12 text-center bg-card">
            <Search className="size-10 text-muted-foreground" />
            <div>
              <p className="font-bold text-foreground">{sanitizeGraphQLError(error).title}</p>
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
        {!fetching && !error && filteredPaths.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-[28px] border border-dashed p-12 text-center bg-card">
            <BookOpen className="size-10 text-muted-foreground" />
            <div>
              <p className="font-bold text-foreground">No matching learning paths</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try searching for another topic or switch categories.
              </p>
            </div>
            {search && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  setSearch("");
                  setActiveCategory("ALL");
                }}
              >
                Reset Search
              </Button>
            )}
          </div>
        )}

        {/* Learning Paths List */}
        {!fetching && !error && filteredPaths.length > 0 && (
          <div className="space-y-8">
            <div className="space-y-1">
              <h2 className="text-xl font-bold font-serif text-foreground">Your learning paths</h2>
            </div>

            {filteredPaths.map((path) => (
              <LearningPathRibbon
                key={path.id}
                path={path}
                onSelectCourse={(courseId) => setSelectedCourseId(courseId)}
              />
            ))}
          </div>
        )}

        {/* Right-side Detail Sheet for Course */}
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
        className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm"
      />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 z-50 h-full w-full sm:w-[440px] bg-card/95 backdrop-blur-md border-l shadow-2xl overflow-y-auto p-6 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between border-b pb-4 mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Learning Path Milestone
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
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
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-0.5 rounded-full">
                  {course.gradeLevel}
                </span>
                <h2 className="text-2xl font-serif font-bold text-foreground">{course.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{course.description}</p>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Interactive Waves &amp; Challenges
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
                        <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                          <BookOpen className="size-4 text-primary shrink-0" />
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
                                      <CheckCircle className="size-3.5 text-emerald-500 shrink-0" />
                                    ) : (
                                      <Play className="size-3.5 text-muted-foreground/60 shrink-0" />
                                    )}
                                    Wave {wIdx + 1}: {wave.title}
                                  </span>
                                  <span className="text-[10px] tabular-nums font-bold bg-muted px-2 py-0.5 rounded-full">
                                    +{wave.xpReward} XP
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
            </div>
          )}
        </div>

        {course && (
          <div className="border-t pt-6 mt-6 flex flex-col gap-3">
            {isEnrolled ? (
              <Link to="/courses/$courseId" params={{ courseId: course.id }}>
                <Button className="w-full rounded-full h-11 font-bold text-sm" onClick={onClose}>
                  Continue Learning
                </Button>
              </Link>
            ) : isAuthenticated ? (
              <Button
                className="w-full rounded-full h-11 font-bold text-sm bg-primary hover:bg-primary/90"
                onClick={handleEnroll}
                disabled={enrollResult.fetching}
              >
                {enrollResult.fetching ? "Enrolling..." : "Enroll for Free"}
              </Button>
            ) : (
              <Link to="/login">
                <Button className="w-full rounded-full h-11 font-bold text-sm">Sign in to Enroll</Button>
              </Link>
            )}
          </div>
        )}
      </motion.div>
    </>
  );
}
