import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Bot, Brain, CheckCircle2, Code2, Compass, Gem, Terminal } from "lucide-react";
import { prefersReducedMotion } from "@/lib/motion";

export function InteractiveHeroCard() {
  const [activeTab, setActiveTab] = useState<"math" | "science" | "code">("math");
  const containerRef = useRef<HTMLDivElement>(null);
  const mathRef = useRef<HTMLDivElement>(null);
  const scienceRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);

  // Active line for code interpreter
  const [codeActiveLine, setCodeActiveLine] = useState(1);
  const [gemCount, setGemCount] = useState(1);
  const [characterPos, setCharacterPos] = useState(0);
  const [terminalLog, setTerminalLog] = useState("Initialized interpreter...");

  // Math Trigonometry Theta value (0 to 4pi mapped to SVG coordinates)
  const [thetaPercent, setThetaPercent] = useState(0.4);

  // Auto-switch tabs periodically (every 7 seconds)
  useEffect(() => {
    const tabs: Array<"math" | "science" | "code"> = ["math", "science", "code"];
    const interval = setInterval(() => {
      setActiveTab((curr) => {
        const nextIdx = (tabs.indexOf(curr) + 1) % tabs.length;
        return tabs[nextIdx];
      });
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  // GSAP Math Sine/Cosine Animation
  useEffect(() => {
    if (activeTab !== "math") return;
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const obj = { val: 0.1 };
      gsap.to(obj, {
        val: 0.9,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        onUpdate: () => {
          setThetaPercent(obj.val);
        },
      });
    }, mathRef);
    return () => ctx.revert();
  }, [activeTab]);

  // GSAP Code Interpreter Line-by-Line Execution Animation
  useEffect(() => {
    if (activeTab !== "code") return;
    let step = 0;
    const sequence = [
      { line: 1, pos: 0, gems: 0, log: "Evaluating while condition -> True (gems: 1)" },
      { line: 2, pos: 1, gems: 0, log: "move_forward() -> Player shifted to tile 1" },
      { line: 3, pos: 1, gems: 0, log: "if is_at_gem() -> Gem found at tile 1!" },
      { line: 4, pos: 1, gems: 1, log: "collect_gem() -> Success! +10 XP earned" },
    ];

    const interval = setInterval(() => {
      step = (step + 1) % sequence.length;
      const current = sequence[step];
      setCodeActiveLine(current.line);
      setCharacterPos(current.pos);
      setGemCount(current.gems);
      setTerminalLog(current.log);
    }, 1400);

    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-lg select-none">
      {/* Subtle Glow */}
      <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-tr from-primary/20 via-emerald-500/10 to-teal-500/20 blur-xl opacity-60 pointer-events-none" />

      {/* Main Clean Card */}
      <div className="relative overflow-hidden rounded-[28px] border border-border/80 bg-card p-6 shadow-2xl backdrop-blur-xl transition-all">
        {/* Subject Switcher Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
          <div className="flex items-center gap-1.5 rounded-full bg-muted/70 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("math")}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
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
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
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
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                activeTab === "code"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Code2 className="size-3.5 text-emerald-500" />
              <span>Coding</span>
            </button>
          </div>

          {/* Progress cycle pill */}
          <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="capitalize">{activeTab} Simulation</span>
          </div>
        </div>

        {/* Interactive Canvas Body */}
        <div className="py-5 min-h-[300px] flex flex-col items-center justify-center">
          {/* TAB 1: MATH TRIGONOMETRIC WAVE & UNIT CIRCLE */}
          {activeTab === "math" && (
            <div ref={mathRef} className="flex flex-col items-center space-y-4 w-full">
              {/* Formula Badge */}
              <div className="rounded-lg border border-border/80 bg-muted/50 px-3 py-1 font-mono text-xs font-bold text-foreground shadow-2xs">
                f(θ) = cos(θ)
              </div>

              {/* Trigonometric Wave & Unit Circle Diagram */}
              <div className="relative w-full max-w-sm h-40 flex items-center justify-center">
                <svg viewBox="0 0 320 140" className="w-full h-full overflow-visible">
                  {/* Grid Lines */}
                  <line x1="20" y1="70" x2="200" y2="70" stroke="currentColor" strokeWidth="1" className="text-border" />
                  <line x1="30" y1="20" x2="30" y2="120" stroke="currentColor" strokeWidth="1" className="text-border" />
                  
                  {/* Cosine Wave Curve */}
                  <path
                    d="M 30 30 C 55 30 70 110 95 110 C 120 110 135 30 160 30 C 185 30 195 110 200 110"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Theta Axis Ticks */}
                  <text x="30" y="85" textAnchor="middle" className="text-[9px] fill-muted-foreground font-mono">0</text>
                  <text x="95" y="85" textAnchor="middle" className="text-[9px] fill-muted-foreground font-mono">π</text>
                  <text x="160" y="85" textAnchor="middle" className="text-[9px] fill-muted-foreground font-mono">2π</text>

                  {/* Slider Indicator along wave */}
                  {(() => {
                    const waveX = 30 + thetaPercent * 170;
                    const normalized = ((waveX - 30) / 130) * Math.PI * 2;
                    const waveY = 70 - Math.cos(normalized) * 40;
                    return (
                      <g transform={`translate(${waveX}, 0)`}>
                        <line x1="0" y1="20" x2="0" y2="120" stroke="#ec4899" strokeWidth="2" strokeDasharray="3 3" />
                        <circle cx="0" cy={waveY} r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                      </g>
                    );
                  })()}

                  {/* Unit Circle (Right Side) */}
                  <g transform="translate(260, 70)">
                    {/* Circle */}
                    <circle cx="0" cy="0" r="40" fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.4" />
                    <circle cx="0" cy="0" r="22" fill="#3b82f6" opacity="0.1" />
                    {/* Axes */}
                    <line x1="-48" y1="0" x2="48" y2="0" stroke="currentColor" strokeWidth="1" className="text-border" />
                    <line x1="0" y1="-48" x2="0" y2="48" stroke="currentColor" strokeWidth="1" className="text-border" />
                    
                    {/* Rotating Radius Arm */}
                    {(() => {
                      const angle = thetaPercent * Math.PI * 4;
                      const armX = Math.cos(angle) * 40;
                      const armY = -Math.sin(angle) * 40;
                      return (
                        <>
                          <line x1="0" y1="0" x2={armX} y2={armY} stroke="#3b82f6" strokeWidth="2.5" />
                          <circle cx={armX} cy={armY} r="4" fill="#ec4899" />
                          <circle cx="0" cy="0" r="3" fill="#1e293b" />
                        </>
                      );
                    })()}
                  </g>
                </svg>
              </div>

              <p className="text-xs font-semibold text-muted-foreground">
                Harmonic motion mapped to angular unit circle rotation.
              </p>
            </div>
          )}

          {/* TAB 2: SCIENCE INTERACTIVE GEARS & MECHANICAL PARITY */}
          {activeTab === "science" && (
            <div ref={scienceRef} className="flex flex-col items-center space-y-4 w-full">
              <p className="text-xs font-medium text-muted-foreground">
                Adjacent gears in a mechanical train rotate in opposite directions
              </p>

              {/* 2 Meshed Rotating Gears */}
              <div className="relative flex items-center justify-center p-2">
                <svg viewBox="0 0 240 130" className="w-60 h-32 overflow-visible">
                  {/* Left Gear (Lime Driver: Counter-Clockwise ↺) */}
                  <g transform="translate(68, 65)">
                    <g className="animate-spin" style={{ animationDuration: "5s", animationDirection: "reverse" }}>
                      <circle cx="0" cy="0" r="42" fill="#84cc16" />
                      {Array.from({ length: 12 }).map((_, i) => (
                        <rect
                          key={i}
                          x="-4"
                          y="-48"
                          width="8"
                          height="12"
                          rx="2"
                          fill="#65a30d"
                          transform={`rotate(${(i * 360) / 12})`}
                        />
                      ))}
                      <circle cx="0" cy="0" r="16" fill="#334155" />
                      <circle cx="0" cy="0" r="7" fill="#64748b" />
                    </g>
                    {/* Fixed axle pin */}
                    <circle cx="0" cy="0" r="3.5" fill="#0f172a" />
                    {/* Rotation Arrow */}
                    <g transform="translate(0, -58)" className="text-white drop-shadow-md">
                      <path d="M -14 0 A 18 18 0 0 1 14 0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      <polygon points="-17,-2 -11,5 -10,-4" fill="currentColor" />
                    </g>
                  </g>

                  {/* Right Gear (Cyan Driven: Clockwise ↻) */}
                  <g transform="translate(152, 65)">
                    <g className="animate-spin" style={{ animationDuration: "5s", animationDirection: "normal" }}>
                      <circle cx="0" cy="0" r="42" fill="#06b6d4" />
                      {Array.from({ length: 12 }).map((_, i) => (
                        <rect
                          key={i}
                          x="-4"
                          y="-48"
                          width="8"
                          height="12"
                          rx="2"
                          fill="#0891b2"
                          transform={`rotate(${(i * 360) / 12 + 15})`}
                        />
                      ))}
                      <circle cx="0" cy="0" r="16" fill="#334155" />
                      <circle cx="0" cy="0" r="7" fill="#64748b" />
                    </g>
                    {/* Fixed axle pin */}
                    <circle cx="0" cy="0" r="3.5" fill="#0f172a" />
                    {/* Rotation Arrow */}
                    <g transform="translate(0, -58)" className="text-white drop-shadow-md">
                      <path d="M -14 0 A 18 18 0 0 1 14 0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      <polygon points="17,-2 11,5 10,-4" fill="currentColor" />
                    </g>
                  </g>
                </svg>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 shadow-2xs">
                  <CheckCircle2 className="size-3.5" /> 1:1 Speed Ratio · Mechanical Parity
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: CODING ALGORITHM INTERPRETER RUNNING LINE BY LINE */}
          {activeTab === "code" && (
            <div ref={codeRef} className="flex flex-col items-center space-y-3.5 w-full">
              {/* Code blocks with animated active line indicator */}
              <div className="w-full rounded-2xl border border-border/80 bg-muted/30 p-3.5 space-y-1.5 font-mono text-xs text-left shadow-inner">
                {/* Line 1 */}
                <div
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1 transition-all duration-300 ${
                    codeActiveLine === 1
                      ? "bg-primary/20 text-foreground font-bold border-l-3 border-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  <span className="w-3 text-[10px] opacity-60">1</span>
                  <span className="text-primary font-bold">while</span>
                  <span>gems_remaining &gt; 0:</span>
                </div>

                {/* Line 2 */}
                <div
                  className={`flex items-center gap-2.5 pl-6 rounded-lg px-2.5 py-1 transition-all duration-300 ${
                    codeActiveLine === 2
                      ? "bg-emerald-500/20 text-foreground font-bold border-l-3 border-emerald-500"
                      : "text-muted-foreground"
                  }`}
                >
                  <span className="w-3 text-[10px] opacity-60">2</span>
                  <span className="text-emerald-500 font-semibold">move_forward()</span>
                </div>

                {/* Line 3 */}
                <div
                  className={`flex items-center gap-2.5 pl-6 rounded-lg px-2.5 py-1 transition-all duration-300 ${
                    codeActiveLine === 3
                      ? "bg-amber-500/20 text-foreground font-bold border-l-3 border-amber-500"
                      : "text-muted-foreground"
                  }`}
                >
                  <span className="w-3 text-[10px] opacity-60">3</span>
                  <span className="text-amber-500 font-bold">if</span>
                  <span>is_at_gem():</span>
                </div>

                {/* Line 4 */}
                <div
                  className={`flex items-center gap-2.5 pl-10 rounded-lg px-2.5 py-1 transition-all duration-300 ${
                    codeActiveLine === 4
                      ? "bg-purple-500/20 text-foreground font-bold border-l-3 border-purple-500"
                      : "text-muted-foreground"
                  }`}
                >
                  <span className="w-3 text-[10px] opacity-60">4</span>
                  <span className="text-purple-500 font-semibold">collect_gem()</span>
                </div>
              </div>

              {/* Live Mini Visual Grid Arena */}
              <div className="w-full flex items-center justify-between gap-2 px-2">
                {/* 3-Tile Mini Arena */}
                <div className="flex items-center gap-1.5 rounded-xl bg-background border border-border/70 p-1.5">
                  {[0, 1, 2].map((idx) => {
                    const isHero = characterPos === idx;
                    const hasGem = idx === 1 && gemCount === 0;
                    return (
                      <div
                        key={idx}
                        className={`size-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                          isHero
                            ? "bg-emerald-500/20 border border-emerald-500 shadow-xs scale-105"
                            : "bg-muted/40 border border-border/40"
                        }`}
                      >
                        {isHero ? <Bot className="size-4" /> : hasGem ? <Gem className="size-4" /> : null}
                      </div>
                    );
                  })}
                </div>

                {/* Live Console Output Bar */}
                <div className="flex-1 flex items-center gap-1.5 rounded-xl border border-border/70 bg-background/90 px-2.5 py-2 font-mono text-[11px] text-foreground truncate shadow-2xs">
                  <Terminal className="size-3.5 text-primary shrink-0" />
                  <span className="truncate text-muted-foreground">{terminalLog}</span>
                </div>
              </div>
            </div>
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
