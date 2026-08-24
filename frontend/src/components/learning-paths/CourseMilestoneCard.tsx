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
    <motion.div
      // The end-to-end suite reaches student course cards through this hook,
      // exactly as it does the educator list.
      data-testid="course-card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onClick}
      className="group relative flex flex-col items-center cursor-pointer shrink-0 w-[170px] sm:w-[190px]"
    >
      {/* Squircle Card Container */}
      <div
        className={cn(
          "relative flex h-[190px] w-full flex-col justify-between rounded-3xl border border-border/80 bg-card p-3.5 shadow-sm transition-all duration-300 backdrop-blur-sm",
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
            <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
              <Sparkles className="size-2.5" /> NEW
            </span>
          ) : isEnrolled ? (
            <span className="flex items-center gap-0.5 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-extrabold text-primary">
              <CheckCircle2 className="size-2.5" /> {percent}%
            </span>
          ) : null}
        </div>

        {/* Center 3D Icon / Cover */}
        <div className="relative my-auto flex size-24 items-center justify-center overflow-hidden rounded-2xl bg-muted/40 shadow-inner group-hover:scale-105 transition-transform duration-300">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={course.title}
              className={cn(
                "size-full rounded-2xl transition-transform duration-300",
                coverUrl.includes("/courses/python/")
                  ? "object-contain p-1 drop-shadow-sm"
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
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${isEnrolled ? Math.max(8, percent) : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Course Title Below Card */}
      <h3 className="mt-2.5 w-full text-center text-xs font-bold text-foreground transition-colors group-hover:text-primary line-clamp-2 px-1">
        {course.title}
      </h3>
    </motion.div>
  );
}

function formatGrade(grade: string): string {
  if (grade.startsWith("GRADE_")) {
    return `GR ${grade.replace("GRADE_", "")}`;
  }
  if (grade === "OL") return "O/L";
  if (grade === "AL") return "A/L";
  return grade;
}

function DefaultSubjectIcon({ title }: { title: string }) {
  const t = title.toLowerCase();
  if (t.includes("math") || t.includes("geometry") || t.includes("algebra")) {
    return (
      <svg viewBox="0 0 64 64" className="size-full">
        <rect x="12" y="12" width="40" height="40" rx="10" fill="#3b82f6" opacity="0.2" />
        <path
          d="M 22,44 L 42,20 M 24,24 L 28,24 M 36,40 L 40,40"
          stroke="#3b82f6"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (t.includes("python") || t.includes("code") || t.includes("cs")) {
    return (
      <svg viewBox="0 0 64 64" className="size-full">
        <rect x="12" y="12" width="40" height="40" rx="10" fill="#a855f7" opacity="0.2" />
        <path
          d="M 24,26 L 16,32 L 24,38 M 40,26 L 48,32 L 40,38"
          stroke="#a855f7"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (t.includes("science") || t.includes("gear") || t.includes("physic")) {
    return (
      <svg viewBox="0 0 64 64" className="size-full">
        <rect x="12" y="12" width="40" height="40" rx="10" fill="#f59e0b" opacity="0.2" />
        <circle
          cx="32"
          cy="32"
          r="14"
          fill="#f59e0b"
          fillOpacity="0.3"
          stroke="#f59e0b"
          strokeWidth="3"
        />
        <circle cx="32" cy="32" r="5" fill="#f59e0b" />
        <path
          d="M 32,14 L 32,18 M 32,46 L 32,50 M 14,32 L 18,32 M 46,32 L 50,32 M 19,19 L 22,22 M 42,42 L 45,45 M 19,45 L 22,42 M 42,22 L 45,19"
          stroke="#f59e0b"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" className="size-full">
      <rect x="12" y="12" width="40" height="40" rx="10" fill="#10b981" opacity="0.2" />
      <circle cx="32" cy="32" r="12" fill="#10b981" />
    </svg>
  );
}
