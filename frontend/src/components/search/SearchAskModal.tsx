import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Brain, Code, Compass, Search, Trophy, X, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export interface SearchEntry {
  id: string;
  title: string;
  subtitle: string;
  category: "Wave" | "Course" | "Action";
  href: string;
  icon: React.ReactNode;
  badge?: string;
  keywords: string[];
}

// Static Catalog & Actions based on existing platform features
const PLATFORM_INDEX: SearchEntry[] = [
  // Interactive Waves
  {
    id: "wave-science-1",
    title: "Connecting Gears",
    subtitle: "Solve gear direction inversion and mechanical rotation puzzles",
    category: "Wave",
    href: "/waves/science-gears-1",
    icon: <Brain className="size-4 text-amber-500" />,
    badge: "Science · +30 XP",
    keywords: [
      "gear",
      "gears",
      "science",
      "physics",
      "rotation",
      "connecting gears",
      "direction",
      "wave",
      "lesson",
    ],
  },
  {
    id: "wave-science-2",
    title: "Gear Speeds & Compound Trains",
    subtitle: "Kinetic torque, angular speed and 6-gear arch challenges",
    category: "Wave",
    href: "/waves/science-gears-2",
    icon: <Brain className="size-4 text-amber-500" />,
    badge: "Science · +30 XP",
    keywords: ["gear", "gears", "compound", "speed", "ratio", "teeth", "arch", "science"],
  },
  {
    id: "wave-python-1",
    title: "Blob Algorithm Grid Runner",
    subtitle: "Sequence movement and turn instructions for the Blob mascot",
    category: "Wave",
    href: "/waves/python-maze-1",
    icon: <Code className="size-4 text-emerald-500" />,
    badge: "Python · +30 XP",
    keywords: ["python", "code", "coding", "algorithm", "blob", "maze", "grid", "movement", "step"],
  },

  // Courses
  {
    id: "course-science",
    title: "Scientific Thinking",
    subtitle: "40 Lessons · 487 Waves on kinetic physics and mechanics",
    category: "Course",
    href: "/courses",
    icon: <Brain className="size-4 text-amber-500" />,
    badge: "Course",
    keywords: ["scientific thinking", "science", "physics", "course", "curriculum"],
  },
  {
    id: "course-python",
    title: "Thinking in Python & Coding",
    subtitle: "Algorithmic thinking and computational problem solving",
    category: "Course",
    href: "/courses",
    icon: <Code className="size-4 text-emerald-500" />,
    badge: "Course",
    keywords: ["python", "coding", "programming", "course", "computer science"],
  },
  {
    id: "course-math",
    title: "Mathematics Foundations",
    subtitle: "Visual geometry, algebra and arithmetic proofs",
    category: "Course",
    href: "/courses",
    icon: <Compass className="size-4 text-blue-500" />,
    badge: "Course",
    keywords: ["math", "mathematics", "algebra", "geometry", "fractions", "course"],
  },

  // Quick Actions & Tools
  {
    id: "action-daily-spark",
    title: "Daily Spark Warmup",
    subtitle: "Quick 2-minute daily cognitive challenge (+15 XP)",
    category: "Action",
    href: "/dashboard",
    icon: <Zap className="size-4 text-lime-500" />,
    badge: "Daily Quest",
    keywords: ["daily spark", "warmup", "quest", "streak", "xp", "today"],
  },
  {
    id: "action-leaderboard",
    title: "Hydrogen League Leaderboard",
    subtitle: "View your weekly ranking and climb to Helium League",
    category: "Action",
    href: "/leaderboard",
    icon: <Trophy className="size-4 text-amber-500" />,
    badge: "Leagues",
    keywords: ["league", "leaderboard", "ranking", "hydrogen", "points", "compete"],
  },
  {
    id: "action-catalog",
    title: "Browse All Courses",
    subtitle: "Explore all learning paths across Sri Lankan curriculum",
    category: "Action",
    href: "/courses",
    icon: <BookOpen className="size-4 text-purple-500" />,
    badge: "Catalog",
    keywords: ["courses", "browse", "catalog", "all", "learning paths"],
  },
];

export interface SearchAskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export function SearchAskModal({ isOpen, onClose, initialQuery = "" }: SearchAskModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen, initialQuery]);

  // Filtered Results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Suggest based on user context & platform essentials
      return PLATFORM_INDEX;
    }

    const words = q.split(/\s+/).filter(Boolean);

    return PLATFORM_INDEX.filter((item) => {
      // Direct title match
      if (item.title.toLowerCase().includes(q)) return true;
      // Subtitle match
      if (item.subtitle.toLowerCase().includes(q)) return true;
      // Keyword match
      return words.some((w) => item.keywords.some((k) => k.includes(w)));
    });
  }, [query]);

  // Keyboard navigation (Arrow keys + Enter + ESC)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      onClose();
      window.location.assign(results[selectedIndex].href);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  const isQueryEmpty = !query.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-24 select-none">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Spotlight Command Dialog Container */}
      <motion.div
        // Announced as a dialog so a screen reader user is told the page has
        // been taken over, rather than finding a stray search field.
        role="dialog"
        aria-modal="true"
        aria-label="Search lessons and ask a question"
        initial={{ opacity: 0, scale: 0.98, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: -10 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3.5">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search lessons, waves, or courses..."
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedIndex(0);
              }}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border/70 px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted"
          >
            ESC
          </button>
        </div>

        {/* Section Header */}
        <div className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {isQueryEmpty ? "Suggested For You" : `Results (${results.length})`}
        </div>

        {/* Results List */}
        <div className="max-h-[360px] overflow-y-auto px-2 pb-2 space-y-1">
          {results.length > 0 ? (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;

              return (
                <Link
                  key={item.id}
                  to={item.href as any}
                  onClick={onClose}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors ${
                    isSelected ? "bg-muted text-foreground" : "text-foreground/80 hover:bg-muted/60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border/60">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold truncate text-foreground">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.2 text-[10px] font-medium text-primary">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                    </div>
                  </div>

                  <ArrowRight
                    className={`size-3.5 text-muted-foreground shrink-0 transition-opacity ${
                      isSelected ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </Link>
              );
            })
          ) : (
            <div className="py-10 text-center space-y-1">
              <p className="text-xs font-semibold text-foreground">No matches found</p>
              <p className="text-[11px] text-muted-foreground">
                Try searching for 'gears', 'python', 'math', or 'leaderboard'.
              </p>
            </div>
          )}
        </div>

        {/* Minimal Footer */}
        <div className="flex items-center justify-between border-t border-border/40 bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              Use <strong>↑↓</strong> to navigate
            </span>
            <span>·</span>
            <span>
              <strong>↵</strong> to select
            </span>
          </div>
          <span>StudEd Search</span>
        </div>
      </motion.div>
    </div>
  );
}
