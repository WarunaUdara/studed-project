import { motion, useReducedMotion } from "framer-motion";
import { Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { Confetti } from "@/components/gamification/Confetti";
import type { LeaderboardEntry } from "@/components/gamification/LeaderboardRow";
import { LeaderboardRow } from "@/components/gamification/LeaderboardRow";
import { ProficiencyBadge } from "@/components/gamification/ProficiencyBadge";
import { StreakFlame } from "@/components/gamification/StreakFlame";
import { XPBar } from "@/components/gamification/XPBar";
import { Card } from "@/components/ui/Card";
import { demoLeaderboardSnapshot } from "@/lib/demoData";

const DEMO_XP = 3120;
const DEMO_STREAK_DAYS = 7;
const YOU_ID = "you";

/**
 * GamifiedPreview — the right-hand hero cluster on the public home page. It
 * renders the *real* gamification components with demo data so the landing
 * page reads like a live product surface, not a static mockup.
 */
export function GamifiedPreview() {
  const reduce = useReducedMotion();
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => setConfetti(true), 350);
    const t2 = setTimeout(() => setConfetti(false), 2200);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [reduce]);

  // Illustrative data for the marketing page. Labelled as such below: the one
  // place invented standings are allowed is where nobody could mistake them for
  // their own.
  const snapshot: LeaderboardEntry[] = demoLeaderboardSnapshot(YOU_ID).map((e) => ({
    rank: e.rank,
    userId: e.user.id,
    displayName: e.user.fullName,
    totalXp: e.totalXp,
    isMe: e.user.id === YOU_ID,
  }));
  const youRow = snapshot.find((e) => e.isMe);

  return (
    <div className="relative">
      <Confetti show={confetti} count={20} />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24, rotate: -1 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative mx-auto w-full max-w-md"
      >
        {/* Floating accent rings */}
        <div
          aria-hidden
          className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/15 via-purple/10 to-gold/10 blur-2xl"
        />

        <Card className="relative overflow-hidden rounded-2xl shadow-xl">
          {/* Top bar: level + streak */}
          <div className="flex items-center justify-between gap-3 border-b bg-gradient-to-r from-primary/8 via-card to-purple/8 px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Your dashboard
            </span>
            <StreakFlame dayCount={DEMO_STREAK_DAYS} size="sm" />
          </div>

          {/* XP + level */}
          <div className="space-y-3 px-4 pt-4">
            <XPBar totalXp={DEMO_XP} />
          </div>

          {/* Proficiency row */}
          <div className="grid grid-cols-2 gap-2 px-4 py-4">
            <ProficiencyBadge level="PROFICIENT" size="sm" />
            <ProficiencyBadge level="EXPERT" size="sm" />
          </div>

          {/* Mini leaderboard */}
          <div className="border-t bg-muted/20 px-3 py-3">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Course leaderboard <span className="font-normal normal-case">(example)</span>
            </p>
            <ul className="space-y-1">
              {snapshot.slice(0, 4).map((entry) => (
                <LeaderboardRow
                  key={`${entry.rank}-${entry.userId}`}
                  entry={entry}
                  className="bg-card"
                />
              ))}
            </ul>
            {youRow?.rank ? (
              <p className="mt-2 px-1 text-center text-xs text-muted-foreground">
                You are <span className="font-bold text-primary">#{youRow.rank}</span> of 100. Keep
                going <Flame className="inline size-3.5 text-orange-500" />
              </p>
            ) : null}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
