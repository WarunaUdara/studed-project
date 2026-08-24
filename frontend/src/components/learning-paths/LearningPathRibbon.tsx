import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useRef, useState } from "react";
import { CourseMilestoneCard } from "./CourseMilestoneCard";
import {
  CodeIsometricIcon,
  LanguageIsometricIcon,
  MathIsometricIcon,
  ScienceIsometricIcon,
} from "./PathCategoryIcons";
import type { LearningPathDef } from "./types";

interface LearningPathRibbonProps {
  path: LearningPathDef;
  onSelectCourse: (courseId: string) => void;
}

export function LearningPathRibbon({ path, onSelectCourse }: LearningPathRibbonProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isStarred, setIsStarred] = useState(false);

  // Compute aggregate progress for the track
  const enrolledCourses = path.courses.filter((c) => c.myProgress != null);
  const totalWaves = path.courses.reduce((acc, c) => acc + (c.myProgress?.totalWaves ?? 0), 0);
  const completedWaves = path.courses.reduce(
    (acc, c) => acc + (c.myProgress?.completedWaves ?? 0),
    0,
  );
  const overallPercent = totalWaves > 0 ? Math.round((completedWaves / totalWaves) * 100) : 0;

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -280 : 280;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Track Header (Clear, spacious, outside the container) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-4">
          {/* 3D Category Icon */}
          <div className="shrink-0">
            {path.category === "MATH" && <MathIsometricIcon className="size-12 drop-shadow-sm" />}
            {path.category === "CS" && <CodeIsometricIcon className="size-12 drop-shadow-sm" />}
            {path.category === "SCIENCE" && (
              <ScienceIsometricIcon className="size-12 drop-shadow-sm" />
            )}
            {path.category === "LANGUAGES" && (
              <LanguageIsometricIcon className="size-12 drop-shadow-sm" />
            )}
          </div>

          {/* Title & Subhead */}
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              {path.levelBadge}
            </span>
            <h2 className="text-2xl font-bold font-serif tracking-tight text-foreground sm:text-3xl">
              {path.title}
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">{path.subtitle}</p>
          </div>
        </div>

        {/* Right Stats & Bookmark */}
        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
          <div className="flex items-center gap-1.5 rounded-full bg-card/80 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground border border-border/60 shadow-2xs">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {enrolledCourses.length > 0 ? `${overallPercent}% complete` : "0% complete"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsStarred(!isStarred)}
            className="flex size-9 items-center justify-center rounded-full border border-border/60 bg-card/80 text-muted-foreground transition-all hover:scale-105 hover:text-amber-400"
            aria-label="Star learning path"
          >
            <Star className={`size-4 ${isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Elevated Slate Container Box for Milestone Cards */}
      <div className="relative rounded-[28px] sm:rounded-[32px] border border-border/70 bg-card p-6 sm:p-8 backdrop-blur-md shadow-sm">
        {/* Milestone Connecting Track Line */}
        <div className="absolute top-[96px] left-8 right-8 h-0.5 bg-border/40 pointer-events-none hidden sm:block" />

        {/* Left Scroll Chevron */}
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute -left-3.5 top-[80px] z-20 flex size-9 items-center justify-center rounded-full border border-border/80 bg-card text-foreground shadow-md backdrop-blur-sm transition-all hover:scale-110 active:scale-95"
          aria-label="Scroll left"
        >
          <ChevronLeft className="size-5" />
        </button>

        {/* Right Scroll Chevron */}
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute -right-3.5 top-[80px] z-20 flex size-9 items-center justify-center rounded-full border border-border/80 bg-card text-foreground shadow-md backdrop-blur-sm transition-all hover:scale-110 active:scale-95"
          aria-label="Scroll right"
        >
          <ChevronRight className="size-5" />
        </button>

        {/* Milestone Cards Horizontal Carousel (no-scrollbar hides default scrollbar) */}
        <div
          ref={scrollRef}
          className="flex items-start gap-5 overflow-x-auto pb-1 pt-1 no-scrollbar scroll-smooth"
        >
          {path.courses.map((course, idx) => (
            <CourseMilestoneCard
              key={course.id}
              course={course}
              index={idx}
              onClick={() => onSelectCourse(course.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
