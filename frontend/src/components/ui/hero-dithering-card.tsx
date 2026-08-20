import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { Suspense, lazy, useState } from "react";
import { usePublicI18n } from "@/lib/i18n";
import { playSuccessSound } from "@/lib/sounds";
import { useAuthStore } from "@/stores/auth";

const Dithering = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({ default: mod.Dithering }))
);

interface CTASectionProps {
  authed?: boolean;
}

export function CTASection({ authed: propAuthed }: CTASectionProps) {
  const { isAuthenticated } = useAuthStore();
  const { t } = usePublicI18n();
  const authed = propAuthed ?? isAuthenticated;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="relative w-full flex justify-center items-center px-4 py-16 sm:px-6 lg:py-24 overflow-hidden select-none">
      <div
        className="w-full max-w-6xl relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative overflow-hidden rounded-[40px] sm:rounded-[48px] border border-border/80 bg-card shadow-2xl min-h-[520px] md:min-h-[580px] flex flex-col items-center justify-center transition-all duration-500">
          {/* Interactive Dithering Shader Background */}
          <Suspense fallback={<div className="absolute inset-0 bg-muted/20" />}>
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-30 mix-blend-multiply dark:mix-blend-screen">
              <Dithering
                colorBack="#00000000" // Transparent
                colorFront="#10b981"  // StudEd Emerald Green
                shape="warp"
                type="4x4"
                speed={isHovered ? 0.6 : 0.2}
                className="size-full"
                minPixelRatio={1}
              />
            </div>
          </Suspense>

          {/* Ambient Glows */}
          <div className="absolute -top-24 -left-24 size-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 size-96 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 px-6 max-w-4xl mx-auto text-center flex flex-col items-center py-12">
            {/* XP / Gamification Pill */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-primary backdrop-blur-md shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <Zap className="size-3.5 fill-current text-primary" />
              <span>+250 Explorer XP · Free Forever</span>
            </div>

            {/* Headline */}
            <h2 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground mb-6 leading-[1.06]">
              Master Every Concept, <br />
              <span className="italic text-primary">one wave at a time.</span>
            </h2>

            {/* Description */}
            <p className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
              Join thousands of Sri Lankan students learning math, science, and coding through interactive simulations, instant feedback, and gamified progress.
            </p>

            {/* CTA Actions */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              {authed ? (
                <Link
                  to="/dashboard"
                  className="group relative inline-flex h-14 items-center justify-center gap-3 overflow-hidden rounded-full bg-primary px-10 text-base font-bold text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:scale-105 active:scale-95 hover:ring-4 hover:ring-primary/20 shadow-md"
                >
                  <span className="relative z-10">{t("ctaPortal")}</span>
                  <ArrowRight className="h-5 w-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    onClick={() => playSuccessSound()}
                    className="group relative inline-flex h-14 items-center justify-center gap-3 overflow-hidden rounded-full bg-primary px-10 text-base font-bold text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:scale-105 active:scale-95 hover:ring-4 hover:ring-primary/20 shadow-md"
                  >
                    <span className="relative z-10">{t("finalCtaCreate")}</span>
                    <ArrowRight className="h-5 w-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                  <Link
                    to="/courses"
                    className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-border/80 bg-background/80 px-8 text-base font-semibold text-foreground backdrop-blur-md hover:bg-muted/80 transition-all shadow-xs"
                  >
                    <Sparkles className="size-4 text-primary" />
                    <span>{t("ctaBrowseCourses")}</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
