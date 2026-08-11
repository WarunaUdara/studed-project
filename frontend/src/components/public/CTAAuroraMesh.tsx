import { useMemo } from "react";

export function CTAAuroraMesh() {
  const particles = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => ({
      id: `p-${i}`,
      left: `${(i * 17 + 7) % 90}%`,
      top: `${(i * 23 + 13) % 85}%`,
      size: `${(i % 3) * 6 + 8}px`,
      duration: `${(i % 4) * 2 + 5}s`,
      delay: `${(i % 3) * 1.5}s`,
      opacity: (i % 3) * 0.2 + 0.35,
    }));
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 select-none">
      {/* Animated Aurora Glow Gradients */}
      <div className="absolute inset-0 opacity-70">
        <div className="absolute -top-1/4 -left-1/4 w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.35),transparent_60%)] animate-pulse" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_bottom_right,rgba(13,148,136,0.35),transparent_60%)] animate-pulse [animation-delay:2s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.12),transparent_70%)]" />
      </div>

      {/* Grid Pattern Wash */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* Ambient Floating Gamification Sparkles */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-emerald-400/60 blur-[2px] animate-bounce"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDuration: p.duration,
            animationDelay: p.delay,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}

export default CTAAuroraMesh;
