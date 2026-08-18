import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { BookOpen, Gift, Sparkles, Star, Trophy, Zap } from "lucide-react";
import { Progress } from "@/components/ui/Progress";

/**
 * Marketing panel beside the login card.
 *
 * Colours come exclusively from the theme-aware `login-*` token pairs defined in
 * index.css, so this file carries no light/dark branching of its own. Note that
 * green *text* uses `login-accent`, not `brand-green`: the brand green is
 * 1.74:1 on white and is only usable as a fill in light theme.
 */

interface BrandFeature {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  /** Chip fill + icon colour pair from the login token set. */
  chipClassName: string;
}

const FEATURES: BrandFeature[] = [
  {
    icon: BookOpen,
    title: "Structured Course",
    subtitle: "Lesson by lesson • Wave learning",
    chipClassName: "bg-login-chip-green text-login-chip-green-fg",
  },
  {
    icon: Zap,
    title: "Earn XP and level up",
    subtitle: "as you learn",
    chipClassName: "bg-login-chip-purple text-login-chip-purple-fg",
  },
  {
    icon: Trophy,
    title: "Compete on global &",
    subtitle: "course leaderboards",
    chipClassName: "bg-login-chip-gold text-login-chip-gold-fg",
  },
  {
    icon: Sparkles,
    title: "AI-assisted content",
    subtitle: "with Sinhala support",
    chipClassName: "bg-login-chip-blue text-login-chip-blue-fg",
  },
];

const QUEST_COMPLETED = 3;
const QUEST_TOTAL = 5;

export function LoginBrandPanel() {
  return (
    <div className="bg-login-panel-brand relative hidden w-1/2 overflow-hidden lg:flex">
      {/* Soft light bloom behind the island, above the base gradient. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-0 size-[38rem] -translate-y-1/2 translate-x-1/4 rounded-full bg-brand-green/10 blur-3xl"
      />

      <div className="relative flex w-full items-stretch gap-6 p-10 short:gap-4 short:p-8 xl:p-14 xl:short:p-10">
        {/* Copy column. min-w-0 lets the headline shrink instead of colliding
            with the island lane at the lg breakpoint. */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <Wordmark />

            <p className="mt-4 text-base leading-snug font-medium text-login-ink short:mt-3">
              Premium learning for
              <br />
              <span className="text-login-accent">Sri Lankan schools</span>
            </p>

            <h1 className="mt-10 text-5xl leading-[0.95] font-extrabold tracking-tight text-login-ink short:mt-6 xl:text-6xl xl:short:text-5xl">
              Learn.
              <br />
              Play.
              <br />
              <span className="text-login-accent">Level Up.</span>
            </h1>

            <p className="mt-5 text-base leading-snug text-login-ink-body short:mt-4">
              Your adventure to master new skills{" "}
              <span className="font-semibold text-login-accent">starts here!</span>
            </p>
          </div>

          <ul className="my-8 space-y-4 short:my-5 short:space-y-3">
            {FEATURES.map((feature) => (
              <FeatureRow key={feature.title} {...feature} />
            ))}
          </ul>

          <DailyQuestCard />
        </div>

        {/* Island lane. Keeping the hero in its own flex column guarantees it
            never overlaps the copy, at any viewport width. */}
        <div className="relative w-2/5 shrink-0">
          <img
            src="/covers/mascot/hero-island.png"
            alt=""
            aria-hidden="true"
            width={1024}
            height={1024}
            fetchPriority="high"
            className="animate-float pointer-events-none absolute top-1/2 left-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 select-none"
          />
        </div>
      </div>
    </div>
  );
}

function Wordmark() {
  return (
    <Link
      to="/"
      title="Back to home"
      aria-label="StudEd Home"
      className="group relative inline-flex items-start transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-login-accent focus-visible:ring-offset-2 rounded-md"
    >
      <span className="text-4xl font-extrabold tracking-tight text-login-ink">
        Stud<span className="text-login-accent">Ed</span>
      </span>
      <span
        aria-hidden="true"
        className="-mt-1 ml-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-login-badge transition-transform group-hover:scale-110"
      >
        <Star className="size-3 fill-login-badge-ink text-login-badge-ink" />
      </span>
    </Link>
  );
}

function FeatureRow({ icon: Icon, title, subtitle, chipClassName }: BrandFeature) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-full ${chipClassName}`}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-login-ink">{title}</span>
        <span className="block text-sm text-login-ink-muted">{subtitle}</span>
      </span>
    </li>
  );
}

function DailyQuestCard() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-login-quest-border bg-login-quest px-4 py-3 shadow-login-quest">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-login-ink">Daily Quest</p>
        <p className="text-xs text-login-ink-muted">Complete a lesson</p>
        <div className="mt-2 flex items-center gap-3">
          <Progress
            value={QUEST_COMPLETED}
            max={QUEST_TOTAL}
            className="h-2 flex-1 bg-login-line [&>div]:bg-login-accent"
            aria-label={`Daily quest progress: ${QUEST_COMPLETED} of ${QUEST_TOTAL} complete`}
          />
          <span className="shrink-0 text-xs font-semibold text-login-ink-body">
            {QUEST_COMPLETED} / {QUEST_TOTAL}
          </span>
        </div>
      </div>
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-login-gift"
      >
        <Gift className="size-5 text-login-gift-fg" />
      </span>
    </div>
  );
}
