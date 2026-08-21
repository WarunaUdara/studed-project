import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "urql";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { StudentShell } from "@/components/layout/StudentShell";
import { Card } from "@/components/ui/Card";
import { ACHIEVEMENTS_QUERY } from "@/graphql/courses";
import { sanitizeGraphQLError } from "@/lib/errors";
import { achievementStyle, earnedCount } from "@/lib/gamification";
import type { AchievementData, AchievementsQueryData } from "@/lib/graphqlTypes";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/achievements")({
  component: AchievementsPage,
});

function MedalIcon({ id, earned, tier }: { id: string; earned: boolean; tier: string }) {
  const color =
    tier === "gold"
      ? "text-amber-500 fill-amber-500/10 stroke-amber-600"
      : tier === "purple"
        ? "text-purple fill-purple/10 stroke-purple"
        : tier === "silver"
          ? "text-slate-400 fill-slate-400/10 stroke-slate-500"
          : "text-blue-500 fill-blue-500/10 stroke-blue-600";

  return (
    <svg
      role="img"
      aria-label="Medal achievement badge"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      className={cn(
        "h-16 w-16 transition-all",
        earned ? color : "text-muted-foreground/30 fill-none stroke-muted-foreground/40",
      )}
    >
      <title>Medal Badge</title>
      {/* Ribbon */}
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-6.75a1.125 1.125 0 0 0-1.125 1.125v3.375m9 0h-9"
      />
      {/* Medallion */}
      <circle cx="12" cy="9" r="6" strokeLinejoin="round" />
      {/* Engraved details */}
      {id === "first_wave" && <path strokeLinecap="round" d="M12 7v4m-2-2h4" />}
      {id === "perfect_score" && <circle cx="12" cy="9" r="2" />}
      {id === "lesson_complete" && <path strokeLinecap="round" d="M10 9.5h4M10 8.5h4" />}
      {id === "lesson_proficient" && (
        <path strokeLinecap="round" d="M12 6.5l1 2h2l-1.5 1 0.5 2-2-1-2 1 0.5-2-1.5-1h2z" />
      )}
      {id === "rising_star" && <path strokeLinecap="round" d="M12 7v4" />}
      {id === "scholar" && <path strokeLinecap="round" d="M9.5 11l2.5-3 2.5 3" />}
      {id === "master" && <path strokeLinecap="round" d="M8.5 9.5h7" />}
      {id === "first_course" && <path strokeLinecap="round" d="M12 6v6m-3-3l3 3 3-3" />}
    </svg>
  );
}

function AchievementsPage() {
  // The unlock rules live in gamification-service. This page renders what the
  // API says was earned; it does not re-derive it. Two copies of those rules
  // had drifted, and the client's read a staler XP total than the server's.
  const [{ data, fetching, error }] = useQuery<AchievementsQueryData>({
    query: ACHIEVEMENTS_QUERY,
  });

  const badges: AchievementData[] = useMemo(() => data?.achievements ?? [], [data]);
  const badgesEarned = earnedCount(badges);

  // Group badges by category
  const categories = useMemo(() => {
    return [
      {
        title: "Milestones",
        description: "Completing waves, lessons, and entire syllabus courses.",
        accent: "text-blue-500",
        badgeIds: ["first_wave", "lesson_complete", "first_course"],
      },
      {
        title: "Mastery",
        description: "Achieving high accuracy and perfect scores.",
        accent: "text-amber-500",
        badgeIds: ["perfect_score", "lesson_proficient"],
      },
      {
        title: "Consistency",
        description: "Climbing thresholds by earning high total XP.",
        accent: "text-amber-500",
        badgeIds: ["rising_star", "scholar", "master"],
      },
    ];
  }, []);

  // Genuinely most-recent, by the server's unlock timestamps, rather than
  // whichever three happened to sit last in a hardcoded catalog order.
  const recentlyEarned = useMemo(() => {
    return badges
      .filter((b) => b.unlocked && b.unlockedAt)
      .sort((a, b) => new Date(b.unlockedAt ?? 0).getTime() - new Date(a.unlockedAt ?? 0).getTime())
      .slice(0, 3);
  }, [badges]);

  const completionPercent =
    badges.length > 0 ? Math.round((badgesEarned / badges.length) * 100) : 0;

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <StudentShell>
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-primary/80 block">
                Achievements
              </span>
              <h1 className="text-4xl font-normal font-serif text-foreground sm:text-5xl">
                What you've earned.
              </h1>
              <p className="text-muted-foreground text-sm">
                Your permanent study honours and milestones. Engraved medals represent completed
                paths.
              </p>
            </div>

            {/* Unlocked progress strip */}
            <div className="space-y-2 max-w-md">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <span>
                  {badgesEarned} of {badges.length} unlocked
                </span>
                <span>{completionPercent}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Recently Unlocked Highlight Row */}
          {recentlyEarned.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Star className="h-4 w-4 text-amber-500" /> Recently Unlocked
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
                {recentlyEarned.map((b) => (
                  <Card
                    key={`recent-${b.id}`}
                    className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-gold/10 border border-amber-500/25 p-5 flex items-center gap-4 rounded-[24px]"
                  >
                    <MedalIcon id={b.id} earned={true} tier={achievementStyle(b.id).tier} />
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold truncate text-amber-900">{b.name}</h4>
                      <p className="text-[11px] text-amber-800 line-clamp-2 leading-snug mt-0.5">
                        {b.description}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Category Groups list */}
          <div className="space-y-8">
            {categories.map((cat) => {
              const catBadges = badges.filter((b) => cat.badgeIds.includes(b.id));
              return (
                <div key={cat.title} className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="text-lg font-serif font-normal flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          cat.title === "Milestones"
                            ? "bg-blue-500"
                            : cat.title === "Mastery"
                              ? "bg-amber-500"
                              : "bg-purple",
                        )}
                      />
                      {cat.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {fetching ? (
                      [1, 2, 3].map((n) => (
                        <div
                          key={`skel-${cat.title}-${n}`}
                          className="h-48 rounded-[24px] bg-muted animate-pulse border"
                        />
                      ))
                    ) : error ? (
                      <div className="p-8 text-center border-b col-span-full">
                        <p className="font-medium text-destructive">
                          {sanitizeGraphQLError(error).title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {sanitizeGraphQLError(error).message}
                        </p>
                      </div>
                    ) : (
                      catBadges.map((b) => {
                        const tier = achievementStyle(b.id).tier;
                        return (
                          <div
                            key={b.id}
                            data-testid={`achievement-${b.id}`}
                            data-unlocked={b.unlocked}
                            className={cn(
                              "flex flex-col items-center justify-between rounded-[24px] border p-5 text-center transition-all bg-card min-h-[200px]",
                              b.unlocked
                                ? "hover:border-primary/45 shadow-sm hover:shadow-md"
                                : "opacity-60",
                              tier === "purple" && b.unlocked && "border-purple/35",
                              tier === "gold" && b.unlocked && "border-amber-500/35",
                            )}
                          >
                            <div className="flex flex-col items-center gap-3">
                              <MedalIcon id={b.id} earned={b.unlocked} tier={tier} />
                              <div>
                                <h4 className="text-sm font-semibold">{b.name}</h4>
                                <p className="text-[11px] text-muted-foreground leading-tight mt-1">
                                  {b.description}
                                </p>
                              </div>
                            </div>

                            <div className="w-full mt-4">
                              {b.unlocked ? (
                                <span className="text-[9px] font-bold text-success uppercase tracking-wider bg-success/10 px-2 py-0.5 rounded-full inline-block">
                                  Unlocked
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider bg-muted px-2 py-0.5 rounded-full inline-block">
                                  Locked
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </StudentShell>
    </ProtectedRoute>
  );
}
