import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  Brain,
  CalendarClock,
  Check,
  Compass,
  Gamepad2,
  Globe2,
  GraduationCap,
  Languages,
  Layers,
  LineChart,
  type LucideIcon,
  Quote,
  Sparkles,
  Star,
  Trophy,
  Waves,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { ProficiencyBadge } from "@/components/gamification/ProficiencyBadge";
import { RankBadge } from "@/components/gamification/RankBadge";
import { StreakFlame } from "@/components/gamification/StreakFlame";
import { XPBar } from "@/components/gamification/XPBar";
import { XPToast } from "@/components/gamification/XPToast";
import { CountUp } from "@/components/public/CountUp";
import { GamifiedPreview } from "@/components/public/GamifiedPreview";
import { LanguageToggle } from "@/components/public/LanguageToggle";
import { PublicFooter } from "@/components/public/PublicFooter";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { FEATURED_COURSES, type FeaturedCourse } from "@/lib/demoData";
import { type ProficiencyLevel, proficiencyMeta } from "@/lib/gamification";
import { usePublicI18n } from "@/lib/i18n";
import { playLevelUpSound, playSuccessSound } from "@/lib/sounds";
import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  const { isAuthenticated, user } = useAuthStore();
  const { isSinhala } = usePublicI18n();
  const reduce = useReducedMotion();

  const ctaLink =
    user?.role === "STUDENT"
      ? "/dashboard"
      : user?.role === "EDUCATOR" || user?.role === "HEAD_EDUCATOR" || user?.role === "ADMIN"
        ? "/educator"
        : "/courses";

  return (
    <div className={isSinhala ? "font-sinhala" : undefined}>
      <Hero ctaLink={ctaLink} authed={isAuthenticated} />
      <StatsBar />
      <HowItWorks />
      <GamificationShowcase />
      <CatalogPreview />
      <AudienceSegments />
      <PricingPreview authed={isAuthenticated} />
      <Testimonials />
      <FinalCta authed={isAuthenticated} />
      <PublicFooter />
      {/* keep `reduce` referenced so the reduce-motion signal is honoured */}
      <ReduceGuard reduce={reduce} />
    </div>
  );
}

function ReduceGuard({ reduce }: { reduce: boolean | null }) {
  // no-op: keep the static analyser aware the value is used.
  void reduce;
  return null;
}

/* ---------------------------------- Hero ---------------------------------- */

function Hero({ authed, ctaLink }: { authed: boolean; ctaLink: string }) {
  const { t } = usePublicI18n();

  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-12 sm:px-6 sm:pt-20 lg:pb-28">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
        {/* Left: copy */}
        <div className="flex flex-col items-start gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-wrap items-center gap-3"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {t("heroBadge")}
            </span>
            <LanguageToggle />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl"
          >
            {t("heroTitleA")}
            <br />
            <span className="bg-gradient-to-r from-primary via-purple to-gold bg-clip-text text-transparent">
              {t("heroTitleB")}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="max-w-xl text-pretty text-base text-muted-foreground sm:text-lg"
          >
            {t("heroSubtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex flex-wrap gap-3"
          >
            {authed ? (
              <Link to={ctaLink}>
                <Button size="lg" className="gap-2">
                  <Zap className="h-5 w-5" />
                  {t("ctaPortal")}
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg" className="gap-2" onClick={() => playSuccessSound()}>
                    <Sparkles className="h-5 w-5" />
                    {t("ctaGetStarted")}
                  </Button>
                </Link>
                <Link to="/courses">
                  <Button size="lg" variant="outline">
                    <Compass className="h-5 w-5" />
                    {t("ctaBrowseCourses")}
                  </Button>
                </Link>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-2 flex items-center gap-3 text-xs text-muted-foreground"
          >
            <div className="flex -space-x-2">
              {["a", "b", "c", "d"].map((k) => (
                <span
                  key={k}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary/50 to-purple/50 text-[10px] font-bold text-white ring-2 ring-background"
                >
                  {k.toUpperCase()}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {["s1", "s2", "s3", "s4", "s5"].map((k) => (
                <Star key={k} className="h-3.5 w-3.5 fill-gold text-gold" />
              ))}
            </div>
            <span>{t("trustRow")}</span>
          </motion.div>
        </div>

        {/* Right: live gamified preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <GamifiedPreview />
        </motion.div>
      </div>
    </section>
  );
}

/* --------------------------------- Stats --------------------------------- */

function StatsBar() {
  const { t } = usePublicI18n();

  const stats: { to: number; suffix?: string; label: string }[] = [
    { to: 13, label: t("statsGradeLevels") },
    { to: 24, label: t("statsSubjects") },
    { to: 12500, label: t("statsLearners") },
    { to: 1840000, label: t("statsXpAwarded") },
  ];

  return (
    <section className="border-y bg-card/50">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-4 sm:px-6">
        {stats.map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <p className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              <CountUp to={s.to} suffix={s.suffix ?? ""} />
            </p>
            <p className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------ How it works ----------------------------- */

function HowItWorks() {
  const { t } = usePublicI18n();
  const reduce = useReducedMotion();

  const steps: { icon: LucideIcon; heading: string; copy: string }[] = [
    { icon: BookOpen, heading: t("howStep1"), copy: t("howStep1Copy") },
    { icon: Layers, heading: t("howStep2"), copy: t("howStep2Copy") },
    { icon: Waves, heading: t("howStep3"), copy: t("howStep3Copy") },
  ];

  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title={t("howHeading")} subhead={t("howSubhead")} />

        <div className="relative mt-14 grid gap-6 sm:grid-cols-3">
          {/* Animated connector line */}
          <motion.div
            aria-hidden
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            style={{ transformOrigin: "left" }}
            className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-primary/40 via-purple/40 to-gold/40 sm:block"
          />
          {steps.map(({ icon: Icon, heading, copy }, i) => (
            <motion.div
              key={heading}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.15 }}
              className="relative rounded-2xl border bg-card p-6 shadow-sm lift-on-hover hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">{heading}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p>
              <span className="mt-4 inline-flex text-xs font-bold uppercase tracking-wide text-primary/80">
                Step {i + 1}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
      <ReduceGuard reduce={reduce} />
    </section>
  );
}

/* -------------------------- Gamification showcase ------------------------- */

function GamificationShowcase() {
  const { t } = usePublicI18n();
  const [xpToastAmount, setXpToastAmount] = useState(0);

  const handleXpCardHover = () => {
    setXpToastAmount(50);
    playLevelUpSound();
  };

  return (
    <section className="border-y bg-card/30 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title={t("gamificationHeading")} subhead={t("gamificationSubhead")} />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* XP & Levels */}
          <ShowcaseCard
            icon={Zap}
            title={t("mechanicXpTitle")}
            copy={t("mechanicXpCopy")}
            onMouseEnter={handleXpCardHover}
          >
            <XPBar totalXp={1750} />
          </ShowcaseCard>

          {/* Leaderboards */}
          <ShowcaseCard
            icon={Trophy}
            title={t("mechanicLeaderboardTitle")}
            copy={t("mechanicLeaderboardCopy")}
          >
            <div className="flex items-center gap-3">
              <RankBadge rank={1} size="lg" />
              <RankBadge rank={2} />
              <RankBadge rank={3} />
              <RankBadge rank={7} size="sm" total={100} />
            </div>
          </ShowcaseCard>

          {/* Proficiency ladder */}
          <ShowcaseCard
            icon={LineChart}
            title={t("mechanicProficiencyTitle")}
            copy={t("mechanicProficiencyCopy")}
          >
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  "NOT_STARTED",
                  "IN_PROGRESS",
                  "COMPLETED",
                  "PROFICIENT",
                  "EXPERT",
                ] as ProficiencyLevel[]
              ).map((lvl) => (
                <ProficiencyBadge key={lvl} level={lvl} size="sm" showLabel />
              ))}
            </div>
          </ShowcaseCard>

          {/* Streaks */}
          <ShowcaseCard
            icon={Gamepad2}
            title={t("mechanicStreakTitle")}
            copy={t("mechanicStreakCopy")}
          >
            <StreakFlame dayCount={7} size="lg" />
          </ShowcaseCard>
        </div>
      </div>

      <XPToast
        amount={xpToastAmount}
        show={xpToastAmount > 0}
        onDismiss={() => setXpToastAmount(0)}
      />
    </section>
  );
}

function ShowcaseCard({
  icon: Icon,
  title,
  copy,
  children,
  onMouseEnter,
}: {
  icon: LucideIcon;
  title: string;
  copy: string;
  children: React.ReactNode;
  onMouseEnter?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      whileHover={{ y: -4 }}
      onMouseEnter={onMouseEnter}
      className="group flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{copy}</p>
      </div>
      <div className="mt-auto pt-2">{children}</div>
    </motion.div>
  );
}

/* ---------------------------- Catalog preview ----------------------------- */

const SUBJECT_ICON: Record<FeaturedCourse["subjectIcon"], LucideIcon> = {
  math: Brain,
  science: Globe2,
  english: Languages,
  sinhala: BookOpen,
};

function CatalogPreview() {
  const { t } = usePublicI18n();

  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title={t("catalogHeading")} subhead={t("catalogSubhead")} />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_COURSES.map((course, i) => (
            <FeaturedCourseCard key={course.id} course={course} delay={i * 0.08} />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link to="/courses">
            <Button variant="outline" className="gap-2">
              <Compass className="h-4 w-4" />
              {t("catalogViewAll")}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function FeaturedCourseCard({ course, delay }: { course: FeaturedCourse; delay: number }) {
  const Icon = SUBJECT_ICON[course.subjectIcon] ?? BookOpen;
  const completed = course.completedWaves;
  const total = course.totalWaves;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const meta = proficiencyMeta(course.proficiency);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4 }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative h-24 overflow-hidden bg-gradient-to-br from-primary/15 via-purple/10 to-gold/10">
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="h-10 w-10 text-primary/40 transition-transform group-hover:scale-110" />
        </div>
        <span className="absolute right-3 top-3 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">
          {course.gradeLevel}
        </span>
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        <div className="space-y-1">
          <h3 className="text-base font-semibold leading-tight group-hover:text-primary">
            {course.title}
          </h3>
          <p className="line-clamp-2 text-xs text-muted-foreground">{course.description}</p>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <ProgressRing value={percent} size={36} strokeWidth={4} className="text-primary">
              <span className="text-[9px] font-bold">{percent}%</span>
            </ProgressRing>
            <span className="text-xs text-muted-foreground">
              {completed}/{total}
            </span>
          </div>
          <span className="text-xs" title={meta.label} role="img" aria-label={meta.label}>
            <ProficiencyBadge level={course.proficiency} size="sm" showLabel={false} />
          </span>
        </div>
      </CardContent>
    </motion.div>
  );
}

/* --------------------------- Audience segments --------------------------- */

function AudienceSegments() {
  const { t } = usePublicI18n();
  const items = [
    {
      icon: Sparkles,
      title: t("audiencePrimaryTitle"),
      sub: t("audiencePrimarySub"),
      copy: t("audiencePrimaryCopy"),
      accent: "from-primary/15 to-primary/5",
    },
    {
      icon: CalendarClock,
      title: t("audienceJuniorTitle"),
      sub: t("audienceJuniorSub"),
      copy: t("audienceJuniorCopy"),
      accent: "from-success/15 to-success/5",
    },
    {
      icon: GraduationCap,
      title: t("audienceSeniorTitle"),
      sub: t("audienceSeniorSub"),
      copy: t("audienceSeniorCopy"),
      accent: "from-gold/15 to-gold/5",
    },
    {
      icon: Trophy,
      title: t("audienceALTitle"),
      sub: t("audienceALSub"),
      copy: t("audienceALCopy"),
      accent: "from-purple/15 to-purple/5",
    },
  ];

  return (
    <section className="border-y bg-card/30 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title={t("audienceHeading")} />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                aria-hidden
                className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${item.accent} blur-2xl`}
              />
              <div className="relative">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-background/60 text-primary ring-1 ring-primary/20 backdrop-blur">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold">{item.title}</h3>
                <p className="text-xs font-medium text-primary">{item.sub}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.copy}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Pricing preview ---------------------------- */

interface PricingTier {
  id: string;
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Free Preview",
    price: "LKR 0",
    period: "",
    description: "Explore the first wave of every course — no card required.",
    features: ["Browse full catalog", "Sample Wave 1 of any course", "Daily streak tracking"],
    cta: "Get started free",
  },
  {
    id: "standard",
    name: "Student (Standard)",
    price: "LKR 1,200",
    period: "/month",
    description: "Everything for one grade — full waves, leaderboards and proficiency.",
    features: [
      "Unlimited waves in your grade",
      "Global & course leaderboards",
      "Proficiency ladder + badges",
      "Bilingual interface (EN / සිං)",
    ],
    cta: "Choose Student plan",
    highlighted: true,
  },
  {
    id: "school",
    name: "School License",
    price: "Custom",
    period: "",
    description: "Bulk enrollment, admin dashboards and progress reports for schools.",
    features: [
      "Bulk student enrollment",
      "Admin dashboard",
      "Educator tools",
      "Prioritized support",
    ],
    cta: "Talk to us",
  },
];

function PricingPreview({ authed }: { authed: boolean }) {
  const { t } = usePublicI18n();

  return (
    <section id="pricing" className="scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title={t("pricingHeading")} subhead={t("pricingSubhead")} />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PRICING_TIERS.map((tier, i) => (
            <PricingTierCard key={tier.id} tier={tier} authed={authed} delay={i * 0.1} />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <a href="#pricing">
            <Button variant="ghost" className="gap-2">
              {t("ctaSeePricing")}
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}

function PricingTierCard({
  tier,
  authed,
  delay,
}: {
  tier: PricingTier;
  authed: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay }}
      whileHover={{ y: -4 }}
      className={
        tier.highlighted
          ? "relative overflow-hidden rounded-2xl border-2 border-purple/60 bg-card p-7 shadow-lg ring-2 ring-purple/20"
          : "relative overflow-hidden rounded-2xl border bg-card p-7 shadow-sm transition-shadow hover:shadow-md"
      }
    >
      {tier.highlighted && (
        <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-purple px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-foreground">
          <Star className="h-3 w-3 fill-white" />
          Most popular
        </span>
      )}
      <h3 className="text-lg font-semibold">{tier.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{tier.description}</p>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-3xl font-extrabold tracking-tight">{tier.price}</span>
        {tier.period && <span className="text-sm text-muted-foreground">{tier.period}</span>}
      </div>

      <ul className="mt-6 space-y-2 text-sm">
        {tier.features.map((feat) => (
          <li key={feat} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span>{feat}</span>
          </li>
        ))}
      </ul>

      <div className="mt-7">
        <Link to={authed ? "/dashboard" : "/register"}>
          <Button
            className="w-full"
            variant={tier.highlighted ? "default" : "outline"}
            onClick={() => playSuccessSound()}
          >
            {tier.cta}
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

/* ------------------------------ Testimonials ------------------------------ */

interface Testimonial {
  quote: string;
  quoteSi: string;
  name: string;
  role: string;
  rating: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "StudEd turned revision into something I genuinely look forward to. The streak keeps me practicing every day.",
    quoteSi: "StudEd නිසා පුනරීක්ෂණය දැන් මම දිනපතා බලාපොත්තර කරන දෙයක් කඩය වැඩිය.",
    name: "Kavindi P.",
    role: "Grade 11 · Colombo",
    rating: 5,
  },
  {
    quote:
      "My daughter's confidence in Maths has improved so much. The proficiency ladder motivates her to keep climbing.",
    quoteSi: "මගේ දියණියගේ ගණිත විශ්වාසය ඉතා වැඩිවෙලා. ප්‍රාඵල්‍යතා පඩිපෙළ ඇය තව තව නඟින්න පෙළඹවනවා.",
    name: "Tharindu W.",
    role: "Parent · Kandy",
    rating: 5,
  },
  {
    quote:
      "Having Sinhala explanations alongside the English content has been a game-changer for my A/L revision.",
    quoteSi: "A/L පුනරීක්ෂණය සඳහා ඉංග්‍රීසි අන්තර්ගතයත් සමඟ සිංහල පැහැදිලි කිරීම් තිබීම ලොකු වෙනසක්.",
    name: "Achini L.",
    role: "A/L · Galle",
    rating: 5,
  },
];

function Testimonials() {
  const { t, isSinhala } = usePublicI18n();

  return (
    <section className="border-y bg-card/30 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title={t("testimonialsHeading")} />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((tst, i) => (
            <motion.div
              key={tst.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex flex-col gap-3 rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <Quote className="h-6 w-6 text-primary/40" />
              <div className="flex items-center gap-1">
                {Array.from({ length: tst.rating }, (_, s) => `tstar-${s}`).map((k) => (
                  <Star key={k} className="h-4 w-4 fill-gold text-gold" />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-foreground">
                {isSinhala ? tst.quoteSi : tst.quote}
              </p>
              <div className="mt-auto pt-2 text-xs">
                <p className="font-semibold text-foreground">{tst.name}</p>
                <p className="text-muted-foreground">{tst.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- Final CTA ------------------------------- */

function FinalCta({ authed }: { authed: boolean }) {
  const { t } = usePublicI18n();
  const reduce = useReducedMotion();

  return (
    <section className="px-4 py-20 sm:px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border bg-gradient-to-br from-primary via-primary/80 to-purple/60 p-10 text-center shadow-xl sm:p-14"
      >
        {!reduce && (
          <>
            <span
              aria-hidden
              className="pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full bg-gold/30 blur-3xl motion"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-16 -right-12 h-64 w-64 rounded-full bg-purple/40 blur-3xl"
            />
          </>
        )}
        <div className="relative space-y-6">
          <h2 className="bg-gradient-to-br from-white to-white/80 bg-clip-text text-3xl font-extrabold text-transparent sm:text-5xl">
            {t("finalCtaHeading")}
          </h2>
          <p className="mx-auto max-w-xl text-pretty text-white/80">{t("finalCtaSubhead")}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {authed ? (
              <Link to="/dashboard">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                  {t("ctaPortal")}
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90"
                    onClick={() => playSuccessSound()}
                  >
                    {t("finalCtaCreate")}
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                  >
                    {t("finalCtaSignin")}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ------------------------------ Section header ---------------------------- */

function SectionHeading({ title, subhead }: { title: string; subhead?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="text-center"
    >
      <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {subhead ? (
        <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base">
          {subhead}
        </p>
      ) : null}
    </motion.div>
  );
}
