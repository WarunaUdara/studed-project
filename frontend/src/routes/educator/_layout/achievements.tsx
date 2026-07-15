import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Trophy, CheckCircle2, Award, Zap, HelpCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { AchievementBadge } from "@/components/ui/achievement-badge";
import { BADGE_DEFS } from "@/lib/gamification";

export const Route = createFileRoute("/educator/_layout/achievements")({
  component: EducatorAchievementsPage,
});

function EducatorAchievementsPage() {
  // Convert standard definitions into format expected by AchievementBadge
  const achievements = BADGE_DEFS.map((badge) => ({
    id: badge.id,
    name: badge.label,
    trigger: "metric" as const,
    // Display as unlocked preview in educator view
    achievedAt: new Date().toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gamification Badges</h1>
        <p className="mt-1 text-muted-foreground">
          Explore the milestones and awards students can unlock on the StudEd platform.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left 2 cols: Badges grid */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Trophy className="h-5 w-5 text-gold" />
                Platform Achievement Badges
              </CardTitle>
              <CardDescription>
                Preview of all 8 active student reward badges currently wired to lesson completion triggers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {achievements.map((badge) => (
                  <Card key={badge.id} className="flex flex-col items-center justify-center p-4 text-center border-muted hover:border-primary/30 transition-all hover:shadow-sm">
                    <AchievementBadge achievement={badge} badgeSize="md" />
                    <span className="mt-2 text-xs font-bold text-foreground truncate max-w-full">
                      {badge.name}
                    </span>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 col: Educator information & guides */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-md font-semibold">
                <Sparkles className="h-4 w-4 text-primary" />
                Gamification Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs text-muted-foreground">
              <p>
                StudEd incorporates positive reinforcement loops designed around cognitive learning principles.
              </p>
              
              <div className="flex gap-2 rounded-lg bg-background p-2.5 border">
                <Zap className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">XP Accumulation</p>
                  <p className="mt-0.5">Students earn XP by reading slides and answering wave questions accurately.</p>
                </div>
              </div>

              <div className="flex gap-2 rounded-lg bg-background p-2.5 border">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Daily Streaks</p>
                  <p className="mt-0.5">Consistently logging in and studying fuels the study flame, amplifying student engagement.</p>
                </div>
              </div>

              <div className="flex gap-2 rounded-lg bg-background p-2.5 border">
                <Award className="h-4 w-4 text-orange shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Badge Triggers</p>
                  <p className="mt-0.5">Badges are automatically unlocked when wave proficiency, completed courses, or Pomodoro sessions cross defined limits.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                Need Custom Badges?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>
                Custom achievements tied to specific course enrollment categories are currently planned for MVP Phase 2.
              </p>
              <p>
                Reach out to the platform administration console for special request curricula triggers.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
