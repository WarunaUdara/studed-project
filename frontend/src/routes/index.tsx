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
import { CTAAuroraMesh } from "@/components/public/CTAAuroraMesh";
import { InteractiveHeroCard } from "@/components/public/InteractiveHeroCard";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/Card";
import { ScrollExpand } from "@/components/ui/ScrollExpand";
import { SplitText } from "@/components/ui/SplitText";
import { TextLoop } from "@/components/ui/TextLoop";
import { MagicBento, MagicBentoCard } from "@/components/ui/MagicBento";
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
      <TextLoopBanner />
      <Testimonials />
      <FinalCta authed={isAuthenticated} />
      <PublicFooter />
      <ScrollXpMeter />
    </div>
  );
}

/* ---------------------------------- Hero ---------------------------------- */

function Hero({ authed, ctaLink }: { authed: boolean; ctaLink: string }) {
  const { t, isSinhala } = usePublicI18n();
  const reduce = useReducedMotion();

  // In Sinhala, "Game එකක් ලෙසින්" wraps mid-phrase and the italic slant makes
  // the overflow invisible. Join the words with non-breaking spaces (Sinhala
  // only) so the tagline stays one unit instead of spilling past the layout.
  const effectiveHeroTitleB = isSinhala ? t("heroTitleB").replace(/ /g, "\u00A0") : t("heroTitleB");

  return (
    <section className="relative flex min-h-[90vh] items-center overflow-hidden px-4 pb-12 pt-16 sm:px-6 sm:pb-16 sm:pt-20 lg:pb-20 lg:pt-24">
      {/* Atmosphere: Subtle graph-paper dots */}
      <div aria-hidden className="pointer-events-none absolute inset-0 select-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(oklch(0.484 0.164 145 / 0.06) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "linear-gradient(to bottom, black 0%, transparent 80%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 80%)",
          }}
        />
        <div className="absolute -top-40 left-[-10%] h-[500px] w-[60vw] rounded-full bg-[radial-gradient(circle_at_center,oklch(0.484_0.164_145_/_0.08)_0%,transparent_70%)] blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        {/* Copy */}
        <div className="flex flex-col items-start gap-5 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center"
          >
            <LanguageToggle />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06 }}
            className="text-balance font-serif font-bold text-4xl leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            <span>{t("heroTitleA")}</span>
            <br />
            <span className="italic text-primary">
              <SplitText
                text={effectiveHeroTitleB}
                tag="span"
                splitType="chars"
                delay={30}
                duration={0.6}
                ease="power3.out"
                from={{ opacity: 0, y: 24 }}
                to={{ opacity: 1, y: 0 }}
                className="inline-block"
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.14 }}
            className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {t("heroSubtitle")}
          </motion.p>

          {/* Dual Audience Action Buttons (Learner vs Parent / Educator) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="flex flex-wrap items-center gap-3.5 pt-2"
          >
            {authed ? (
              <Button asChild size="lg" className="rounded-full px-8 py-6 text-base font-bold shadow-md">
                <Link to={ctaLink}>
                  <Zap className="h-5 w-5" />
                  {t("ctaPortal")}
                </Link>
              </Button>
            ) : (
              <>
                <Link to="/register">
                  <Button
                    size="lg"
                    className="h-13 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 text-base shadow-sm hover:shadow-md transition-all active:scale-98"
                  >
                    {t("ctaLearner")}
                  </Button>
                </Link>
                <Link to="/courses">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-13 rounded-full border-border/80 bg-card hover:bg-muted text-foreground font-semibold px-8 text-base shadow-xs hover:shadow-sm transition-all"
                  >
                    {t("ctaParentTeacher")}
                  </Button>
                </Link>
              </>
            )}
          </motion.div>

          {/* Clean Accreditation Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.38 }}
            className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-muted-foreground"
          >
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="size-4 fill-current" />
              <Star className="size-4 fill-current" />
              <Star className="size-4 fill-current" />
              <Star className="size-4 fill-current" />
              <Star className="size-4 fill-current" />
            </div>
            <span>{t("trustRow")}</span>
          </motion.div>
        </div>

        {/* Right: Clean Interactive Simulation Card */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <InteractiveHeroCard />
        </motion.div>
      </div>

      {/* Scroll cue */}
      {!reduce && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-muted-foreground sm:flex"
        >
          <span className="text-[11px] font-medium">{t("heroScrollHint")}</span>
        </motion.div>
      )}
    </section>
  );
}

/* ------------------------------ Text Loop Ribbon --------------------------- */

function TextLoopBanner() {
  const reduce = useReducedMotion();
  if (reduce) return null;

  return (
    <div className="relative py-2 overflow-hidden bg-transparent">
      <TextLoop
        text="StudEd ✦ Interactive STEM Learning ✦ Gamified Waves ✦ Real-Time Mastery ✦ Sri Lanka's Modern Platform ✦"
        shape="wave"
        speed={70}
        curviness={50}
        fontSize={16}
        fontWeight={700}
        letterSpacing={2}
        color="var(--primary)"
        ribbon
        ribbonColor="rgba(16, 185, 129, 0.08)"
        ribbonWidth={26}
        pauseOnHover={false}
      />
    </div>
  );
}

/* --------------------------------- Stats --------------------------------- */

function StatsBar() {
  const { t } = usePublicI18n();

  const stats: { to: number; label: string; icon: LucideIcon; separator?: string }[] = [
    { to: 13, label: t("statsGradeLevels"), icon: GraduationCap },
    { to: 24, label: t("statsSubjects"), icon: BookOpen },
    { to: 12500, label: t("statsLearners"), icon: Users, separator: "," },
    { to: 1840000, label: t("statsXpAwarded"), icon: Zap, separator: "," },
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
              <CountUp to={s.to} separator={s.separator || ""} duration={1.8} />
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
    <section className="relative overflow-hidden px-4 py-24 sm:px-6">
      {/* Upper Right Abstract Shape — slow decorative rotation */}
      <motion.img
        src="/abstract-shapes/Group 215.svg"
        alt=""
        aria-hidden
        initial={{ rotate: 90 }}
        animate={{ rotate: reduce ? 90 : 450 }}
        transition={{ duration: 90, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        className="absolute -top-36 -right-40 w-[580px] h-[580px] opacity-[0.10] dark:opacity-[0.05] pointer-events-none select-none"
      />
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
  const reduce = useReducedMotion();
  const [xpToastAmount, setXpToastAmount] = useState(0);

  const handleXpCardHover = () => {
    setXpToastAmount(50);
    playLevelUpSound();
  };

  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6">
      {/* Background Abstract Shapes on upper and bottom sides */}
      <motion.img
        src="/abstract-shapes/Group 216.svg"
        alt=""
        aria-hidden
        initial={{ rotate: 45 }}
        animate={{ rotate: reduce ? 45 : 405 }}
        transition={{ duration: 75, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        className="absolute -top-36 -right-36 w-[540px] h-[540px] opacity-[0.10] dark:opacity-[0.05] pointer-events-none select-none"
      />
      <img
        src="/abstract-shapes/Group 211.svg"
        alt=""
        aria-hidden
        className="absolute -bottom-36 -left-36 w-[580px] h-[580px] opacity-[0.22] dark:opacity-[0.14] pointer-events-none select-none -rotate-12"
      />
      <img
        src="/abstract-shapes/Union.svg"
        alt=""
        aria-hidden
        className="absolute -bottom-40 -right-40 w-[600px] h-[600px] opacity-[0.24] dark:opacity-[0.15] pointer-events-none select-none rotate-45"
      />
      <div className="mx-auto max-w-6xl">
        <SectionHeading title={t("gamificationHeading")} subhead={t("gamificationSubhead")} />

        <MagicBento className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {/* Live Leaderboard — Tall 1x2 Hero Card on the Left */}
          <MagicBentoCard
            enableStars={true}
            enableTilt={true}
            enableMagnetism={true}
            clickEffect={true}
            className="lg:col-span-1 lg:row-span-2 flex flex-col justify-between"
          >
            <div className="flex flex-col gap-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">{t("mechanicLeaderboardTitle")}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("mechanicLeaderboardCopy")}</p>
              </div>
            </div>
            <div className="pt-4">
              <LiveLeaderboard />
            </div>
          </MagicBentoCard>

          {/* XP & Levels — Top Middle */}
          <MagicBentoCard
            enableStars={true}
            enableTilt={true}
            enableMagnetism={true}
            clickEffect={true}
            onMouseEnter={handleXpCardHover}
            className="lg:col-span-1 lg:row-span-1 flex flex-col justify-between"
          >
            <div className="flex flex-col gap-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">{t("mechanicXpTitle")}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("mechanicXpCopy")}</p>
              </div>
            </div>
            <div className="pt-4">
              <XPBar totalXp={1750} />
            </div>
          </MagicBentoCard>

          {/* Daily Streaks — Top Right */}
          <MagicBentoCard
            enableStars={true}
            enableTilt={true}
            enableMagnetism={true}
            clickEffect={true}
            className="lg:col-span-1 lg:row-span-1 flex flex-col justify-between"
          >
            <div className="flex flex-col gap-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <Gamepad2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">{t("mechanicStreakTitle")}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("mechanicStreakCopy")}</p>
              </div>
            </div>
            <div className="pt-4">
              <StreakWeek />
            </div>
          </MagicBentoCard>

          {/* Proficiency Ladder — Wide 2x1 Hero Card at Bottom Right */}
          <MagicBentoCard
            enableStars={true}
            enableTilt={true}
            enableMagnetism={true}
            clickEffect={true}
            className="lg:col-span-2 lg:row-span-1 flex flex-col justify-between"
          >
            <div className="flex flex-col gap-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <LineChart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">{t("mechanicProficiencyTitle")}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("mechanicProficiencyCopy")}</p>
              </div>
            </div>
            <div className="pt-4">
              <ProficiencyLadder />
            </div>
          </MagicBentoCard>
        </MagicBento>
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
          <Button asChild variant="outline" className="gap-2 rounded-full">
            <Link to="/courses">
              <Compass className="h-4 w-4" />
              {t("catalogViewAll")}
            </Link>
          </Button>
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
    <section className="relative overflow-hidden px-4 py-24 sm:px-6">
      {/* Background Abstract Shape */}
      <img
        src="/abstract-shapes/Group 214.svg"
        alt=""
        aria-hidden
        className="absolute top-10 -right-28 w-[420px] h-[420px] opacity-[0.08] dark:opacity-[0.04] pointer-events-none select-none rotate-180"
      />
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
    <section id="pricing" className="relative overflow-hidden scroll-mt-20 px-4 py-24 sm:px-6">
      {/* Background Abstract Shape */}
      <img
        src="/abstract-shapes/Group 215.svg"
        alt=""
        aria-hidden
        className="absolute -top-28 -left-36 w-[480px] h-[480px] opacity-[0.08] dark:opacity-[0.04] pointer-events-none select-none -rotate-45"
      />
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
        <Button
          asChild
          className="w-full rounded-full"
          variant={tier.highlighted ? "default" : "outline"}
          onClick={() => playSuccessSound()}
        >
          <Link to={authed ? "/dashboard" : "/register"}>{tier.cta}</Link>
        </Button>
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

  return (
    <section className="relative px-4 pb-12 pt-4 sm:px-6">
      <div className="relative mx-auto max-w-5xl">
        <ScrollExpand
          useWindowScroll
          startWidth={48}
          startHeight={58}
          maxWidth={92}
          maxHeight={88}
          startRadius={20}
          endRadius={16}
          mediaZoom={1.25}
          scrollDistance={0.55}
          holdDistance={0.0}
          smoothing={0.0}
          overlayScrim={0.82}
          title={t("finalCtaHeading")}
          scrollHint="Scroll to Expand"
          className="w-full min-h-[460px] sm:min-h-[520px]"
          backgroundComponent={<CTAAuroraMesh />}
        >
            <div className="relative space-y-5 max-w-xl mx-auto text-center px-4">
              <p className="inline-flex items-center gap-2 rounded-full bg-primary/20 backdrop-blur-md px-4 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white ring-1 ring-primary/40 shadow-xs">
                <Zap className="h-3.5 w-3.5 fill-gold text-gold" />
                +250 XP
              </p>
              <h2 className="font-serif text-3xl font-normal tracking-tight text-white sm:text-5xl drop-shadow-md whitespace-pre-line">
                {t("finalCtaHeading")}
              </h2>
              <p className="mx-auto max-w-md text-pretty text-sm leading-relaxed text-white/90 sm:text-base drop-shadow-xs">
                {t("finalCtaSubhead")}
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-1">
                {authed ? (
                  <Button asChild size="lg" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md font-semibold px-6">
                    <Link to="/dashboard">
                      {t("ctaPortal")}
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button
                      asChild
                      size="lg"
                      className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md font-semibold px-6"
                      onClick={() => playSuccessSound()}
                    >
                      <Link to="/register">
                        {t("finalCtaCreate")}
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="rounded-full border-white/30 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 font-semibold px-6"
                    >
                      <Link to="/login">
                        {t("finalCtaSignin")}
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </ScrollExpand>
      </div>
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
