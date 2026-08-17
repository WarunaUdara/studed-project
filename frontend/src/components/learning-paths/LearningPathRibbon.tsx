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
  const completedWaves = path.courses.reduce((acc, c) => acc + (c.myProgress?.completedWaves ?? 0), 0);
  const overallPercent = totalWaves > 0 ? Math.round((completedWaves / totalWaves) * 100) : 0;

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -280 : 280;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <div className="relative rounded-[28px] border border-border/50 bg-muted/20 p-6 sm:p-8 backdrop-blur-sm transition-all hover:border-border/80">
      {/* Track Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-start gap-4">
          {/* 3D Category Icon */}
          <div className="shrink-0 pt-0.5">
            {path.category === "MATH" && <MathIsometricIcon className="size-12 drop-shadow-sm" />}
            {path.category === "CS" && <CodeIsometricIcon className="size-12 drop-shadow-sm" />}
            {path.category === "SCIENCE" && <ScienceIsometricIcon className="size-12 drop-shadow-sm" />}
            {path.category === "LANGUAGES" && <LanguageIsometricIcon className="size-12 drop-shadow-sm" />}
          </div>

          {/* Title & Subhead */}
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary/80 block">
              {path.levelBadge}
            </span>
            <h2 className="text-xl font-bold font-serif tracking-tight text-foreground sm:text-2xl">
              {path.title}
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm max-w-xl">
              {path.subtitle}
            </p>
          </div>
        </div>

        {/* Right Stats & Bookmark */}
        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
          {enrolledCourses.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-background/80 px-3.5 py-1 text-xs font-bold text-muted-foreground border border-border/50 shadow-xs">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              <span>{overallPercent}% complete</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsStarred(!isStarred)}
            className="flex size-9 items-center justify-center rounded-full border border-border/50 bg-background/80 text-muted-foreground transition-all hover:scale-105 hover:text-amber-400"
            aria-label="Star learning path"
          >
            <Star
              className={`size-4 ${isStarred ? "fill-amber-400 text-amber-400" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Connected Milestone Track & Horizontal Scroll Carousel */}
      <div className="relative group/track">
        {/* Milestone Connecting Track Line */}
        <div className="absolute top-[96px] left-6 right-6 h-1 rounded-full bg-border/40 -z-0 pointer-events-none hidden sm:block" />

        {/* Left Scroll Chevron */}
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute -left-3.5 top-[76px] z-20 flex size-9 items-center justify-center rounded-full border border-border/60 bg-background/90 text-foreground shadow-md backdrop-blur-sm transition-all hover:scale-110 active:scale-95 opacity-0 group-hover/track:opacity-100 disabled:opacity-0"
          aria-label="Scroll left"
        >
          <ChevronLeft className="size-5" />
        </button>

        {/* Right Scroll Chevron */}
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute -right-3.5 top-[76px] z-20 flex size-9 items-center justify-center rounded-full border border-border/60 bg-background/90 text-foreground shadow-md backdrop-blur-sm transition-all hover:scale-110 active:scale-95 opacity-0 group-hover/track:opacity-100"
          aria-label="Scroll right"
        >
          <ChevronRight className="size-5" />
        </button>

        {/* Milestone Cards Container */}
        <div
          ref={scrollRef}
          className="flex items-start gap-5 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth"
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
