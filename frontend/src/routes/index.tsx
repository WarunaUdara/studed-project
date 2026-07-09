import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { GraduationCap, Sparkles, Trophy, Waves, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  const { isAuthenticated, user } = useAuthStore();

  const ctaLink =
    user?.role === "STUDENT"
      ? "/dashboard"
      : user?.role === "EDUCATOR" || user?.role === "HEAD_EDUCATOR" || user?.role === "ADMIN"
        ? "/educator"
        : "/courses";

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Premium learning for Sri Lankan schools
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 bg-gradient-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-4xl font-extrabold leading-tight tracking-tight text-transparent sm:text-6xl"
          >
            Learn smarter,
            <br />
            <span className="bg-gradient-to-r from-primary via-purple to-gold bg-clip-text text-transparent">
              level up faster
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
          >
            Structured courses, interactive lessons, and gamified practice tests for Grade 1–11, O/L
            and A/L. Earn XP, climb leaderboards, and master every subject.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex justify-center gap-4"
          >
            {isAuthenticated ? (
              <Link to={ctaLink}>
                <Button size="lg" className="gap-2">
                  <Zap className="h-5 w-5" />
                  Go to your portal
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg" className="gap-2">
                    <Sparkles className="h-5 w-5" />
                    Get started free
                  </Button>
                </Link>
                <Link to="/courses">
                  <Button variant="outline" size="lg">
                    Browse courses
                  </Button>
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y bg-card/50 py-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 sm:grid-cols-4 sm:px-6">
          <StatItem value="13" label="Grade levels" />
          <StatItem value="3" label="Learning phases" />
          <StatItem value="∞" label="Waves of content" />
          <StatItem value="100%" label="Curriculum-aligned" />
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to excel
            </h2>
            <p className="mt-4 text-muted-foreground">
              A modern learning platform designed for how students actually learn.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <FeatureCard
              icon={<Waves className="h-7 w-7" />}
              title="Course → Lesson → Wave"
              description="Bite-sized learning units, each with a Learn phase and an Evaluate phase. Progress at your own pace."
              gradient="from-primary/20 to-primary/5"
              delay={0}
            />
            <FeatureCard
              icon={<GraduationCap className="h-7 w-7" />}
              title="Grade-aligned content"
              description="Curriculum mapped to local grades from Grade 1 through A/L. Sinhala language support included."
              gradient="from-purple/20 to-purple/5"
              delay={0.1}
            />
            <FeatureCard
              icon={<Trophy className="h-7 w-7" />}
              title="Gamified progress"
              description="Earn XP, climb leaderboards, unlock badges, and track proficiency as you master each subject."
              gradient="from-gold/20 to-gold/5"
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="px-4 py-20 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-4xl overflow-hidden rounded-3xl border bg-gradient-to-br from-primary via-primary/80 to-purple/60 p-12 text-center"
          >
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to start learning?</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/80">
              Join StudEd today and unlock structured courses, interactive waves, and gamified
              progress tracking.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link to="/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                >
                  Create your account
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                  Sign in
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>
      )}
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-extrabold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-lg"
    >
      <div
        className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${gradient} blur-2xl transition-opacity group-hover:opacity-100 opacity-50`}
      />
      <div className="relative mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
        {icon}
      </div>
      <h3 className="relative text-lg font-semibold">{title}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </motion.div>
  );
}
