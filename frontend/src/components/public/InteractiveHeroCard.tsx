import { motion } from "framer-motion";
import { Brain, CheckCircle2, Code2, Compass, Play, Sparkles } from "lucide-react";
import { useState } from "react";

export function InteractiveHeroCard() {
  const [activeTab, setActiveTab] = useState<"math" | "science" | "code">("math");
  const [gearSpinning, setGearSpinning] = useState(true);
  const [codeStep, setCodeStep] = useState(2);

  return (
    <div className="relative mx-auto w-full max-w-lg select-none">
      {/* Glow highlight */}
      <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-tr from-primary/20 via-emerald-500/10 to-purple-500/20 blur-xl opacity-60 pointer-events-none" />

      {/* Main Clean Card */}
      <div className="relative overflow-hidden rounded-[28px] border border-border/80 bg-card p-6 shadow-2xl backdrop-blur-xl">
        {/* Subject Switcher Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-1.5 rounded-full bg-muted/70 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("math")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                activeTab === "math"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Compass className="size-3.5 text-blue-500" />
              <span>Math</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("science")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                activeTab === "science"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Brain className="size-3.5 text-amber-500" />
              <span>Science</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("code")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                activeTab === "code"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Code2 className="size-3.5 text-emerald-500" />
              <span>Coding</span>
            </button>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-primary">
            <Sparkles className="size-3" />
            <span>Interactive Demo</span>
          </div>
        </div>

        {/* Interactive Canvas Body */}
        <div className="py-6 min-h-[290px] flex flex-col items-center justify-center">
          {/* TAB 1: MATH GEOMETRY & SYMMETRY */}
          {activeTab === "math" && (
            <motion.div
              key="math"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center space-y-4 w-full"
            >
              <p className="text-xs font-medium text-muted-foreground">
                Divide the square into equal symmetrical quadrants
              </p>

              {/* Interactive Geometric Box */}
              <div className="relative size-44 rounded-2xl border-2 border-foreground/80 bg-background p-2 shadow-inner flex items-center justify-center overflow-hidden">
                {/* Quadrants fill */}
                <div
                  className="absolute inset-0 bg-primary/20 transition-all duration-300"
                  style={{
                    clipPath: `polygon(0 0, 50% 50%, 0 100%)`,
                  }}
                />
                <div
                  className="absolute inset-0 bg-emerald-500/20 transition-all duration-300"
                  style={{
                    clipPath: `polygon(100% 0, 50% 50%, 100% 100%)`,
                  }}
                />

                {/* Grid Symmetry Lines */}
                <svg viewBox="0 0 100 100" className="size-full">
                  {/* Outer Square */}
                  <rect x="5" y="5" width="90" height="90" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground" />
                  {/* Diagonal and Center Lines */}
                  <line x1="5" y1="5" x2="95" y2="95" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="text-muted-foreground/60" />
                  <line x1="95" y1="5" x2="5" y2="95" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="text-muted-foreground/60" />
                  <line x1="50" y1="5" x2="50" y2="95" stroke="#10b981" strokeWidth="2.5" />
                  <line x1="5" y1="50" x2="95" y2="50" stroke="#10b981" strokeWidth="2.5" />
                  
                  {/* Inscribed Diamond */}
                  <polygon points="50,5 95,50 50,95 5,50" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground" />
                  
                  {/* Center Node */}
                  <circle cx="50" cy="50" r="4" fill="#10b981" />
                  <circle cx="50" cy="95" r="3.5" fill="#10b981" />
                </svg>

                {/* Animated Interactive Mouse Pointer */}
                <motion.div
                  animate={{
                    x: [35, -20, 35],
                    y: [40, -10, 40],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 3.5,
                    ease: "easeInOut",
                  }}
                  className="pointer-events-none absolute z-20"
                >
                  <svg className="size-6 text-foreground drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 2l16 11-7 1.5 4.5 7.5-2.5 1.5-4.5-7.5L4 20V2z" />
                  </svg>
                </motion.div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-muted-foreground">Symmetry Ratio:</span>
                <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
                  1 / 4 (25% Area)
                </span>
              </div>
            </motion.div>
          )}

          {/* TAB 2: SCIENCE GEAR TRAIN PHYSICS */}
          {activeTab === "science" && (
            <motion.div
              key="science"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center space-y-4 w-full"
            >
              <p className="text-xs font-medium text-muted-foreground">
                Adjacent gears spin in opposite directions ($↺ \to ↻$)
              </p>

              {/* 2 Meshed Rotating Gears */}
              <div
                className="relative flex items-center justify-center p-2 cursor-pointer"
                onClick={() => setGearSpinning(!gearSpinning)}
              >
                <svg viewBox="0 0 220 120" className="w-56 h-32 overflow-visible">
                  {/* Left Gear (Driver, Yellow/Lime: Counter-Clockwise ↺) */}
                  <g transform="translate(60, 60)">
                    <motion.g
                      animate={gearSpinning ? { rotate: -360 } : { rotate: 0 }}
                      transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                      style={{ transformOrigin: "0px 0px" }}
                    >
                      <circle cx="0" cy="0" r="38" fill="#84cc16" />
                      {Array.from({ length: 12 }).map((_, i) => (
                        <rect
                          key={i}
                          x="-4"
                          y="-44"
                          width="8"
                          height="12"
                          rx="2"
                          fill="#65a30d"
                          transform={`rotate(${(i * 360) / 12})`}
                        />
                      ))}
                      <circle cx="0" cy="0" r="14" fill="#334155" />
                      <circle cx="0" cy="0" r="6" fill="#64748b" />
                    </motion.g>
                    {/* Fixed axle pin */}
                    <circle cx="0" cy="0" r="3" fill="#0f172a" />
                  </g>

                  {/* Right Gear (Driven, Cyan: Clockwise ↻) */}
                  <g transform="translate(138, 60)">
                    <motion.g
                      animate={gearSpinning ? { rotate: 360 } : { rotate: 0 }}
                      transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                      style={{ transformOrigin: "0px 0px" }}
                    >
                      <circle cx="0" cy="0" r="38" fill="#06b6d4" />
                      {Array.from({ length: 12 }).map((_, i) => (
                        <rect
                          key={i}
                          x="-4"
                          y="-44"
                          width="8"
                          height="12"
                          rx="2"
                          fill="#0891b2"
                          transform={`rotate(${(i * 360) / 12 + 15})`}
                        />
                      ))}
                      <circle cx="0" cy="0" r="14" fill="#334155" />
                      <circle cx="0" cy="0" r="6" fill="#64748b" />
                    </motion.g>
                    {/* Fixed axle pin */}
                    <circle cx="0" cy="0" r="3" fill="#0f172a" />
                  </g>
                </svg>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> Mechanical Parity Verified
                </span>
              </div>
            </motion.div>
          )}

          {/* TAB 3: CODING ALGORITHMS & MAZE */}
          {activeTab === "code" && (
            <motion.div
              key="code"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center space-y-3 w-full"
            >
              <p className="text-xs font-medium text-muted-foreground">
                Algorithmic loops & logic blocks
              </p>

              {/* Code blocks stack */}
              <div className="w-full max-w-sm rounded-xl border border-border/70 bg-muted/40 p-3.5 space-y-2 font-mono text-xs text-left">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <span className="text-muted-foreground font-normal">1</span>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5">while</span>
                  <span>gems_remaining &gt; 0:</span>
                </div>
                <div className="flex items-center gap-2 pl-4 text-emerald-600 dark:text-emerald-400">
                  <span className="text-muted-foreground font-normal">2</span>
                  <span className="rounded bg-emerald-500/10 px-1.5 py-0.5">move_forward()</span>
                </div>
                <div className="flex items-center gap-2 pl-4 text-amber-600 dark:text-amber-400">
                  <span className="text-muted-foreground font-normal">3</span>
                  <span className="rounded bg-amber-500/10 px-1.5 py-0.5">if</span>
                  <span>is_at_gem():</span>
                </div>
                <div className="flex items-center gap-2 pl-8 text-purple-600 dark:text-purple-400">
                  <span className="text-muted-foreground font-normal">4</span>
                  <span className="rounded bg-purple-500/10 px-1.5 py-0.5">collect_gem()</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCodeStep((prev) => (prev % 4) + 1)}
                  className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-xs transition-all"
                >
                  <Play className="size-3 fill-current" /> Run Step {codeStep}
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer Tagline */}
        <div className="border-t border-border/50 pt-3 text-center">
          <p className="text-[11px] font-medium text-muted-foreground">
            Intuitive step-by-step problem solving for all grade levels.
          </p>
        </div>
      </div>
    </div>
  );
}
