import { Link } from "@tanstack/react-router";
import { motion, type PanInfo } from "framer-motion";
import { CheckCircle2, ChevronLeft, ChevronRight, Play, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface DeckCardData {
  id: string;
  slug: string;
  title: string;
  badge?: string;
  badgeType?: "recommended" | "popular" | "level";
  levelName: string;
  illustrationUrl?: string;
  illustrationSvg?: React.ReactNode;
  iconUrl?: string;
  steps: {
    title: string;
    isCompleted?: boolean;
    isActive?: boolean;
    xp?: number;
  }[];
  isCompleted?: boolean;
  ctaText?: string;
}

const DEFAULT_DECK_CARDS: DeckCardData[] = [
  {
    id: "fractions",
    slug: "fractions",
    title: "Fractions",
    levelName: "LEVEL 1",
    illustrationUrl: "/covers/coordinate-geometry.jpg",
    illustrationSvg: (
      <svg viewBox="0 0 160 160" className="size-full">
        {/* Fractions Easel Illustration */}
        <rect x="35" y="25" width="90" height="75" rx="8" fill="#3b82f6" />
        <rect x="42" y="32" width="36" height="30" fill="#60a5fa" />
        <rect x="42" y="64" width="18" height="30" fill="#ffffff" />
        <rect x="60" y="64" width="18" height="30" fill="#1d4ed8" />
        <rect x="80" y="32" width="38" height="62" fill="#2563eb" />
        <circle cx="98" cy="74" r="10" fill="#fbbf24" />
        <circle cx="106" cy="80" r="5" fill="#ffffff" />
        {/* Easel Legs */}
        <line x1="50" y1="100" x2="40" y2="135" stroke="#92400e" strokeWidth="5" strokeLinecap="round" />
        <line x1="80" y1="100" x2="80" y2="135" stroke="#78350f" strokeWidth="5" strokeLinecap="round" />
        <line x1="110" y1="100" x2="120" y2="135" stroke="#92400e" strokeWidth="5" strokeLinecap="round" />
        <rect x="30" y="98" width="100" height="6" rx="3" fill="#b45309" />
      </svg>
    ),
    steps: [
      { title: "Warm Up", isCompleted: true, xp: 15 },
      { title: "Splitting Parts", isActive: true, xp: 20 },
    ],
    ctaText: "Start",
  },
  {
    id: "thinking-in-python",
    slug: "thinking-in-python",
    title: "Thinking in Python",
    levelName: "LEVEL 1",
    illustrationUrl: "/covers/thinking-in-python.jpg",
    illustrationSvg: (
      <svg viewBox="0 0 160 160" className="size-full">
        {/* Purple Snake on Laptop Illustration */}
        <path
          d="M 40,110 C 20,80 50,40 85,45 C 115,50 125,75 110,105 C 95,120 60,115 50,95 C 45,75 75,70 90,80"
          stroke="#8b5cf6"
          strokeWidth="16"
          strokeLinecap="round"
          fill="none"
        />
        {/* Laptop */}
        <rect x="75" y="85" width="45" height="30" rx="3" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
        <rect x="65" y="115" width="65" height="5" rx="2" fill="#334155" />
        {/* Snake Eyes & Tongue */}
        <circle cx="115" cy="85" r="2.5" fill="#ffffff" />
        <path d="M 125,86 L 133,86" stroke="#ef4444" strokeWidth="2" />
      </svg>
    ),
    steps: [
      { title: "Warm Up", isCompleted: true, xp: 15 },
      { title: "Updating Variables", isActive: true, xp: 25 },
    ],
    ctaText: "Start",
  },
  {
    id: "logic-structures",
    slug: "coordinate-geometry",
    title: "Logic & Coordinate Systems",
    levelName: "LEVEL 1",
    illustrationUrl: "/covers/g10-mathematics.jpg",
    illustrationSvg: (
      <svg viewBox="0 0 160 160" className="size-full">
        {/* Golden Ratio / Coordinate Grid Target */}
        <rect x="30" y="30" width="100" height="100" rx="12" fill="#f59e0b" opacity="0.15" />
        <line x1="30" y1="80" x2="130" y2="80" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="80" y1="30" x2="80" y2="130" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="80" cy="80" r="32" stroke="#f59e0b" strokeWidth="3" fill="none" />
        <circle cx="100" cy="60" r="6" fill="#f59e0b" />
        <circle cx="100" cy="60" r="2" fill="#ffffff" />
      </svg>
    ),
    steps: [
      { title: "Grid Coordinates", isCompleted: false, isActive: true, xp: 20 },
      { title: "Cartesian Mapping", isCompleted: false, xp: 25 },
    ],
    ctaText: "Start",
  },
  {
    id: "thinking-in-code",
    slug: "python-10-challenges",
    title: "Thinking in Code",
    levelName: "LEVEL 1",
    illustrationUrl: "/covers/python-10-challenges.jpg",
    illustrationSvg: (
      <svg viewBox="0 0 160 160" className="size-full">
        {/* Code Blocks & Cursor Hand */}
        <rect x="35" y="35" width="90" height="30" rx="6" fill="#facc15" />
        <rect x="42" y="47" width="40" height="6" rx="3" fill="#ca8a04" />
        <rect x="45" y="70" width="75" height="30" rx="6" fill="#a855f7" />
        <rect x="40" y="105" width="30" height="24" rx="4" fill="#334155" />
        <polygon points="50,112 62,117 50,122" fill="#ffffff" />
        <rect x="75" y="105" width="48" height="24" rx="4" fill="#e2e8f0" />
        <line x1="83" y1="117" x2="95" y2="117" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
        <line x1="89" y1="111" x2="89" y2="123" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
    steps: [{ title: "Writing Programs", isCompleted: true, xp: 30 }],
    isCompleted: true,
    ctaText: "Continue course",
  },
  {
    id: "programming-variables",
    slug: "thinking-in-python",
    title: "Programming with Variables",
    badge: "RECOMMENDED",
    badgeType: "recommended",
    levelName: "LEVEL 1",
    illustrationUrl: "/covers/thinking-in-python.jpg",
    illustrationSvg: (
      <svg viewBox="0 0 160 160" className="size-full">
        {/* 3D Printer Building Apple */}
        <rect x="40" y="35" width="80" height="90" rx="10" fill="#7c3aed" />
        <rect x="52" y="47" width="56" height="52" rx="6" fill="#ffffff" />
        {/* Apple building */}
        <circle cx="80" cy="74" r="15" fill="#eab308" />
        <path d="M 80,59 Q 82,54 86,52" stroke="#65a30d" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Nozzle */}
        <polygon points="76,47 84,47 80,54" fill="#334155" />
        <rect x="52" y="107" width="40" height="5" rx="2.5" fill="#a78bfa" />
        <circle cx="102" cy="110" r="3" fill="#a78bfa" />
      </svg>
    ),
    steps: [
      { title: "Writing Programs", isCompleted: false, isActive: true, xp: 20 },
      { title: "Using Variables", isCompleted: false, xp: 25 },
    ],
    ctaText: "Start",
  },
];

export function BilateralCardDeck() {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = DEFAULT_DECK_CARDS.length;

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if ((offset < -50 || velocity < -300) && activeIndex < total - 1) {
      setActiveIndex((prev) => prev + 1);
    } else if ((offset > 50 || velocity > 300) && activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (activeIndex < total - 1) setActiveIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (activeIndex > 0) setActiveIndex((prev) => prev - 1);
  };

  return (
    <div className="relative w-full flex flex-col items-center select-none">
      {/* Outer Card Deck Stage */}
      <div className="relative flex min-h-[510px] w-full max-w-[460px] items-center justify-center py-4">
        {/* Left stack cards (i < activeIndex), Active card (i === activeIndex), Right stack cards (i > activeIndex) */}
        {DEFAULT_DECK_CARDS.map((card, i) => {
          const diff = i - activeIndex; // negative = left stack, 0 = active, positive = right stack
          const isCurrent = diff === 0;
          const isLeft = diff < 0;
          const isRight = diff > 0;

          // Bilateral Stacking Transforms:
          // Left stack offsets to the left; Right stack offsets to the right!
          let xOffset = 0;
          let scale = 1;
          let zIndex = 20 - Math.abs(diff) * 2;
          let opacity = 1;
          let rotate = 0;

          if (isLeft) {
            // Stacked behind on the LEFT
            xOffset = diff * 16 - 8;
            scale = Math.max(0.85, 1 - Math.abs(diff) * 0.04);
            opacity = Math.max(0.3, 1 - Math.abs(diff) * 0.25);
            rotate = diff * 1.5;
          } else if (isRight) {
            // Stacked behind on the RIGHT
            xOffset = diff * 16 + 8;
            scale = Math.max(0.85, 1 - Math.abs(diff) * 0.04);
            opacity = Math.max(0.3, 1 - Math.abs(diff) * 0.25);
            rotate = diff * 1.5;
          }

          // Only render visible cards within +/- 2 distance to maintain high performance
          if (Math.abs(diff) > 2) return null;

          return (
            <motion.div
              key={card.id}
              className="absolute top-4 inset-x-0 mx-auto flex w-full max-w-[440px] flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 text-foreground shadow-xl transition-colors backdrop-blur-md"
              style={{
                zIndex,
                height: "480px",
              }}
              initial={false}
              animate={{
                x: xOffset,
                scale,
                opacity,
                rotate,
              }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 24,
              }}
              drag={isCurrent ? "x" : false}
              dragConstraints={{ left: -100, right: 100 }}
              dragElastic={0.25}
              onDragEnd={isCurrent ? handleDragEnd : undefined}
            >
              {/* Top Level / Recommendation Badge */}
              <div className="flex flex-col items-center space-y-1">
                {card.badge && (
                  <span className="flex items-center gap-1 rounded-full bg-purple-500/15 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-purple-600 dark:text-purple-300 border border-purple-400/30">
                    <Sparkles className="size-2.5" /> {card.badge}
                  </span>
                )}
                <h2 className="text-2xl font-serif font-bold text-foreground tracking-tight text-center">
                  {card.title}
                </h2>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  {card.levelName}
                </span>
              </div>

              {/* Center 3D Illustration Graphic */}
              <div className="my-auto flex size-36 mx-auto items-center justify-center p-1">
                {card.illustrationSvg}
              </div>

              {/* Interactive Step Milestone Checklist */}
              <div className="space-y-2 rounded-2xl border border-border/50 bg-muted/30 p-3.5 backdrop-blur-xs">
                {card.steps.map((step, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2.5">
                      {step.isCompleted ? (
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      ) : step.isActive ? (
                        <div className="size-4 rounded-full border-2 border-primary flex items-center justify-center">
                          <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                        </div>
                      ) : (
                        <div className="size-4 rounded-full border border-muted-foreground/40" />
                      )}
                      <span
                        className={`font-semibold ${
                          step.isActive
                            ? "text-foreground font-bold"
                            : step.isCompleted
                              ? "text-muted-foreground"
                              : "text-muted-foreground/70"
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>

                    {step.xp && (
                      <span className="text-[11px] font-bold text-muted-foreground">
                        +{step.xp} XP
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Primary Action Button */}
              <div className="pt-3">
                <Link to="/courses/$courseId" params={{ courseId: card.id }}>
                  <Button className="w-full rounded-full h-12 font-bold text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
                    <Play className="size-3.5 fill-current mr-2" /> {card.ctaText || "Start"}
                  </Button>
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom 5-Icon Quick Selector Toolbar (Images 1, 2, 3, 4) */}
      <div className="mt-4 flex items-center justify-center gap-3">
        {/* Left Arrow */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={activeIndex === 0}
          className="flex size-9 items-center justify-center rounded-full border border-border/60 bg-card text-foreground transition-all hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
          aria-label="Previous card"
        >
          <ChevronLeft className="size-4" />
        </button>

        {/* 5 Squircle Thumbnails */}
        {DEFAULT_DECK_CARDS.map((card, idx) => {
          const isSelected = activeIndex === idx;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`group relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border transition-all duration-200 ${
                isSelected
                  ? "border-primary bg-primary/15 shadow-md ring-2 ring-primary/40 scale-108"
                  : "border-border/60 bg-card hover:bg-muted/60 hover:scale-105"
              }`}
              aria-label={`Select ${card.title}`}
            >
              <div className="size-8 p-0.5">{card.illustrationSvg}</div>

              {card.isCompleted && (
                <span className="absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <CheckCircle2 className="size-2.5" />
                </span>
              )}
            </button>
          );
        })}

        {/* Right Arrow */}
        <button
          type="button"
          onClick={handleNext}
          disabled={activeIndex === total - 1}
          className="flex size-9 items-center justify-center rounded-full border border-border/60 bg-card text-foreground transition-all hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
          aria-label="Next card"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
