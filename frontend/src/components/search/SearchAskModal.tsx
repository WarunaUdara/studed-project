import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  Code,
  Compass,
  Lightbulb,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export interface SearchResultItem {
  id: string;
  title: string;
  description: string;
  category: "Science" | "Python" | "Mathematics" | "Logic" | "Language";
  type: "course" | "wave" | "concept";
  href: string;
  badge?: string;
  xpReward?: number;
  similarityScore?: number; // 0 to 100
  keywords: string[];
}

export const SEARCH_KNOWLEDGE_BASE: SearchResultItem[] = [
  {
    id: "science-gears-w1",
    title: "Connecting Gears",
    description: "Learn how adjacent gears invert rotation direction (counter-clockwise pushes clockwise).",
    category: "Science",
    type: "wave",
    href: "/waves/science-gears-1",
    xpReward: 30,
    badge: "Level 1",
    keywords: ["gear", "gears", "connecting gears", "rotation", "physics", "mechanics", "direction", "clockwise", "counter-clockwise"],
  },
  {
    id: "science-gears-w2",
    title: "Gears Changing Speeds & Compound Trains",
    description: "Understand gear ratios and how large and small gears change rotational velocity and mechanical torque.",
    category: "Science",
    type: "wave",
    href: "/waves/science-gears-2",
    xpReward: 30,
    badge: "Level 1",
    keywords: ["gear speed", "speed", "gear ratio", "torque", "teeth", "compound gears", "velocity"],
  },
  {
    id: "course-scientific-thinking",
    title: "Scientific Thinking",
    description: "Open your eyes to the mechanical world by solving visual physics puzzles and gear mechanisms.",
    category: "Science",
    type: "course",
    href: "/courses",
    badge: "Course",
    keywords: ["scientific thinking", "science", "physics", "mechanical", "gears", "puzzles", "engineering"],
  },
  {
    id: "python-maze-w1",
    title: "Algorithm Grid Runner with Blob Mascot",
    description: "Reorder movement and rotation instructions to navigate the Blob mascot through a 2D matrix arena.",
    category: "Python",
    type: "wave",
    href: "/waves/python-maze-1",
    xpReward: 30,
    badge: "Module 1",
    keywords: ["python", "code", "coding", "algorithm", "blob", "maze", "grid", "move forward", "turn left", "turn right"],
  },
  {
    id: "course-python-fundamentals",
    title: "Thinking in Python & Coding",
    description: "Interactive introductory programming curriculum with step-by-step algorithmic challenges.",
    category: "Python",
    type: "course",
    href: "/courses",
    badge: "Course",
    keywords: ["python", "programming", "coding", "functions", "variables", "loops", "syntax"],
  },
  {
    id: "math-fractions-w1",
    title: "Visual Fractions & Geometric Slices",
    description: "Intuitive pie and circle diagrams showing equivalent fractions and common denominators.",
    category: "Mathematics",
    type: "wave",
    href: "/waves/math-fractions-1",
    xpReward: 25,
    badge: "Foundations",
    keywords: ["fractions", "math", "mathematics", "geometry", "denominator", "numerator", "ratio"],
  },
  {
    id: "course-math-foundations",
    title: "Mathematics Foundations",
    description: "Deep, visual understanding of arithmetic, algebraic thinking, and geometric proofs.",
    category: "Mathematics",
    type: "course",
    href: "/courses",
    badge: "Course",
    keywords: ["math", "mathematics", "algebra", "geometry", "fractions", "equations"],
  },
  {
    id: "logic-deduction-w1",
    title: "Deductive Reasoning & Truth Tables",
    description: "Solve constraint satisfaction puzzles and boolean logic statements.",
    category: "Logic",
    type: "wave",
    href: "/waves/logic-1",
    xpReward: 30,
    badge: "Level 1",
    keywords: ["logic", "deduction", "truth table", "boolean", "puzzle", "reasoning"],
  },
];

export interface SearchAskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export function SearchAskModal({
  isOpen,
  onClose,
  initialQuery = "",
}: SearchAskModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [searchMode, setSearchMode] = useState<"all" | "text" | "similarity">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialQuery]);

  // Text keyword search & Semantic Similarity scoring
  const { results, aiExplanation } = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        results: SEARCH_KNOWLEDGE_BASE,
        aiExplanation: null,
      };
    }

    const words = q.split(/\s+/).filter(Boolean);

    // Compute text matching score and similarity score
    const scored = SEARCH_KNOWLEDGE_BASE.map((item) => {
      let textScore = 0;
      let similarityScore = 0;

      // Exact title match
      if (item.title.toLowerCase().includes(q)) {
        textScore += 60;
        similarityScore += 50;
      }

      // Exact description match
      if (item.description.toLowerCase().includes(q)) {
        textScore += 30;
        similarityScore += 35;
      }

      // Keyword & Semantic overlap
      for (const word of words) {
        if (item.keywords.some((k) => k.includes(word) || word.includes(k))) {
          textScore += 25;
          similarityScore += 20;
        }
      }

      // Concept-based semantic similarity boosts
      if (
        (q.includes("turn") || q.includes("spin") || q.includes("rotate") || q.includes("direction") || q.includes("teeth") || q.includes("speed")) &&
        item.category === "Science"
      ) {
        similarityScore += 40;
      }

      if (
        (q.includes("code") || q.includes("program") || q.includes("bot") || q.includes("algorithm") || q.includes("step") || q.includes("loop")) &&
        item.category === "Python"
      ) {
        similarityScore += 40;
      }

      if (
        (q.includes("fraction") || q.includes("divide") || q.includes("number") || q.includes("angle") || q.includes("shape")) &&
        item.category === "Mathematics"
      ) {
        similarityScore += 40;
      }

      const normalizedSimilarity = Math.min(99, Math.max(45, similarityScore + 30));

      return {
        ...item,
        textScore,
        similarityScore: normalizedSimilarity,
        totalScore: searchMode === "similarity" ? similarityScore : textScore + similarityScore,
      };
    });

    // Filter by category if selected
    const filtered = scored.filter((item) => {
      if (selectedCategory !== "ALL" && item.category.toUpperCase() !== selectedCategory) {
        return false;
      }
      return item.totalScore > 0 || !q;
    });

    // Sort by highest relevance score
    filtered.sort((a, b) => b.totalScore - a.totalScore);

    // Synthesize AI direct answer if query is a question or concept lookup
    let explanation: string | null = null;
    if (q.includes("gear") || q.includes("spin") || q.includes("rotate") || q.includes("direction")) {
      explanation =
        "In mechanical gear trains, adjacent meshed gears always rotate in opposite directions (↺ pushes ↻). For any linear chain of N gears, odd-numbered gears (1st, 3rd, 5th) rotate in the same direction as the driver!";
    } else if (q.includes("python") || q.includes("code") || q.includes("algorithm") || q.includes("maze")) {
      explanation =
        "Algorithms are step-by-step sequences of commands. Guiding the Blob mascot involves calculating orientation headings (0°, 90°, 180°, 270°) and executing moves within grid matrix boundaries.";
    } else if (q.includes("fraction") || q.includes("ratio") || q.includes("math")) {
      explanation =
        "Fractions represent parts of a whole where the denominator represents total equal subdivisions and the numerator represents selected active partitions.";
    }

    return {
      results: filtered,
      aiExplanation: explanation,
    };
  }, [query, searchMode, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-24">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-md"
      />

      {/* Modal Dialog Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -12 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl backdrop-blur-2xl"
      >
        {/* Top Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
          <Search className="size-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics or ask a question (e.g. 'How do gears rotate?')..."
            className="w-full bg-transparent text-sm sm:text-base text-foreground outline-none placeholder:text-muted-foreground font-medium"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border/80 px-2.5 py-1 text-xs font-bold text-muted-foreground hover:bg-muted"
          >
            ESC
          </button>
        </div>

        {/* Mode Selector & Category Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 bg-muted/30 px-5 py-2.5">
          {/* Dual Search Mode Pills */}
          <div className="flex items-center gap-1 rounded-full bg-card p-1 border border-border/60">
            <button
              type="button"
              onClick={() => setSearchMode("all")}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                searchMode === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Matches
            </button>
            <button
              type="button"
              onClick={() => setSearchMode("text")}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                searchMode === "text"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Text Search
            </button>
            <button
              type="button"
              onClick={() => setSearchMode("similarity")}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                searchMode === "similarity"
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="size-3" />
              <span>Similarity Search</span>
            </button>
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-1 text-xs">
            {["ALL", "SCIENCE", "PYTHON", "MATHEMATICS", "LOGIC"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
                  selectedCategory === cat
                    ? "bg-muted text-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat === "ALL" ? "All" : cat.charAt(0) + cat.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Results List / Details */}
        <div className="max-h-[420px] overflow-y-auto p-4 space-y-3">
          {/* AI Direct Concept Synthesizer Card */}
          {aiExplanation && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-300">
                <Brain className="size-4" />
                <span>StudEd Concept Synthesizer</span>
                <span className="ml-auto rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400 font-extrabold">
                  AI Similarity Result
                </span>
              </div>
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                {aiExplanation}
              </p>
            </div>
          )}

          {/* Search Result Items */}
          {results.length > 0 ? (
            results.map((item) => (
              <Link
                key={item.id}
                to={item.href as any}
                onClick={onClose}
                className="group flex items-center justify-between rounded-2xl border border-border/60 bg-card p-3.5 transition-all hover:border-primary/50 hover:bg-muted/50 shadow-xs"
              >
                <div className="flex items-start gap-3.5 max-w-[80%]">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted group-hover:bg-primary/15 transition-colors">
                    {item.category === "Science" && <Brain className="size-4 text-amber-500" />}
                    {item.category === "Python" && <Code className="size-4 text-emerald-500" />}
                    {item.category === "Mathematics" && <Compass className="size-4 text-blue-500" />}
                    {item.category === "Logic" && <Lightbulb className="size-4 text-purple-500" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </span>
                      {item.badge && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Score & Action CTA */}
                <div className="flex flex-col items-end gap-1.5 shrink-0 pl-3">
                  {searchMode === "similarity" && item.similarityScore && (
                    <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-300">
                      {item.similarityScore}% Match
                    </span>
                  )}
                  {item.xpReward && (
                    <span className="text-[11px] font-bold text-amber-500">
                      +{item.xpReward} XP
                    </span>
                  )}
                  <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
              <Search className="size-8 text-muted-foreground" />
              <p className="text-sm font-bold text-foreground">No matches found</p>
              <p className="text-xs text-muted-foreground">
                Try searching for 'gears', 'python', 'fractions', or 'algorithms'.
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-border/40 bg-muted/20 px-5 py-2.5 text-[11px] text-muted-foreground">
          <span>Press <strong>ESC</strong> to close</span>
          <span>Powered by StudEd Full-Text & Semantic Similarity Engine</span>
        </div>
      </motion.div>
    </div>
  );
}
