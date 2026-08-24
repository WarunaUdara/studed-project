import { motion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CourseNode } from "./types";

const KNOWN_COVERS: Record<string, string> = {
  "coordinate-geometry": "/covers/coordinate-geometry.jpg",
  "g10-mathematics": "/covers/g10-mathematics.jpg",
  "thinking-in-python": "/courses/python/thinking-in-python.png",
  "functions-in-python": "/courses/python/functions-in-python.png",
  "recursion-in-python": "/courses/python/recursion-in-python.png",
  "algorithms-in-python": "/courses/python/algorithms-in-python.png",
  "oop-in-python": "/courses/python/oop-in-python.png",
  "object-oriented-programming-in-python": "/courses/python/oop-in-python.png",
  "data-structures-in-python": "/courses/python/data-structures-in-python.png",
  "python-10-challenges": "/courses/python/functions-in-python.png",
  "al-physics": "/covers/al-physics.jpg",
  "g10-science": "/covers/g10-science.jpg",
  "ol-english": "/covers/ol-english.jpg",
};

interface CourseMilestoneCardProps {
  course: CourseNode;
  onClick: () => void;
  index: number;
}

export function CourseMilestoneCard({ course, onClick, index }: CourseMilestoneCardProps) {
  const isEnrolled = course.myProgress !== null && course.myProgress !== undefined;
  const completed = course.myProgress?.completedWaves ?? 0;
  const total = course.myProgress?.totalWaves ?? 0;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const coverUrl = KNOWN_COVERS[course.slug];

  return (
    <motion.button
      type="button"
      data-testid="course-card"
      aria-label={`View ${course.title} course details`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      onClick={onClick}
      className="group relative flex w-[165px] shrink-0 snap-start cursor-pointer flex-col items-center rounded-[22px] text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] sm:w-[180px]"
    >
      {/* Deep Dark Squircle Card Container */}
      <div
        className={cn(
          "relative flex h-[180px] w-full flex-col justify-between rounded-[22px] border border-border/80 bg-background/95 p-3.5 shadow-sm transition-all duration-200 backdrop-blur-sm",
          "hover:-translate-y-1.5 hover:shadow-xl hover:border-white/20",
          isEnrolled && "border-border",
        )}
      >
        {/* Top Strip */}
        <div className="flex items-center justify-between w-full">
          <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase bg-muted/60 px-2 py-0.5 rounded-full">
            {formatGrade(course.gradeLevel)}
          </span>

          {course.isNew ? (
            <span className="flex items-center gap-0.5 rounded-full bg-emerald-500 text-black px-2 py-0.5 text-[10px] font-black uppercase tracking-tight shadow-2xs">
              <Sparkles className="size-2.5" /> NEW
            </span>
          ) : isEnrolled ? (
            <span className="flex items-center gap-0.5 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-extrabold text-primary">
              <CheckCircle2 className="size-2.5" /> {percent}%
            </span>
          ) : null}
        </div>

        {/* Center Mascot / Artwork Icon */}
        <div className="relative my-auto flex size-24 items-center justify-center overflow-hidden rounded-2xl bg-muted/30 shadow-inner group-hover:scale-105 transition-transform duration-300">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={course.title}
              className={cn(
                "size-full rounded-2xl transition-transform duration-300",
                coverUrl.includes("/courses/python/")
                  ? "object-contain p-1.5 drop-shadow-md"
                  : "object-cover",
              )}
              loading="lazy"
            />
          ) : (
            <div className="flex size-full items-center justify-center p-3">
              <DefaultSubjectIcon title={course.title} />
            </div>
          )}
        </div>

        {/* Bottom Progress Bar */}
        <div className="w-full">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${isEnrolled ? Math.max(8, percent) : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Course Title Below Card */}
      <h3 className="mt-2.5 w-full text-center text-xs font-semibold text-foreground/90 transition-colors group-hover:text-foreground line-clamp-2 px-1">
        {course.title}
      </h3>
    </motion.button>
  );
}

function formatGrade(grade: string): string {
  if (grade.startsWith("GRADE_")) {
    const num = grade.replace("GRADE_", "");
    if (num === "6_8" || num === "68") return "GR 6–8";
    if (num === "9_11" || num === "911") return "GR 9–11";
    if (num === "4_5" || num === "45") return "GR 4–5";
    return `GR ${num}`;
  }
  if (grade === "OL") return "O/L";
  if (grade === "AL") return "A/L";
  if (grade === "G10") return "GR 10";
  if (grade === "G9") return "GR 9";
  if (grade === "G5") return "GR 5";
  return grade;
}

function DefaultSubjectIcon({ title }: { title: string }) {
  const t = title.toLowerCase();
  if (t.includes("math") || t.includes("geometry") || t.includes("algebra")) {
    return (
      <svg viewBox="0 0 64 64" className="size-full text-primary" aria-hidden="true">
        <rect x="12" y="12" width="40" height="40" rx="10" fill="currentColor" opacity="0.2" />
        <path
          d="M 22,44 L 42,20 M 24,24 L 28,24 M 36,40 L 40,40"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (t.includes("python") || t.includes("code") || t.includes("cs")) {
    return (
      <svg viewBox="0 0 64 64" className="size-full text-secondary" aria-hidden="true">
        <rect x="12" y="12" width="40" height="40" rx="10" fill="currentColor" opacity="0.2" />
        <path
          d="M 24,26 L 16,32 L 24,38 M 40,26 L 48,32 L 40,38"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (t.includes("science") || t.includes("gear") || t.includes("physic")) {
    return (
      <svg viewBox="0 0 64 64" className="size-full text-success" aria-hidden="true">
        <rect x="12" y="12" width="40" height="40" rx="10" fill="currentColor" opacity="0.2" />
        <circle cx="32" cy="32" r="12" stroke="currentColor" strokeWidth="4" fill="none" />
        <path
          d="M 32,16 L 32,20 M 32,44 L 32,48 M 16,32 L 20,32 M 44,32 L 48,32"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" className="size-full text-gold" aria-hidden="true">
      <rect x="12" y="12" width="40" height="40" rx="10" fill="currentColor" opacity="0.2" />
      <path
        d="M 20,24 L 44,24 M 20,32 L 38,32 M 20,40 L 32,40"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
