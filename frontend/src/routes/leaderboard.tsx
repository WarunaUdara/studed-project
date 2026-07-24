import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Crown, Minus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "urql";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { StudentShell } from "@/components/layout/StudentShell";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { LEADERBOARD_QUERY } from "@/graphql/courses";
import { sanitizeGraphQLError } from "@/lib/errors";
import { privateLeaderboardName } from "@/lib/gamification";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
});

type Scope = "GLOBAL" | "GRADE" | "COURSE" | "WEEKLY" | "FRIENDS";
type Period = "THIS_WEEK" | "ALL_TIME";

const SCOPE_TABS: Array<{ value: Scope; label: string }> = [
  { value: "GLOBAL", label: "Global" },
  { value: "GRADE", label: "Grade-wide" },
  { value: "COURSE", label: "Course-wide" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "FRIENDS", label: "Friends" },
];

const MOCK_SCHOOLS = [
  "Royal College, Colombo",
  "Visakha Vidyalaya, Colombo",
  "Ananda College, Colombo",
  "Nalanda College, Colombo",
  "Musaeus College, Colombo",
  "St. Thomas' College, Mount Lavinia",
  "Ladies' College, Colombo",
  "Trinity College, Kandy",
  "Mahamaya Girls' College, Kandy",
  "Richmond College, Galle",
];

function getMockSchool(id: string, index: number) {
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) + index;
  return MOCK_SCHOOLS[hash % MOCK_SCHOOLS.length];
}

interface LeaderboardEntry {
  rank: number;
  user: { id: string; fullName: string };
  totalXp: number;
}

function LeaderboardPage() {
  const { user } = useAuthStore();
  const youId = user?.id ?? "";

  const [scope, setScope] = useState<Scope>("GLOBAL");
  const [period, setPeriod] = useState<Period>("THIS_WEEK");
  const [query, setQuery] = useState("");

  const [{ data, fetching, error }] = useQuery({
    query: LEADERBOARD_QUERY,
    variables: { scope },
  });

  const leaderboard: LeaderboardEntry[] = useMemo(
    () => (data?.leaderboard ?? []) as LeaderboardEntry[],
    [data],
  );

  const myEntry = leaderboard.find((e) => e.user.id === youId);
  const myRank = myEntry?.rank ?? null;
  const myXp = myEntry?.totalXp ?? user?.totalXp ?? 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leaderboard;
    return leaderboard.filter((e) =>
      privateLeaderboardName(e.user.fullName).toLowerCase().includes(q),
    );
  }, [leaderboard, query]);

  // Extract Podium (Top 3) and general ranks (4-50)
  const podium = useMemo(() => {
    const top3 = leaderboard.slice(0, 3);
    const result: Record<number, LeaderboardEntry | null> = { 1: null, 2: null, 3: null };
    for (const entry of top3) {
      result[entry.rank] = entry;
    }
    return result;
  }, [leaderboard]);

  const tableList = useMemo(() => {
    return filtered.filter((e) => e.rank > 3).slice(0, 47); // ranks 4-50
  }, [filtered]);

  const isUserInTop50 = useMemo(() => {
    if (!myRank) return false;
    return myRank <= 50;
  }, [myRank]);

  const total = leaderboard.length;

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <StudentShell>
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-primary/80 block">
              Rankings
            </span>
            <h1 className="text-4xl font-normal font-serif text-foreground sm:text-5xl">
              Where you stand.
            </h1>
            <p className="text-muted-foreground text-sm">
              Honours and standing across Sri Lankan schools and the global student cohort.
            </p>
          </div>

          {/* Scope and Period segment selectors */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar rounded-full bg-muted/60 p-1 shrink-0">
              {SCOPE_TABS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setScope(t.value)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all shrink-0 min-h-[36px]",
                    scope === t.value
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex rounded-full bg-muted/60 p-1">
                {(["THIS_WEEK", "ALL_TIME"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "rounded-full px-3.5 py-1 text-xs font-semibold transition-all",
                      period === p
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {p === "THIS_WEEK" ? "This Week" : "All Time"}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name..."
                  className="h-9 w-full sm:w-48 pl-8 pr-3 rounded-full border bg-card text-xs outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Editorial Podium */}
          {!fetching && !error && leaderboard.length > 0 && (
            <div className="flex flex-col items-center justify-center py-6 px-4">
              <div className="flex items-end justify-center gap-4 w-full max-w-lg">
                {/* 2nd Place */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="mb-2 text-center">
                    <p className="text-xs font-bold text-muted-foreground truncate max-w-[100px]">
                      {podium[2] ? privateLeaderboardName(podium[2].user.fullName) : "---"}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {podium[2] ? `${podium[2].totalXp.toLocaleString()} XP` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-center bg-card border border-border/80 rounded-t-[20px] p-4 h-[120px] w-full text-center justify-center shadow-sm">
                    <span className="text-4xl font-serif font-semibold italic text-muted-foreground mb-1">
                      2
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                      Silver
                    </span>
                  </div>
                </div>

                {/* 1st Place */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="mb-2 text-center">
                    <p className="text-sm font-bold text-foreground truncate max-w-[120px]">
                      {podium[1] ? privateLeaderboardName(podium[1].user.fullName) : "---"}
                    </p>
                    <p className="text-xs text-primary font-mono font-bold">
                      {podium[1] ? `${podium[1].totalXp.toLocaleString()} XP` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-center bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-gold/10 border-2 border-amber-500/25 rounded-t-[24px] p-5 h-[160px] w-full text-center justify-center shadow-md relative">
                    <Crown className="absolute -top-6 h-6 w-6 text-gold fill-gold/20 animate-bounce" />
                    <span className="text-5xl font-serif font-semibold italic text-amber-600 mb-1">
                      1
                    </span>
                    <span className="text-[9px] font-bold text-amber-700 uppercase tracking-widest">
                      Gold
                    </span>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="mb-2 text-center">
                    <p className="text-xs font-bold text-muted-foreground truncate max-w-[100px]">
                      {podium[3] ? privateLeaderboardName(podium[3].user.fullName) : "---"}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {podium[3] ? `${podium[3].totalXp.toLocaleString()} XP` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-center bg-card border border-border/80 rounded-t-[20px] p-4 h-[100px] w-full text-center justify-center shadow-sm">
                    <span className="text-3xl font-serif font-semibold italic text-amber-800 mb-1">
                      3
                    </span>
                    <span className="text-[9px] font-bold text-amber-800 uppercase tracking-widest">
                      Bronze
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-full max-w-lg h-[1px] bg-border/60" />
            </div>
          )}

          {/* Rankings list card */}
          <Card className="rounded-[24px] overflow-hidden">
            <CardContent className="p-0">
              {fetching ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <Skeleton key={idx} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : error ? (
                <div className="p-8 text-center border-b">
                  <p className="font-medium text-destructive">
                    {sanitizeGraphQLError(error).title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sanitizeGraphQLError(error).message}
                  </p>
                </div>
              ) : total === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground">
                  Be the first to join the leaderboard by completing a wave!
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {tableList.map((entry, idx) => {
                    const isYou = entry.user.id === youId;
                    const delta =
                      entry.rank % 3 === 0 ? "up" : entry.rank % 5 === 0 ? "down" : "flat";
                    return (
                      <div
                        key={entry.user.id}
                        className={cn(
                          "h-[56px] px-6 flex items-center justify-between transition-colors",
                          isYou ? "bg-primary/5" : "hover:bg-muted/40",
                        )}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="text-base font-serif font-semibold text-muted-foreground w-6 text-center">
                            {entry.rank}
                          </span>
                          <span className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-serif font-bold shrink-0">
                            {entry.user.fullName[0]}
                          </span>
                          <div className="min-w-0">
                            <p
                              className={cn(
                                "text-sm truncate",
                                isYou ? "font-bold text-primary" : "font-medium text-foreground",
                              )}
                            >
                              {privateLeaderboardName(entry.user.fullName)}
                              {isYou && (
                                <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-sans uppercase font-bold">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {getMockSchool(entry.user.id, idx)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <span className="text-xs font-bold tabular-nums text-foreground">
                            {entry.totalXp.toLocaleString()}{" "}
                            <span className="text-[10px] text-muted-foreground font-normal">
                              XP
                            </span>
                          </span>
                          <span className="w-5 flex justify-center">
                            {delta === "up" && <ArrowUp className="h-3.5 w-3.5 text-success" />}
                            {delta === "down" && (
                              <ArrowDown className="h-3.5 w-3.5 text-destructive" />
                            )}
                            {delta === "flat" && (
                              <Minus className="h-3.5 w-3.5 text-muted-foreground/60" />
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Pinned User Row if not in top 50 */}
                  {!isUserInTop50 && myEntry && (
                    <div className="h-[56px] px-6 flex items-center justify-between bg-primary/10 border-t border-primary/20 sticky bottom-0">
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-base font-serif font-semibold text-primary w-6 text-center">
                          {myRank}
                        </span>
                        <span className="h-8 w-8 rounded-full bg-primary/25 text-primary flex items-center justify-center text-xs font-serif font-bold shrink-0">
                          {user?.fullName[0]}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-primary truncate">
                            {privateLeaderboardName(user?.fullName ?? "")}
                            <span className="ml-2 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-sans uppercase font-bold">
                              You
                            </span>
                          </p>
                          <p className="text-[10px] text-primary/80 truncate">
                            {getMockSchool(youId, 42)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-xs font-bold tabular-nums text-primary">
                          {myXp.toLocaleString()}{" "}
                          <span className="text-[10px] text-primary/70 font-normal">XP</span>
                        </span>
                        <span className="w-5 flex justify-center">
                          <ArrowUp className="h-3.5 w-3.5 text-primary" />
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* League promotion mechanic */}
          <div className="rounded-[24px] bg-muted/40 p-5 border text-center max-w-md mx-auto">
            <p className="text-xs text-muted-foreground font-medium">
              Top 10 finishers this week will earn promotion to the{" "}
              <span className="font-bold text-amber-600">Gold League</span>. Standing resets every
              Monday 00:00.
            </p>
          </div>
        </div>
      </StudentShell>
    </ProtectedRoute>
  );
}
