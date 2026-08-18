import { Link } from "@tanstack/react-router";
import { CheckCircle2, Play, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { DepthCarousel } from "@/components/ui/DepthCarousel";
import { Button } from "@/components/ui/button";

export interface DeckCourseItem {
  id: string;
  slug: string;
  title: string;
  badge: string;
  badgeType?: "recommended" | "popular" | "level";
  levelName: string;
  accentColor: string;
  illustrationUrl?: string;
  waves: {
    title: string;
    isCompleted?: boolean;
    isActive?: boolean;
    xp: number;
  }[];
  duration: string;
  totalXp: number;
}

const SAMPLE_DECK_COURSES: DeckCourseItem[] = [
  {
    id: "thinking-in-python",
    slug: "thinking-in-python",
    title: "Thinking in Python",
    badge: "RECOMMENDED",
    badgeType: "recommended",
    levelName: "LEVEL 1",
    accentColor: "from-purple-600/20 to-indigo-600/20",
    illustrationUrl: "/covers/thinking-in-python.jpg",
    waves: [
      { title: "Warm Up", isCompleted: true, xp: 15 },
      { title: "Updating Variables", isActive: true, xp: 25 },
    ],
    duration: "10 min",
    totalXp: 40,
  },
  {
    id: "fractions-foundations",
    slug: "fractions-foundations",
    title: "Fractions",
    badge: "LEVEL 1",
    badgeType: "level",
    levelName: "LEVEL 1",
    accentColor: "from-blue-600/20 to-cyan-600/20",
    illustrationUrl: "/covers/coordinate-geometry.jpg",
    waves: [
      { title: "Warm Up", isCompleted: true, xp: 15 },
      { title: "Splitting Parts", isActive: true, xp: 20 },
    ],
    duration: "8 min",
    totalXp: 35,
  },
  {
    id: "programming-variables",
    slug: "python-10-challenges",
    title: "Programming with Variables",
    badge: "POPULAR",
    badgeType: "popular",
    levelName: "LEVEL 1",
    accentColor: "from-violet-600/20 to-purple-600/20",
    illustrationUrl: "/covers/python-10-challenges.jpg",
    waves: [
      { title: "Writing Programs", isCompleted: false, isActive: true, xp: 20 },
      { title: "Using Variables", isCompleted: false, xp: 25 },
    ],
    duration: "12 min",
    totalXp: 45,
  },
  {
    id: "coordinate-geometry",
    slug: "coordinate-geometry",
    title: "Coordinate Geometry",
    badge: "GRADE 10 · O/L",
    badgeType: "level",
    levelName: "LEVEL 2",
    accentColor: "from-emerald-600/20 to-teal-600/20",
    illustrationUrl: "/covers/g10-mathematics.jpg",
    waves: [
      { title: "Plotting Points in 2D", isCompleted: true, xp: 15 },
      { title: "Linear Equations & Slope", isActive: true, xp: 30 },
    ],
    duration: "14 min",
    totalXp: 45,
  },
  {
    id: "al-physics",
    slug: "al-physics",
    title: "A/L Physics & Mechanics",
    badge: "ADVANCED · A/L",
    badgeType: "recommended",
    levelName: "LEVEL 3",
    accentColor: "from-amber-600/20 to-orange-600/20",
    illustrationUrl: "/covers/al-physics.jpg",
    waves: [
      { title: "2D Kinematics Vectors", isCompleted: false, isActive: true, xp: 25 },
      { title: "Newtonian Dynamics", isCompleted: false, xp: 35 },
    ],
    duration: "15 min",
    totalXp: 60,
  },
];

export function CourseDepthDeck() {
  const [activeIndex, setActiveIndex] = useState(0);

  const carouselItems = SAMPLE_DECK_COURSES.map((course) => ({
    content: (
      <div className="relative flex size-full flex-col justify-between overflow-hidden rounded-3xl border border-border/70 bg-card p-6 text-foreground shadow-xl backdrop-blur-md">
        {/* Subtle Ambient Top Radial Glow */}
        <div
          className={`pointer-events-none absolute -top-12 -inset-x-12 h-36 bg-gradient-to-b ${course.accentColor} opacity-40 blur-2xl`}
        />

        {/* Top Header Badge Row */}
        <div className="relative z-10 flex flex-col items-center space-y-1">
          {course.badgeType === "recommended" ? (
            <span className="flex items-center gap-1 rounded-full bg-purple-500/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-purple-600 dark:text-purple-300 border border-purple-400/30">
              <Sparkles className="size-2.5" /> {course.badge}
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground border border-border/40">
              {course.badge}
            </span>
          )}

          <h3 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl text-center line-clamp-1">
            {course.title}
          </h3>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            {course.levelName}
          </span>
        </div>

        {/* Center Illustration Artwork */}
        <div className="relative z-10 my-auto flex size-28 mx-auto items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-muted/40 shadow-inner">
          {course.illustrationUrl ? (
            <img
              src={course.illustrationUrl}
              alt={course.title}
              className="size-full object-cover"
            />
          ) : (
            <div className="size-16 rounded-full bg-primary/20" />
          )}
        </div>

        {/* Interactive Waves Checklist */}
        <div className="relative z-10 space-y-2 rounded-2xl border border-border/50 bg-muted/30 p-3.5 backdrop-blur-xs">
          {course.waves.map((w, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {w.isCompleted ? (
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                ) : w.isActive ? (
                  <div className="size-4 rounded-full border-2 border-primary flex items-center justify-center">
                    <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                  </div>
                ) : (
                  <div className="size-4 rounded-full border border-muted-foreground/40" />
                )}
                <span
                  className={`font-semibold ${
                    w.isActive ? "text-foreground font-bold" : "text-muted-foreground"
                  }`}
                >
                  {w.title}
                </span>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground">+{w.xp} XP</span>
            </div>
          ))}
        </div>

        {/* Primary CTA Start Button */}
        <div className="relative z-10 pt-3">
          <Link to="/courses/$courseId" params={{ courseId: course.id }}>
            <Button className="w-full rounded-full h-11 font-bold text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
              <Play className="size-3.5 fill-current mr-1.5" /> Start Wave ({course.duration})
            </Button>
          </Link>
        </div>
      </div>
    ),
  }));

  return (
    <div className="relative w-full overflow-hidden rounded-[32px] border border-border/60 bg-card p-6 sm:p-8 backdrop-blur-md shadow-sm">
      {/* Hero Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary">
              Active Focus Deck
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              3D Swappable Stack
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-foreground">
            Continue where you left off
          </h2>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-full border border-border/40">
          <Zap className="size-3.5 fill-amber-400 text-amber-400" />
          <span>Swipe or click to swap</span>
        </div>
      </div>

      {/* 3D Depth Carousel Stack */}
      <div className="h-[490px] w-full relative">
        <DepthCarousel
          items={carouselItems}
          cardWidth={330}
          cardHeight={450}
          depth={170}
          spread={75}
          tilt={16}
          tiltDirection="right"
          perspective={1300}
          visibleCards={3}
          falloff={0.15}
          blur={2}
          showControls={true}
          showIndicators={false}
          activeIndex={activeIndex}
          onChange={(idx) => setActiveIndex(idx)}
        />
      </div>

      {/* Quick-Selector Icon Toolbar */}
      <div className="mt-4 flex items-center justify-center gap-3 overflow-x-auto pb-1 no-scrollbar">
        {SAMPLE_DECK_COURSES.map((course, idx) => {
          const isSelected = activeIndex === idx;
          return (
            <button
              key={course.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`group relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border transition-all duration-200 ${
                isSelected
                  ? "border-primary bg-primary/20 shadow-md ring-2 ring-primary/40 scale-108"
                  : "border-border/60 bg-muted/40 hover:bg-muted/70 hover:scale-105"
              }`}
              aria-label={`Jump to ${course.title}`}
            >
              {course.illustrationUrl ? (
                <img
                  src={course.illustrationUrl}
                  alt={course.title}
                  className="size-full object-cover"
                />
              ) : (
                <div className="size-4 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
