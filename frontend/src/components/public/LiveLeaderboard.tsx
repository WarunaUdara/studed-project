import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { RankBadge } from "@/components/gamification/RankBadge";
import { usePublicI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * LiveLeaderboard — a mini leaderboard that keeps playing itself. Demo XP
 * ticks upward every couple of seconds and rows re-sort with a spring layout
 * animation, so the mechanics section feels like a living product surface.
 */

interface DemoRow {
  id: string;
  name: string;
  xp: number;
  you?: boolean;
}

const INITIAL_ROWS: DemoRow[] = [
  { id: "u1", name: "Kavindi P.", xp: 8420 },
  { id: "u2", name: "Tharindu W.", xp: 7635 },
  { id: "you", name: "You", xp: 6890, you: true },
  { id: "u4", name: "Sahan F.", xp: 5920 },
  { id: "u5", name: "Dilini R.", xp: 5385 },
];

export function LiveLeaderboard() {
  const { t } = usePublicI18n();
  const reduce = useReducedMotion();
  const [rows, setRows] = useState(INITIAL_ROWS);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      setRows((prev) => {
        const next = prev.map((r) => ({ ...r }));
        const idx = Math.floor(Math.random() * next.length);
        const row = next[idx];
        if (!row) return prev;
        row.xp += 40 + Math.floor(Math.random() * 120);
        return next.sort((a, b) => b.xp - a.xp);
      });
    }, 2600);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("liveLbTitle")}
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground/80">{t("liveLbNote")}</span>
      </div>

      <ul className="space-y-1">
        {rows.map((row, i) => (
          <motion.li
            key={row.id}
            layout
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className={cn(
              "flex items-center gap-3 rounded-xl px-2.5 py-2",
              row.you ? "bg-primary/10 ring-1 ring-primary/40 shadow-sm" : "bg-muted/40",
            )}
          >
            <span className="flex w-8 items-center justify-center">
              <RankBadge rank={i + 1} size="sm" />
            </span>
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                row.you ? "bg-primary/15 text-primary" : "bg-background text-muted-foreground",
              )}
            >
              {row.name.charAt(0)}
            </span>
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-sm",
                row.you ? "font-bold text-primary" : "font-medium text-foreground",
              )}
            >
              {row.you ? t("liveLbYou") : row.name}
            </span>
            <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
              {row.xp.toLocaleString()}
              <span className="ml-1 text-[10px] font-normal text-muted-foreground">XP</span>
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
