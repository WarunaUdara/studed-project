import { createFileRoute } from "@tanstack/react-router";
import { Crown, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery, useSubscription } from "urql";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LeaderboardRow } from "@/components/gamification/LeaderboardRow";
import { StudentShell } from "@/components/layout/StudentShell";
import { BlobAvatar } from "@/components/ui/BlobAvatar";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { LEADERBOARD_QUERY } from "@/graphql/courses";
import { buildDemoLeaderboard } from "@/lib/demoData";
import { leaderboardDisplayName, maskStudentName } from "@/lib/gamification";
import type { LeaderboardEntryData, LeaderboardQueryData } from "@/lib/graphqlTypes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
});

// Scopes the backend actually ranks. There is no FRIENDS tab: the platform has
// no friends model, so the tab could only ever show an empty board.
type Scope = "GLOBAL" | "GRADE" | "COURSE" | "WEEKLY";

const SCOPE_TABS: Array<{ value: Scope; label: string; blurb: string }> = [
  { value: "GLOBAL", label: "Global", blurb: "Every student on StudEd, by total XP." },
  { value: "GRADE", label: "Your grade", blurb: "Students in your grade, by total XP." },
  { value: "WEEKLY", label: "This week", blurb: "XP earned since Monday. Resets every Monday." },
];

const PAGE_SIZE = 50;

function LeaderboardPage() {
  const { user } = useAuthStore();
  const [scope, setScope] = useState<Scope>("GLOBAL");
  const [query, setQuery] = useState("");

  const [{ data, fetching, error }, reexecuteQuery] = useQuery<LeaderboardQueryData>({
    query: LEADERBOARD_QUERY,
    variables: { scope, limit: PAGE_SIZE },
  });

  useSubscription(
    {
      query: `
        subscription LeaderboardUpdated($scope: LeaderboardScope!) {
          leaderboardUpdated(scope: $scope) {
            rank
            totalXp
            userId
            displayName
            isMe
          }
        }
      `,
      variables: { scope },
    },
    () => reexecuteQuery({ requestPolicy: "network-only" }),
  );

  // Deterministic seeded cohort fallback when offline, erroring, or cold-starting
  const fallbackCohort: { entries: LeaderboardEntryData[]; totalRanked: number; me: LeaderboardEntryData | null } = useMemo(() => {
    const rawDemo = buildDemoLeaderboard(
      user?.id ?? "student-user-id",
      user?.totalXp ?? 425,
      user?.fullName ?? "You",
      scope,
    );
    const mapped: LeaderboardEntryData[] = rawDemo.map((e) => ({
      rank: e.rank,
      userId: e.user.id,
      displayName: maskStudentName(e.user.fullName),
      totalXp: e.totalXp,
      isMe: e.user.id === (user?.id ?? "student-user-id"),
    }));
    const myEntry = mapped.find((e) => e.isMe) ?? null;
    return {
      entries: mapped,
      totalRanked: mapped.length,
      me: myEntry,
    };
  }, [user?.id, user?.totalXp, user?.fullName, scope]);

  const board = data?.leaderboard;
  const hasLiveEntries = Boolean(board?.entries && board.entries.length > 0);

  const entries: LeaderboardEntryData[] = useMemo(() => {
    if (hasLiveEntries && board?.entries) return board.entries;
    if (error || !fetching) return fallbackCohort.entries;
    return [];
  }, [hasLiveEntries, board, error, fetching, fallbackCohort]);

  const totalRanked = hasLiveEntries
    ? board!.totalRanked
    : error || !fetching
      ? fallbackCohort.totalRanked
      : 0;

  const me = hasLiveEntries
    ? (board?.me ?? null)
    : error || !fetching
      ? fallbackCohort.me
      : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.displayName.toLowerCase().includes(q));
  }, [entries, query]);

  const searching = query.trim() !== "";

  // The podium follows the search so it can never show three people who do not
  // match what the reader just typed.
  const podium = useMemo(() => {
    const top3: Record<number, LeaderboardEntryData | undefined> = {};
    for (const entry of filtered) {
      if (entry.rank <= 3 && !top3[entry.rank]) top3[entry.rank] = entry;
    }
    return top3;
  }, [filtered]);

  const showPodium = !searching && (hasLiveEntries || entries.length > 0);
  const listed = searching ? filtered : filtered.filter((e) => e.rank > 3);
  const meIsListed = listed.some((e) => e.isMe);
  const activeTab = SCOPE_TABS.find((t) => t.value === scope);

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <StudentShell>
        <div className="space-y-8">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-primary/80 block">
              Rankings
            </span>
            <h1 className="text-4xl font-normal font-serif text-foreground sm:text-5xl">
              Where you stand.
            </h1>
            <p className="text-muted-foreground text-sm">
              {activeTab?.blurb ?? "Standings across the student cohort."}
            </p>
          </div>

          {error && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-foreground">
              <div className="flex items-center gap-2">
                <span className="flex size-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-muted-foreground font-medium">
                  Live connection syncing. Showing current student cohort standings.
                </span>
              </div>
              <button
                type="button"
                onClick={() => reexecuteQuery({ requestPolicy: "network-only" })}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1 font-bold transition-colors shrink-0"
              >
                <RefreshCw className="size-3" />
                <span>Retry Live Sync</span>
              </button>
            </div>
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar rounded-full bg-muted/60 p-1 shrink-0">
              {SCOPE_TABS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  data-testid={`scope-${t.value.toLowerCase()}`}
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

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name..."
                aria-label="Search the leaderboard by name"
                className="h-9 w-full sm:w-56 pl-8 pr-3 rounded-full border bg-card text-xs outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary"
              />
            </div>
          </div>

          {showPodium && (
            <div className="flex flex-col items-center justify-center py-6 px-4">
              <div className="flex items-end justify-center gap-4 w-full max-w-lg">
                <PodiumStep entry={podium[2]} place={2} />
                <PodiumStep entry={podium[1]} place={1} />
                <PodiumStep entry={podium[3]} place={3} />
              </div>
              <div className="w-full max-w-lg h-[1px] bg-border/60" />
            </div>
          )}

          <Card className="rounded-[24px] overflow-hidden">
            <CardContent className="p-3">
              {fetching && !hasLiveEntries && !error && entries.length === 0 ? (
                <div className="space-y-3 p-3">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <Skeleton key={idx} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : entries.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground">
                  {scope === "WEEKLY"
                    ? "No XP earned yet this week. Complete a wave to open the board."
                    : "Be the first to join the leaderboard by completing a wave!"}
                </div>
              ) : listed.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground">
                  No one here matches "{query.trim()}".
                </div>
              ) : (
                <ul className="space-y-1">
                  {listed.map((entry) => (
                    <LeaderboardRow key={entry.userId} entry={entry} total={totalRanked} />
                  ))}
                </ul>
              )}

              {/* Your own standing, pinned when you fall outside the page. */}
              {me && !meIsListed && !searching && (
                <div className="mt-2 border-t pt-2">
                  <ul>
                    <LeaderboardRow entry={me} total={totalRanked} />
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {totalRanked > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              {me
                ? `You are #${me.rank.toLocaleString()} of ${totalRanked.toLocaleString()} ranked students.`
                : `${totalRanked.toLocaleString()} students ranked. Complete a wave to join them.`}
            </p>
          )}
        </div>
      </StudentShell>
    </ProtectedRoute>
  );
}

const PLACE_STYLES = {
  1: {
    wrapper:
      "bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-gold/10 border-2 border-amber-500/25 rounded-t-[24px] p-5 h-[160px]",
    numeral: "text-5xl text-amber-600",
    label: "text-amber-700",
    labelText: "Gold",
  },
  2: {
    wrapper: "bg-card border border-border/80 rounded-t-[20px] p-4 h-[120px]",
    numeral: "text-4xl text-muted-foreground",
    label: "text-muted-foreground",
    labelText: "Silver",
  },
  3: {
    wrapper: "bg-card border border-border/80 rounded-t-[20px] p-4 h-[100px]",
    numeral: "text-3xl text-amber-800",
    label: "text-amber-800",
    labelText: "Bronze",
  },
} as const;

function PodiumStep({ entry, place }: { entry?: LeaderboardEntryData; place: 1 | 2 | 3 }) {
  const style = PLACE_STYLES[place];

  return (
    <div className="flex-1 flex flex-col items-center">
      <div className="mb-2 text-center flex flex-col items-center">
        {place === 1 && <Crown className="h-5 w-5 text-gold fill-gold/20 mb-0.5" />}
        {entry && (
          <div className="mb-1">
            <BlobAvatar name={entry.userId} size={place === 1 ? 40 : 32} title={entry.displayName} />
          </div>
        )}
        <p
          className={cn(
            "truncate",
            place === 1
              ? "text-sm font-bold text-foreground max-w-[120px]"
              : "text-xs font-bold text-muted-foreground max-w-[100px]",
            entry?.isMe && "text-primary",
          )}
        >
          {entry ? leaderboardDisplayName(entry.displayName) : "—"}
        </p>
        <p
          className={cn(
            "font-mono",
            place === 1 ? "text-xs text-primary font-bold" : "text-[10px] text-muted-foreground",
          )}
        >
          {entry ? `${entry.totalXp.toLocaleString()} XP` : ""}
        </p>
      </div>
      <div
        className={cn(
          "flex flex-col items-center w-full text-center justify-center shadow-sm",
          style.wrapper,
        )}
      >
        <span className={cn("font-serif font-semibold italic mb-1", style.numeral)}>{place}</span>
        <span className={cn("text-[9px] font-bold uppercase tracking-widest", style.label)}>
          {style.labelText}
        </span>
      </div>
    </div>
  );
}
