import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { BookOpen, Gift, Languages, Star, Trophy, Zap } from "lucide-react";
import { Progress } from "@/components/ui/Progress";

/**
 * Marketing panel beside the register card.
 *
 * Uses the exact same design system tokens and visual hierarchy as LoginBrandPanel
 * for perfect brand consistency and theme responsiveness.
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
    title: "Curriculum Aligned",
    subtitle: "Grade 1–11, O/L & A/L content",
    chipClassName: "bg-login-chip-green text-login-chip-green-fg",
  },
  {
    icon: Zap,
    title: "Starter XP & Badges",
    subtitle: "Earn rewards right from day one",
    chipClassName: "bg-login-chip-purple text-login-chip-purple-fg",
  },
  {
    icon: Trophy,
    title: "Leaderboard & Quests",
    subtitle: "Compete with friends & classmates",
    chipClassName: "bg-login-chip-gold text-login-chip-gold-fg",
  },
  {
    icon: Languages,
    title: "Trilingual Learning",
    subtitle: "English, Sinhala & Tamil support",
    chipClassName: "bg-login-chip-blue text-login-chip-blue-fg",
  },
];

const STARTER_XP = 100;
const LEVEL_1_TARGET = 100;

export function RegisterBrandPanel() {
  return (
    <div className="bg-login-panel-brand relative hidden w-1/2 h-full shrink-0 overflow-hidden lg:flex">
      {/* Soft light bloom behind the island, above the base gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-0 size-[38rem] -translate-y-1/2 translate-x-1/4 rounded-full bg-brand-green/10 blur-3xl"
      />

      <div className="relative flex w-full items-stretch gap-6 p-10 short:gap-4 short:p-8 xl:p-14 xl:short:p-10">
        {/* Copy column */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <Wordmark />

            <p className="mt-4 text-base leading-snug font-medium text-login-ink short:mt-3">
              Premium learning for
              <br />
              <span className="text-login-accent">Sri Lankan schools</span>
            </p>

            <h1 className="mt-10 text-5xl leading-[0.95] font-extrabold tracking-tight text-login-ink short:mt-6 xl:text-6xl xl:short:text-5xl">
              Start.
              <br />
              Learn.
              <br />
              <span className="text-login-accent">Level Up.</span>
            </h1>

            <p className="mt-5 text-base leading-snug text-login-ink-body short:mt-4">
              Join thousands of students and{" "}
              <span className="font-semibold text-login-accent">start your adventure!</span>
            </p>
          </div>

          <ul className="my-8 space-y-4 short:my-5 short:space-y-3">
            {FEATURES.map((feature) => (
              <FeatureRow key={feature.title} {...feature} />
            ))}
          </ul>

          <StarterQuestCard />
        </div>

        {/* Floating 3D Island lane */}
        <div className="relative w-2/5 shrink-0">
          <img
            src="/covers/mascot/hero-island.png"
            alt="StudEd 3D Island Mascot"
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

function StarterQuestCard() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-login-quest-border bg-login-quest px-4 py-3 shadow-login-quest">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold text-login-ink">Starter Quest</p>
          <span className="rounded-full bg-login-chip-purple/15 px-2 py-0.5 text-[10px] font-bold text-login-chip-purple-fg">
            NEW
          </span>
        </div>
        <p className="text-xs text-login-ink-muted">Create account to claim Welcome XP</p>
        <div className="mt-2 flex items-center gap-3">
          <Progress
            value={STARTER_XP}
            max={LEVEL_1_TARGET}
            className="h-2 flex-1 bg-login-line [&>div]:bg-login-accent"
            aria-label={`Welcome bonus: ${STARTER_XP} XP`}
          />
          <span className="shrink-0 text-xs font-semibold text-login-ink-body">
            +{STARTER_XP} XP Bonus
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
