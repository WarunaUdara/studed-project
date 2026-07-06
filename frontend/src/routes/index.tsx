import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, GraduationCap, Trophy } from "lucide-react";
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
      <section className="bg-muted/50 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
            Learn smarter with StudEd
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Premium e-learning for Sri Lankan schools. Structured courses, interactive lessons, and
            gamified practice tests for Grade 1-11, O/L and A/L.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            {isAuthenticated ? (
              <Link to={ctaLink}>
                <Button size="lg">Go to your portal</Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg">Get started</Button>
                </Link>
                <Link to="/courses">
                  <Button variant="outline" size="lg">
                    Browse courses
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-3">
            <FeatureCard
              icon={<BookOpen className="h-8 w-8 text-primary" />}
              title="Course → Lesson → Wave"
              description="Bite-sized learning units with a Learn phase and an Evaluate phase."
            />
            <FeatureCard
              icon={<GraduationCap className="h-8 w-8 text-primary" />}
              title="Grade-aligned content"
              description="Curriculum mapped to local grades from Grade 1 to A/L."
            />
            <FeatureCard
              icon={<Trophy className="h-8 w-8 text-primary" />}
              title="Gamified progress"
              description="Earn XP, climb leaderboards, and track proficiency as you learn."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
