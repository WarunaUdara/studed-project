import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  Brain,
  CalendarClock,
  Check,
  ChevronDown,
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
  Users,
  Waves,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { ProficiencyBadge } from "@/components/gamification/ProficiencyBadge";
import { StreakFlame } from "@/components/gamification/StreakFlame";
import { XPBar } from "@/components/gamification/XPBar";
import { XPToast } from "@/components/gamification/XPToast";
import { CountUp } from "@/components/public/CountUp";
import { LanguageToggle } from "@/components/public/LanguageToggle";
import { LiveLeaderboard } from "@/components/public/LiveLeaderboard";
import { PlayableWave } from "@/components/public/PlayableWave";
import { PublicFooter } from "@/components/public/PublicFooter";
import { ScrollXpMeter } from "@/components/public/ScrollXpMeter";
import { WaveMapHero } from "@/components/public/WaveMapHero";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { FEATURED_COURSES, type FeaturedCourse } from "@/lib/demoData";
import { type ProficiencyLevel, proficiencyMeta } from "@/lib/gamification";
import { usePublicI18n } from "@/lib/i18n";
import { playLevelUpSound, playSuccessSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  const { isAuthenticated, user } = useAuthStore();
  const { isSinhala } = usePublicI18n();

  const ctaLink =
    user?.role === "STUDENT"
      ? "/dashboard"
      : user?.role === "EDUCATOR" || user?.role === "HEAD_EDUCATOR" || user?.role === "ADMIN"
        ? "/educator"
        : "/courses";

  return (
    <div className={cn(isSinhala && "font-sinhala")}>
      <Hero ctaLink={ctaLink} authed={isAuthenticated} />
      <StatsBar />
      <HowItWorks />
      <PlayableWaveSection />
      <GamificationShowcase />
      <CatalogPreview />
      <AudienceSegments />
      <PricingPreview authed={isAuthenticated} />
      <Testimonials />
      <FinalCta authed={isAuthenticated} />
      <PublicFooter />
      <ScrollXpMeter />
    </div>
  );
}

/* ---------------------------------- Hero ---------------------------------- */

function Hero({ authed, ctaLink }: { authed: boolean; ctaLink: string }) {
  const { t } = usePublicI18n();
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-32 sm:px-6 sm:pt-40">
      {/* Atmosphere: graph-paper dots + soft brand washes */}
      <div aria-hidden className="pointer-events-none absolute inset-0 select-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(oklch(0.546 0.215 262.9 / 0.07) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "linear-gradient(to bottom, black 0%, transparent 80%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 80%)",
          }}
        />
        <div className="absolute -top-40 left-[-15%] h-[560px] w-[70vw] rounded-full bg-[radial-gradient(circle_at_center,oklch(0.546_0.215_262.9_/_0.16)_0%,transparent_70%)] blur-[100px]" />
        <div className="absolute -top-32 right-[-15%] h-[520px] w-[60vw] rounded-full bg-[radial-gradient(circle_at_center,oklch(0.541_0.281_293_/_0.14)_0%,transparent_70%)] blur-[100px]" />
        <div className="absolute bottom-[-20%] left-1/2 h-[420px] w-[70vw] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,oklch(0.696_0.17_162.5_/_0.08)_0%,transparent_70%)] blur-[110px]" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Copy */}
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
            <span className="inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/5 px-3 py-1.5 text-xs font-medium text-success">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              {t("heroLiveChip")}
            </span>
            <LanguageToggle />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06 }}
            className="text-balance font-serif text-5xl leading-[1.05] text-foreground sm:text-6xl lg:text-7xl"
          >
            {t("heroTitleA")}
            <br />
            <span className="italic text-primary">{t("heroTitleB")}</span>
            <span className="text-primary">.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {t("heroSubtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.26 }}
            className="flex flex-wrap gap-3"
          >
            {authed ? (
              <Link to={ctaLink}>
                <Button size="lg" className="gap-2 rounded-full px-8">
                  <Zap className="h-5 w-5" />
                  {t("ctaPortal")}
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button
                    size="lg"
                    className="gap-2 rounded-full px-8 shadow-lg shadow-primary/25"
                    onClick={() => playSuccessSound()}
                  >
                    <Zap className="h-5 w-5" />
                    {t("ctaGetStarted")}
                  </Button>
                </Link>
                <Link to="/courses">
                  <Button size="lg" variant="outline" className="gap-2 rounded-full px-8">
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
            transition={{ duration: 0.55, delay: 0.38 }}
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

        {/* Interactive wave map */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <WaveMapHero />
        </motion.div>
      </div>

      {/* Scroll cue — feeds the Explorer XP meter */}
      {!reduce && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-muted-foreground sm:flex"
        >
          <span className="text-[11px] font-medium">{t("heroScrollHint")}</span>
          <motion.span
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </motion.div>
      )}
    </section>
  );
}

/* --------------------------------- Stats --------------------------------- */

function StatsBar() {
  const { t } = usePublicI18n();

  const stats: { to: number; label: string; icon: LucideIcon }[] = [
    { to: 13, label: t("statsGradeLevels"), icon: GraduationCap },
    { to: 24, label: t("statsSubjects"), icon: BookOpen },
    { to: 12500, label: t("statsLearners"), icon: Users },
    { to: 1840000, label: t("statsXpAwarded"), icon: Zap },
  ];

  return (
    <section className="border-y bg-card/50">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 sm:grid-cols-4 sm:px-6">
        {stats.map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-2 text-center"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <s.icon className="h-4.5 w-4.5" />
            </span>
            <p className="text-3xl font-extrabold tabular-nums tracking-tight text-foreground sm:text-4xl">
              <CountUp to={s.to} />
            </p>
            <p className="text-xs font-medium text-muted-foreground sm:text-sm">{s.label}</p>
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

  const steps: { icon: LucideIcon; heading: string; copy: string; num: string }[] = [
    { icon: BookOpen, heading: t("howStep1"), copy: t("howStep1Copy"), num: "01" },
    { icon: Layers, heading: t("howStep2"), copy: t("howStep2Copy"), num: "02" },
    { icon: Waves, heading: t("howStep3"), copy: t("howStep3Copy"), num: "03" },
  ];

  return (
    <section className="px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title={t("howHeading")} subhead={t("howSubhead")} />

        <div className="relative mt-14 grid gap-6 sm:grid-cols-3">
          {/* Connector line with a travelling packet */}
          <motion.div
            aria-hidden
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            style={{ transformOrigin: "left" }}
            className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-primary/40 via-purple/40 to-gold/40 sm:block"
          />
          {!reduce && (
            <motion.span
              aria-hidden
              className="absolute top-10 hidden h-2 w-2 -translate-y-1/2 rounded-full bg-primary shadow-md shadow-primary/40 sm:block"
              animate={{ left: ["2%", "98%"], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
          )}
          {steps.map(({ icon: Icon, heading, copy, num }, i) => (
            <motion.div
              key={heading}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.15 }}
              className="relative rounded-3xl border bg-card p-7 shadow-sm lift-on-hover hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="font-serif text-3xl italic text-primary/30">{num}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{heading}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Playable wave ------------------------------ */

function PlayableWaveSection() {
  const { t } = usePublicI18n();
  return (
    <section className="border-y bg-gradient-intelligence px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title={t("playHeading")} subhead={t("playSubhead")} />
        <div className="mt-12">
          <PlayableWave />
        </div>
      </div>
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
    <section className="px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title={t("gamificationHeading")} subhead={t("gamificationSubhead")} />

        <div className="mt-12 grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* XP & Levels */}
          <ShowcaseCard
            icon={Zap}
            title={t("mechanicXpTitle")}
            copy={t("mechanicXpCopy")}
            onMouseEnter={handleXpCardHover}
          >
            <XPBar totalXp={1750} />
          </ShowcaseCard>

          {/* Live leaderboard */}
          <ShowcaseCard
            icon={Trophy}
            title={t("mechanicLeaderboardTitle")}
            copy={t("mechanicLeaderboardCopy")}
          >
            <LiveLeaderboard />
          </ShowcaseCard>

          {/* Proficiency ladder */}
          <ShowcaseCard
            icon={LineChart}
            title={t("mechanicProficiencyTitle")}
            copy={t("mechanicProficiencyCopy")}
          >
            <ProficiencyLadder />
          </ShowcaseCard>

          {/* Streaks */}
          <ShowcaseCard
            icon={Gamepad2}
            title={t("mechanicStreakTitle")}
            copy={t("mechanicStreakCopy")}
          >
            <StreakWeek />
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

/** Five-step proficiency ladder with an animated fill up to Proficient. */
function ProficiencyLadder() {
  const levels: ProficiencyLevel[] = [
    "NOT_STARTED",
    "IN_PROGRESS",
    "COMPLETED",
    "PROFICIENT",
    "EXPERT",
  ];

  return (
    <div className="pt-1">
      <div className="relative flex items-center justify-between">
        <div
          aria-hidden
          className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border"
        />
        <motion.div
          aria-hidden
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 0.75 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
          style={{ transformOrigin: "left" }}
          className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-border via-success to-gold"
        />
        {levels.map((lvl) => (
          <div
            key={lvl}
            className="relative z-10 bg-card px-0.5"
            title={proficiencyMeta(lvl).label}
          >
            <ProficiencyBadge level={lvl} size="sm" showLabel={false} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-[9px] font-medium text-muted-foreground">
        <span>Start</span>
        <span className="text-gold">Proficient</span>
        <span className="text-purple">Expert</span>
      </div>
    </div>
  );
}

/** Seven-day streak strip: flame + checked weekday dots. */
function StreakWeek() {
  const days = [
    { id: "mon", label: "M" },
    { id: "tue", label: "T" },
    { id: "wed", label: "W" },
    { id: "thu", label: "T" },
    { id: "fri", label: "F" },
    { id: "sat", label: "S" },
    { id: "sun", label: "S" },
  ];
  return (
    <div className="flex flex-col gap-3 pt-1">
      <StreakFlame dayCount={7} size="lg" />
      <div className="flex items-center gap-1.5">
        {days.map((day, i) => (
          <div key={day.id} className="flex flex-col items-center gap-1">
            <motion.span
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.07, type: "spring", stiffness: 300, damping: 16 }}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-success/15 text-success ring-1 ring-success/30"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </motion.span>
            <span className="text-[9px] font-medium text-muted-foreground">{day.label}</span>
          </div>
        ))}
      </div>
    </div>
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
      className="group flex flex-col gap-4 rounded-3xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
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

const SUBJECT_COVER: Record<FeaturedCourse["subjectIcon"], string> = {
  math: "from-primary/20 via-primary/8 to-transparent",
  science: "from-success/20 via-success/8 to-transparent",
  english: "from-purple/20 via-purple/8 to-transparent",
  sinhala: "from-gold/20 via-gold/8 to-transparent",
};

function CatalogPreview() {
  const { t } = usePublicI18n();

  return (
    <section className="border-y bg-card/30 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title={t("catalogHeading")} subhead={t("catalogSubhead")} />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_COURSES.map((course, i) => (
            <FeaturedCourseCard key={course.id} course={course} delay={i * 0.08} />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link to="/courses">
            <Button variant="outline" className="gap-2 rounded-full">
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
      className="group flex h-full flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <div
        className={cn(
          "relative h-24 overflow-hidden bg-gradient-to-br",
          SUBJECT_COVER[course.subjectIcon],
        )}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="h-10 w-10 text-foreground/25 transition-transform group-hover:scale-110" />
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
    <section className="px-4 py-24 sm:px-6">
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
              className="relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                aria-hidden
                className={cn(
                  "absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br blur-2xl",
                  item.accent,
                )}
              />
              <div className="relative">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-background/60 text-primary ring-1 ring-primary/20 backdrop-blur">
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
      "Bilingual interface (EN / SI)",
    ],
    cta: "Choose Student plan",
    highlighted: true,
  },
  {
    id: "school",
    name: "School License",
    price: "Custom",
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
    <section id="pricing" className="scroll-mt-20 border-y bg-card/30 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title={t("pricingHeading")} subhead={t("pricingSubhead")} />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PRICING_TIERS.map((tier, i) => (
            <PricingTierCard key={tier.id} tier={tier} authed={authed} delay={i * 0.1} />
          ))}
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
  const { t } = usePublicI18n();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay }}
      whileHover={{ y: -4 }}
      className={
        tier.highlighted
          ? "relative overflow-hidden rounded-3xl border-2 border-purple/60 bg-card p-7 shadow-xl shadow-purple/10 ring-2 ring-purple/20"
          : "relative overflow-hidden rounded-3xl border bg-card p-7 shadow-sm transition-shadow hover:shadow-md"
      }
    >
      {tier.highlighted && (
        <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-purple px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-foreground">
          <Star className="h-3 w-3 fill-white" />
          {t("pricingMostPopular")}
        </span>
      )}
      <h3 className="text-lg font-semibold">{tier.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{tier.description}</p>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-3xl font-extrabold tabular-nums tracking-tight">{tier.price}</span>
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
            className="w-full rounded-full"
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
    <section className="px-4 py-24 sm:px-6">
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
              className="flex flex-col gap-3 rounded-3xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
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
    <section className="px-4 pb-24 pt-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border bg-gradient-to-br from-primary via-primary/85 to-purple/70 p-10 text-center shadow-2xl sm:p-16"
      >
        {!reduce && (
          <>
            <span
              aria-hidden
              className="pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full bg-gold/30 blur-3xl"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-16 -right-12 h-64 w-64 rounded-full bg-purple/40 blur-3xl"
            />
          </>
        )}
        <div className="relative space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/90 ring-1 ring-white/20">
            <Zap className="h-3.5 w-3.5 fill-gold text-gold" />
            +250 XP
          </p>
          <h2 className="font-serif text-4xl text-white sm:text-6xl">{t("finalCtaHeading")}</h2>
          <p className="mx-auto max-w-xl text-pretty text-white/80">{t("finalCtaSubhead")}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {authed ? (
              <Link to="/dashboard">
                <Button size="lg" className="rounded-full bg-white text-primary hover:bg-white/90">
                  {t("ctaPortal")}
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button
                    size="lg"
                    className="rounded-full bg-white text-primary hover:bg-white/90"
                    onClick={() => playSuccessSound()}
                  >
                    {t("finalCtaCreate")}
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20"
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
      <h2 className="text-balance font-serif text-4xl text-foreground sm:text-5xl">{title}</h2>
      {subhead ? (
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          {subhead}
        </p>
      ) : null}
    </motion.div>
  );
}
