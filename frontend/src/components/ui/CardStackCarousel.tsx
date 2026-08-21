import { Link } from "@tanstack/react-router";
import { gsap } from "gsap";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Play,
  Sparkles,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface CardStackItem {
  id: string;
  slug: string;
  title: string;
  badge?: string;
  badgeType?: "recommended" | "popular" | "new" | "level";
  levelName: string;
  illustrationSvg?: React.ReactNode;
  steps: {
    title: string;
    isCompleted?: boolean;
    isActive?: boolean;
    xp?: number;
  }[];
  isCompleted?: boolean;
  ctaText?: string;
  accentColor?: string;
}

export interface CardStackCarouselProps {
  cards?: CardStackItem[];
  className?: string;
  autoplay?: boolean;
  autoplayInterval?: number;
  showNavigation?: boolean;
  showPagination?: boolean;
  onCardChange?: (card: CardStackItem, index: number) => void;
}

export const DEFAULT_STUDENT_CARDS: CardStackItem[] = [
  {
    id: "physics-forces",
    slug: "physics-grade-4-5",
    title: "Forces & Motion",
    badge: "RECOMMENDED",
    badgeType: "recommended",
    levelName: "GRADE 4–5 PHYSICS",
    accentColor: "from-amber-500/20 to-orange-500/10",
    illustrationSvg: (
      <svg viewBox="0 0 160 160" className="size-full">
        {/* Dynamic Force Balance & Pulley Scene */}
        <rect x="25" y="25" width="110" height="90" rx="12" fill="#f59e0b" opacity="0.12" />
        <circle cx="80" cy="55" r="22" fill="#d97706" opacity="0.25" />
        <circle cx="80" cy="55" r="16" fill="#b45309" />
        <circle cx="80" cy="55" r="5" fill="#ffffff" />
        {/* Tension Rope & Masses */}
        <path d="M 64,55 L 64,105 M 96,55 L 96,90" stroke="#f59e0b" strokeWidth="3" strokeDasharray="3 3" />
        <rect x="52" y="105" width="24" height="24" rx="4" fill="#3b82f6" />
        <text x="64" y="121" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">10N</text>
        <rect x="86" y="90" width="20" height="20" rx="4" fill="#10b981" />
        <text x="96" y="104" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">5N</text>
        {/* Upward Force Vector Arrow */}
        <path d="M 80,30 L 80,12 M 75,18 L 80,12 L 85,18" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    steps: [
      { title: "Push vs Pull Vectors", isCompleted: true, xp: 20 },
      { title: "Net Force Equilibrium", isActive: true, xp: 25 },
      { title: "Friction & Motion Lab", isCompleted: false, xp: 30 },
    ],
    ctaText: "Continue Lesson",
  },
  {
    id: "fractions-lab",
    slug: "fractions",
    title: "Fractions & Proportions",
    badge: "POPULAR",
    badgeType: "popular",
    levelName: "MATHEMATICS",
    accentColor: "from-blue-500/20 to-indigo-500/10",
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
      { title: "Splitting Units", isActive: true, xp: 20 },
      { title: "Equivalent Fractions", isCompleted: false, xp: 25 },
    ],
    ctaText: "Start Wave",
  },
  {
    id: "thinking-in-python",
    slug: "thinking-in-python",
    title: "Thinking in Python",
    badge: "NEW",
    badgeType: "new",
    levelName: "COMPUTER SCIENCE",
    accentColor: "from-purple-500/20 to-pink-500/10",
    illustrationSvg: (
      <svg viewBox="0 0 160 160" className="size-full">
        {/* Purple Snake on Laptop */}
        <path
          d="M 40,110 C 20,80 50,40 85,45 C 115,50 125,75 110,105 C 95,120 60,115 50,95 C 45,75 75,70 90,80"
          stroke="#8b5cf6"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />
        <rect x="75" y="85" width="45" height="30" rx="3" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
        <rect x="65" y="115" width="65" height="5" rx="2" fill="#334155" />
        <circle cx="115" cy="85" r="2.5" fill="#ffffff" />
        <path d="M 125,86 L 133,86" stroke="#ef4444" strokeWidth="2" />
      </svg>
    ),
    steps: [
      { title: "Variables & Types", isCompleted: true, xp: 20 },
      { title: "Logic Conditions", isActive: true, xp: 25 },
      { title: "Loop Iterations", isCompleted: false, xp: 30 },
    ],
    ctaText: "Code Now",
  },
  {
    id: "electric-circuits",
    slug: "physics-grade-4-5",
    title: "Electric Circuits & Ohm's Law",
    levelName: "PHYSICS EXPERIMENTS",
    accentColor: "from-emerald-500/20 to-teal-500/10",
    illustrationSvg: (
      <svg viewBox="0 0 160 160" className="size-full">
        {/* Circuit Board with Glowing Bulb */}
        <rect x="30" y="30" width="100" height="100" rx="16" fill="#047857" opacity="0.15" />
        <rect x="35" y="65" width="20" height="30" rx="4" fill="#0284c7" />
        <text x="45" y="84" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">9V</text>
        <path d="M 45,65 L 45,45 L 80,45" stroke="#10b981" strokeWidth="3" fill="none" />
        <path d="M 45,95 L 45,115 L 80,115" stroke="#10b981" strokeWidth="3" fill="none" />
        {/* Bulb */}
        <circle cx="80" cy="45" r="12" fill="#facc15" />
        <circle cx="80" cy="45" r="20" fill="#facc15" opacity="0.25" />
        <line x1="80" y1="45" x2="115" y2="45" stroke="#10b981" strokeWidth="3" />
        <line x1="80" y1="115" x2="115" y2="115" stroke="#10b981" strokeWidth="3" />
        {/* Switch */}
        <circle cx="115" cy="45" r="3" fill="#10b981" />
        <circle cx="115" cy="115" r="3" fill="#10b981" />
        <line x1="115" y1="45" x2="115" y2="115" stroke="#10b981" strokeWidth="3" strokeDasharray="4 4" />
      </svg>
    ),
    steps: [
      { title: "Current Flow", isCompleted: true, xp: 15 },
      { title: "Short Circuit Test", isCompleted: true, xp: 20 },
      { title: "Bulb Resistance", isActive: true, xp: 25 },
    ],
    ctaText: "Open Lab",
  },
  {
    id: "logic-structures",
    slug: "science-thinking",
    title: "Scientific Thinking & Gears",
    levelName: "LOGIC & REASONING",
    accentColor: "from-amber-500/20 to-yellow-500/10",
    illustrationSvg: (
      <svg viewBox="0 0 160 160" className="size-full">
        {/* Interlocking Gears */}
        <circle cx="65" cy="70" r="28" fill="#f59e0b" opacity="0.2" />
        <circle cx="65" cy="70" r="22" fill="#d97706" />
        <circle cx="65" cy="70" r="8" fill="#ffffff" />
        <circle cx="100" cy="95" r="22" fill="#2563eb" opacity="0.2" />
        <circle cx="100" cy="95" r="16" fill="#1d4ed8" />
        <circle cx="100" cy="95" r="6" fill="#ffffff" />
      </svg>
    ),
    steps: [
      { title: "Gear Train Parity", isCompleted: false, isActive: true, xp: 20 },
      { title: "Torque & Ratio", isCompleted: false, xp: 25 },
    ],
    ctaText: "Solve Puzzle",
  },
];

/**
 * CardStackCarousel — GSAP Physics-Driven 3D Swipeable Card Stack.
 * Supports smooth touch & pointer dragging, snap-back spring physics,
 * stack depth scaling, autoplay, and keyboard navigation.
 */
export function CardStackCarousel({
  cards = DEFAULT_STUDENT_CARDS,
  className,
  autoplay = false,
  autoplayInterval = 4500,
  showNavigation = true,
  showPagination = true,
  onCardChange,
}: CardStackCarouselProps) {
  const [deck, setDeck] = useState<CardStackItem[]>(cards);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const topCardRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const currentDeltaRef = useRef({ x: 0, y: 0 });
  const isAnimatingRef = useRef(false);

  // Sync deck if cards prop changes
  useEffect(() => {
    setDeck(cards);
  }, [cards]);

  /**
   * Layout cards with 3D stacked depth using GSAP.
   */
  const layoutStack = useCallback(
    (animate = true) => {
      if (!containerRef.current) return;
      const cardEls = containerRef.current.querySelectorAll<HTMLDivElement>(".gsap-card-stack-item");

      const reduced = prefersReducedMotion();

      cardEls.forEach((el, index) => {
        // Top card is index 0
        const isTop = index === 0;
        const depth = index;

        // Visual stack parameters
        const scale = Math.max(0.82, 1 - depth * 0.05);
        const yOffset = depth * 14;
        const rotateZ = depth === 0 ? 0 : depth % 2 === 1 ? -depth * 2.2 : depth * 2.2;
        const opacity = depth > 3 ? 0 : Math.max(0.35, 1 - depth * 0.2);
        const zIndex = 30 - depth * 5;

        if (!animate || reduced) {
          gsap.set(el, {
            scale,
            y: yOffset,
            x: 0,
            rotateZ,
            opacity,
            zIndex,
            pointerEvents: isTop ? "auto" : "none",
            transformOrigin: "center bottom",
          });
        } else {
          gsap.to(el, {
            scale,
            y: yOffset,
            x: 0,
            rotateZ,
            opacity,
            zIndex,
            duration: 0.45,
            ease: "power2.out",
            pointerEvents: isTop ? "auto" : "none",
            transformOrigin: "center bottom",
          });
        }
      });
    },
    []
  );

  // Initial layout
  useEffect(() => {
    layoutStack(false);
  }, [deck, layoutStack]);

  /**
   * Swipe top card off in a given direction (-1 for left, 1 for right).
   */
  const swipeCard = useCallback(
    (direction: 1 | -1) => {
      if (isAnimatingRef.current || deck.length <= 1) return;
      isAnimatingRef.current = true;

      const topCard = containerRef.current?.querySelector<HTMLDivElement>(".gsap-card-stack-item");
      if (!topCard) {
        isAnimatingRef.current = false;
        return;
      }

      const reduced = prefersReducedMotion();
      const flyX = direction * 420;
      const flyRotate = direction * 28;

      if (reduced) {
        // Instant cycle for reduced-motion
        setDeck((prev) => {
          const [first, ...rest] = prev;
          const updated = [...rest, first];
          onCardChange?.(updated[0], 0);
          return updated;
        });
        isAnimatingRef.current = false;
        return;
      }

      gsap.to(topCard, {
        x: flyX,
        rotateZ: flyRotate,
        opacity: 0,
        scale: 0.9,
        duration: 0.35,
        ease: "power2.in",
        onComplete: () => {
          setDeck((prev) => {
            const [first, ...rest] = prev;
            const updated = [...rest, first];
            onCardChange?.(updated[0], 0);
            return updated;
          });
          isAnimatingRef.current = false;
        },
      });
    },
    [deck.length, onCardChange]
  );

  /**
   * Go to previous card (reverse cycle: move last card to top).
   */
  const prevCard = useCallback(() => {
    if (isAnimatingRef.current || deck.length <= 1) return;
    isAnimatingRef.current = true;

    setDeck((prev) => {
      const last = prev[prev.length - 1];
      const rest = prev.slice(0, prev.length - 1);
      const updated = [last, ...rest];
      onCardChange?.(updated[0], 0);
      return updated;
    });

    // Animate the incoming card from left
    setTimeout(() => {
      const newTop = containerRef.current?.querySelector<HTMLDivElement>(".gsap-card-stack-item");
      if (newTop) {
        gsap.fromTo(
          newTop,
          { x: -300, rotateZ: -20, opacity: 0, scale: 0.9 },
          {
            x: 0,
            rotateZ: 0,
            opacity: 1,
            scale: 1,
            duration: 0.4,
            ease: "power2.out",
            onComplete: () => {
              isAnimatingRef.current = false;
              layoutStack(true);
            },
          }
        );
      } else {
        isAnimatingRef.current = false;
      }
    }, 20);
  }, [deck.length, layoutStack, onCardChange]);

  // Autoplay ticker
  useEffect(() => {
    if (!autoplay || isPaused || deck.length <= 1) return;
    const interval = setInterval(() => {
      swipeCard(1);
    }, autoplayInterval);
    return () => clearInterval(interval);
  }, [autoplay, autoplayInterval, isPaused, deck.length, swipeCard]);

  // Pointer gesture handlers on top card
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isAnimatingRef.current || deck.length <= 1) return;
    isDraggingRef.current = true;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    currentDeltaRef.current = { x: 0, y: 0 };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    currentDeltaRef.current = { x: dx, y: dy };

    const topCard = topCardRef.current;
    if (topCard) {
      const rotateZ = dx * 0.07;
      gsap.set(topCard, {
        x: dx,
        y: dy * 0.3,
        rotateZ,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    const { x: dx } = currentDeltaRef.current;
    const threshold = 85;

    if (dx > threshold) {
      swipeCard(1);
    } else if (dx < -threshold) {
      swipeCard(-1);
    } else {
      // Snap-back spring
      const topCard = topCardRef.current;
      if (topCard) {
        gsap.to(topCard, {
          x: 0,
          y: 0,
          rotateZ: 0,
          duration: 0.45,
          ease: "elastic.out(1, 0.75)",
        });
      }
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      swipeCard(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevCard();
    }
  };

  return (
    <div
      className={cn(
        "relative flex w-full flex-col items-center select-none outline-none",
        className
      )}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Student Learning Course Card Deck"
    >
      {/* 3D Stack Viewport */}
      <div
        ref={containerRef}
        className="relative flex min-h-[510px] w-full max-w-[440px] items-center justify-center py-4 perspective-1000"
      >
        {deck.slice(0, 4).map((card, index) => {
          const isTop = index === 0;

          return (
            <div
              key={card.id}
              ref={isTop ? topCardRef : undefined}
              onPointerDown={isTop ? handlePointerDown : undefined}
              onPointerMove={isTop ? handlePointerMove : undefined}
              onPointerUp={isTop ? handlePointerUp : undefined}
              onPointerCancel={isTop ? handlePointerUp : undefined}
              className={cn(
                "gsap-card-stack-item absolute top-4 inset-x-0 mx-auto flex w-full max-w-[420px] flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 text-foreground shadow-2xl backdrop-blur-xl transition-colors",
                isTop ? "cursor-grab active:cursor-grabbing shadow-primary/5" : "pointer-events-none"
              )}
              style={{
                height: "475px",
                touchAction: isTop ? "none" : "auto",
              }}
            >
              {/* Header Badge & Level */}
              <div className="flex flex-col items-center space-y-1">
                {card.badge && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-primary border border-primary/20">
                    <Sparkles className="size-3" />
                    <span>{card.badge}</span>
                  </span>
                )}
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {card.levelName}
                </span>
                <h3 className="text-xl font-bold font-serif text-foreground text-center line-clamp-1">
                  {card.title}
                </h3>
              </div>

              {/* Center Artwork / Interactive SVG */}
              <div className="my-2 flex size-36 items-center justify-center self-center drop-shadow-md">
                {card.illustrationSvg}
              </div>

              {/* Steps Progress List */}
              <div className="space-y-2 rounded-2xl bg-muted/40 p-3 border border-border/40">
                {card.steps.map((step, sIndex) => (
                  <div
                    key={sIndex}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {step.isCompleted ? (
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                      ) : step.isActive ? (
                        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-extrabold text-primary-foreground">
                          {sIndex + 1}
                        </span>
                      ) : (
                        <span className="flex size-4 shrink-0 items-center justify-center rounded-full border border-muted-foreground/40 text-[9px] text-muted-foreground">
                          {sIndex + 1}
                        </span>
                      )}
                      <span
                        className={cn(
                          "truncate",
                          step.isActive
                            ? "font-bold text-foreground"
                            : step.isCompleted
                            ? "text-muted-foreground line-through"
                            : "text-muted-foreground"
                        )}
                      >
                        {step.title}
                      </span>
                    </div>

                    {step.xp && (
                      <span className="text-[10px] font-bold text-muted-foreground tabular-nums shrink-0">
                        +{step.xp} XP
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom Action CTA */}
              <div className="pt-2">
                <Link
                  to="/courses/$courseId"
                  params={{ courseId: card.slug }}
                  className="w-full block"
                >
                  <Button
                    className="w-full h-11 rounded-full font-bold shadow-md gap-2"
                    size="default"
                  >
                    <Play className="size-4 fill-current" />
                    <span>{card.ctaText ?? "Start Lesson"}</span>
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Controls & Pagination */}
      <div className="mt-2 flex items-center justify-between w-full max-w-[420px] px-4">
        {showNavigation && (
          <button
            type="button"
            onClick={prevCard}
            className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-xs transition-all hover:bg-muted hover:scale-105 active:scale-95"
            aria-label="Previous card"
          >
            <ChevronLeft className="size-5" />
          </button>
        )}

        {/* Pagination Dots */}
        {showPagination && (
          <div className="flex items-center gap-1.5">
            {cards.map((_, dotIndex) => {
              const isActive = deck[0]?.id === cards[dotIndex]?.id;
              return (
                <button
                  key={dotIndex}
                  type="button"
                  onClick={() => {
                    const targetId = cards[dotIndex]?.id;
                    const idx = deck.findIndex((d) => d.id === targetId);
                    if (idx > 0) {
                      setDeck((prev) => {
                        const nextSlice = prev.slice(idx);
                        const prevSlice = prev.slice(0, idx);
                        const updated = [...nextSlice, ...prevSlice];
                        onCardChange?.(updated[0], dotIndex);
                        return updated;
                      });
                    }
                  }}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    isActive ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                  )}
                  aria-label={`Jump to card ${dotIndex + 1}`}
                />
              );
            })}
          </div>
        )}

        {showNavigation && (
          <button
            type="button"
            onClick={() => swipeCard(1)}
            className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-xs transition-all hover:bg-muted hover:scale-105 active:scale-95"
            aria-label="Next card"
          >
            <ChevronRight className="size-5" />
          </button>
        )}
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground font-medium flex items-center gap-1">
        <span>Swipe or drag cards left/right</span>
      </p>
    </div>
  );
}
