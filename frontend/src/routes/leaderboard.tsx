import { createFileRoute, Link } from "@tanstack/react-router";
import { Crown, Search, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "urql";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LeaderboardRow } from "@/components/gamification/LeaderboardRow";
import type { LeaderboardEntry } from "@/components/gamification/LeaderboardTable";
import { RankBadge } from "@/components/gamification/RankBadge";
import { StudentShell } from "@/components/layout/StudentShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { LEADERBOARD_QUERY } from "@/graphql/courses";
import { buildDemoLeaderboard } from "@/lib/demoData";
import { sanitizeGraphQLError } from "@/lib/errors";
import { privateLeaderboardName } from "@/lib/gamification";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
});

type Scope = "GLOBAL" | "COURSE" | "GRADE" | "WEEKLY" | "FRIENDS";

const SCOPE_TABS: Array<{ value: Scope; label: string }> = [
  { value: "GLOBAL", label: "Global" },
  { value: "GRADE", label: "Grade" },
  { value: "COURSE", label: "Course" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "FRIENDS", label: "Friends" },
];

const SKELETON_KEYS = [
  "lb-skel-1",
  "lb-skel-2",
  "lb-skel-3",
  "lb-skel-4",
  "lb-skel-5",
  "lb-skel-6",
];

function LeaderboardPage() {
  const { user } = useAuthStore();
  const youId = user?.id ?? "demo-you";
  const youXp = user?.totalXp ?? 3120;

  const [scope, setScope] = useState<Scope>("GLOBAL");
  const [query, setQuery] = useState("");

  const [{ data, fetching, error }] = useQuery({
    query: LEADERBOARD_QUERY,
    variables: { scope },
  });

  const leaderboard: LeaderboardEntry[] = useMemo(() => {
    const real = data?.leaderboard ?? [];
    if (real.length === 0) {
      return buildDemoLeaderboard(youId, youXp);
    }
    return real as LeaderboardEntry[];
  }, [data, youId, youXp]);

  const myEntry = leaderboard.find((e) => e.user.id === youId);
  const myRank = myEntry?.rank ?? 42;
  const myXp = myEntry?.totalXp ?? youXp;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leaderboard;
    return leaderboard.filter((e) =>
      privateLeaderboardName(e.user.fullName).toLowerCase().includes(q),
    );
  }, [leaderboard, query]);

  const visible = filtered.slice(0, 25);
  const total = leaderboard.length;

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <StudentShell>
        {/* Page header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-gold" />
            <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
          </div>
          <p className="text-muted-foreground">
            Climb the ranks as you earn XP. The top of the board takes 🥇🥈🥉, the top 10% earn ⭐,
            the top 1% earn 👑, and the top 10% earn 💎.
          </p>
        </div>

        {/* Your rank hero — "You are #42" */}
        <Card className="overflow-hidden border-primary/30">
          <CardContent className="flex flex-col items-center justify-between gap-4 p-5 sm:flex-row">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/30">
                <TrendingUp className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Your current rank</p>
                <p className="text-2xl font-extrabold tracking-tight">
                  <RankBadge rank={myRank} total={total} size="lg" /> #{myRank}{" "}
                  <span className="text-muted-foreground font-medium">/ {total}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {myXp.toLocaleString()} XP · keep going!
                </p>
              </div>
            </div>
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                View your stats
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Scope tabs + search */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-xl">Rankings</CardTitle>
                <CardDescription>
                  {SCOPE_TABS.find((t) => t.value === scope)?.label} · {total} learners
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name"
                  className="h-9 w-full pl-8 sm:w-64"
                  aria-label="Search leaderboard"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1 rounded-xl bg-muted/60 p-1">
              {SCOPE_TABS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setScope(t.value)}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:flex-none",
                    scope === t.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-pressed={scope === t.value}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {fetching ? (
              <div className="space-y-2">
                {SKELETON_KEYS.map((k) => (
                  <Skeleton key={k} className="h-10 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-xl border border-dashed p-6 text-center">
                <p className="font-medium">{sanitizeGraphQLError(error).title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {sanitizeGraphQLError(error).message}
                </p>
              </div>
            ) : visible.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No learners match “{query}”.
              </div>
            ) : (
              <ol className="space-y-1.5">
                {visible.map((entry) => (
                  <LeaderboardRow
                    key={`${entry.rank}-${entry.user.id}`}
                    entry={entry}
                    isYou={entry.user.id === youId}
                    total={total}
                  />
                ))}
              </ol>
            )}
            {total > 25 && (
              <div className="mt-4 flex justify-center">
                <Button variant="ghost" size="sm">
                  View Full Top {Math.min(100, total)}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </StudentShell>
    </ProtectedRoute>
  );
}
