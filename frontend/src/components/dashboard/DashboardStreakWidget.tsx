import { Zap } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"] as const;
const WEEKDAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

/** Midnight UTC for a date, so day comparisons never trip over local time. */
function utcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/**
 * Which days of the current week the student actually learned on.
 *
 * A streak is contiguous by definition, so `streak` days ending at
 * `lastActiveAt` is the complete record of activity — no extra API needed.
 * The previous version marked every past weekday of the week as complete
 * regardless of whether the student had opened the app, and only ever showed
 * Monday to Friday, so weekend study was invisible and idle weeks looked busy.
 */
export function activeDaysThisWeek(
  streak: number,
  lastActiveAt: string | null | undefined,
  now: Date,
): boolean[] {
  const week = new Array(7).fill(false);
  if (streak <= 0 || !lastActiveAt) return week;

  const lastActive = new Date(lastActiveAt);
  if (Number.isNaN(lastActive.getTime())) return week;

  const lastActiveDay = utcDay(lastActive);
  // The streak covers [lastActive - (streak - 1), lastActive].
  const firstActiveDay = lastActiveDay - (streak - 1) * 86_400_000;

  // Monday of the week containing `now`.
  const mondayOffset = (now.getUTCDay() + 6) % 7;
  const monday = utcDay(now) - mondayOffset * 86_400_000;

  for (let i = 0; i < 7; i++) {
    const day = monday + i * 86_400_000;
    week[i] = day >= firstActiveDay && day <= lastActiveDay;
  }
  return week;
}

export function DashboardStreakWidget() {
  const { user } = useAuthStore();
  const streak = user?.streak ?? 0;
  const longest = user?.longestStreak ?? 0;

  const now = useMemo(() => new Date(), []);
  const todayIndex = (now.getUTCDay() + 6) % 7;
  const activeDays = useMemo(
    () => activeDaysThisWeek(streak, user?.lastActiveAt, now),
    [streak, user?.lastActiveAt, now],
  );

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-5 shadow-sm backdrop-blur-sm transition-all hover:border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
            data-testid="streak-count"
          >
            {streak}
          </span>
          <Zap
            className={cn(
              "size-6",
              streak > 0 ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
            )}
          />
          <span className="text-xs font-medium text-muted-foreground">
            {streak === 1 ? "day streak" : "day streak"}
          </span>
        </div>

        {longest > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 border border-border/40">
            <span className="text-[11px] font-bold text-muted-foreground">Best {longest}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-1.5 pt-2 border-t border-border/40">
        {WEEKDAYS.map((short, index) => {
          const isToday = index === todayIndex;
          const wasActive = activeDays[index];

          return (
            <div
              key={WEEKDAY_LABELS[index]}
              className="flex flex-col items-center gap-1"
              title={`${WEEKDAY_LABELS[index]}${wasActive ? " — studied" : ""}`}
            >
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full transition-all duration-200",
                  wasActive
                    ? "bg-lime-400 text-black font-extrabold shadow-sm"
                    : "bg-muted/40 text-muted-foreground border border-border/40",
                  isToday && "ring-2 ring-lime-300 dark:ring-lime-500",
                )}
              >
                {wasActive ? (
                  <Zap className="size-3.5 fill-current text-current" />
                ) : (
                  <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold",
                  isToday ? "text-foreground font-extrabold" : "text-muted-foreground",
                )}
              >
                {short}
              </span>
            </div>
          );
        })}
      </div>

      {streak === 0 && (
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          Complete a wave today to start a streak.
        </p>
      )}
    </div>
  );
}
