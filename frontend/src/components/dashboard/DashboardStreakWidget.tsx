import { Zap } from "lucide-react";
import { useAuthStore } from "@/stores/auth";

const WEEKDAYS = [
  { short: "M", label: "Monday", index: 0 },
  { short: "T", label: "Tuesday", index: 1 },
  { short: "W", label: "Wednesday", index: 2 },
  { short: "Th", label: "Thursday", index: 3 },
  { short: "F", label: "Friday", index: 4 },
];

export function DashboardStreakWidget() {
  const { user } = useAuthStore();
  const streak = Math.max(1, user?.streak ?? 1);

  const now = new Date();
  const currentDayIndex = (now.getDay() + 6) % 7; // Monday = 0

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-5 shadow-sm backdrop-blur-sm transition-all hover:border-border">
      {/* Top Streak Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {streak}
          </span>
          <Zap className="size-6 fill-amber-400 text-amber-400 animate-pulse" />
        </div>

        {/* Battery / Streak Charge Status */}
        <div className="flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 border border-border/40">
          <div className="flex items-center gap-1 text-[11px] font-bold text-lime-600 dark:text-lime-400">
            <span className="size-2 rounded-full bg-lime-500" />
            <span>1 Charge</span>
          </div>
        </div>
      </div>

      {/* Weekday Tracker */}
      <div className="mt-4 flex items-center justify-between gap-1.5 pt-2 border-t border-border/40">
        {WEEKDAYS.map((day) => {
          const isToday = day.index === currentDayIndex;
          const isCompleted = day.index <= currentDayIndex;

          return (
            <div key={day.label} className="flex flex-col items-center gap-1">
              <div
                className={`flex size-8 items-center justify-center rounded-full transition-all duration-200 ${
                  isToday
                    ? "bg-lime-400 text-black shadow-sm font-extrabold ring-2 ring-lime-300 dark:ring-lime-500"
                    : isCompleted
                      ? "bg-muted text-lime-600 dark:text-lime-400 border border-lime-500/30"
                      : "bg-muted/40 text-muted-foreground border border-border/40"
                }`}
              >
                {isToday || isCompleted ? (
                  <Zap className="size-3.5 fill-current text-current" />
                ) : (
                  <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                )}
              </div>
              <span
                className={`text-[10px] font-bold ${
                  isToday ? "text-foreground font-extrabold" : "text-muted-foreground"
                }`}
              >
                {day.short}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
