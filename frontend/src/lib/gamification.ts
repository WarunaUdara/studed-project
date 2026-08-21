/**
 * Gamification utilities — level curve, proficiency, and badge computation.
 *
 * Level curve (triangular): cumulative XP to reach level L = 100 * (L-1)*L / 2.
 *   L1 @ 0, L2 @ 100, L3 @ 300, L4 @ 600, L5 @ 1000, L6 @ 1500, L7 @ 2100 ...
 * XP required within a level = 100 * currentLevel (the gap to the next level).
 */

export interface LevelInfo {
  level: number;
  currentLevelXp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progress: number;
}

export function cumulativeXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return (100 * (level - 1) * level) / 2;
}

export function levelFromXp(totalXp: number): LevelInfo {
  const xp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  while (cumulativeXpForLevel(level + 1) <= xp) level++;

  const currentLevelXp = cumulativeXpForLevel(level);
  const nextLevelXp = cumulativeXpForLevel(level + 1);
  const xpIntoLevel = xp - currentLevelXp;
  const xpForNextLevel = nextLevelXp - currentLevelXp;
  const progress = xpForNextLevel > 0 ? xpIntoLevel / xpForNextLevel : 1;

  return { level, currentLevelXp, xpIntoLevel, xpForNextLevel, progress };
}

export function levelLabel(level: number): string {
  return `Level ${level}`;
}

/* ----- Proficiency ----- */
//
// Five levels (per 05-Gamification/Proficiency-System.md):
//   Not Started  Gray
//   In Progress  Yellow
//   Completed    Green
//   Proficient   Gold (avg >= 80%)
//   Expert       Purple (avg = 100%)
// Icons map to lucide via ProficiencyBadge.
export type ProficiencyLevel =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "PROFICIENT"
  | "EXPERT";

export interface ProficiencyMeta {
  level: ProficiencyLevel;
  label: string;
  icon: string;
  color: string;
  textColor: string;
  bgColor: string;
  ringColor: string;
  borderColor: string;
}

const PROFICIENCY_MAP: Record<ProficiencyLevel, Omit<ProficiencyMeta, "level">> = {
  NOT_STARTED: {
    label: "Not Started",
    icon: "circle",
    color: "text-muted-foreground",
    textColor: "text-muted-foreground",
    bgColor: "bg-muted",
    ringColor: "ring-border",
    borderColor: "border-border",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: "clock",
    color: "text-warning",
    textColor: "text-warning-foreground",
    bgColor: "bg-warning/15",
    ringColor: "ring-warning/40",
    borderColor: "border-warning/40",
  },
  COMPLETED: {
    label: "Completed",
    icon: "check",
    color: "text-success",
    textColor: "text-success-foreground",
    bgColor: "bg-success/15",
    ringColor: "ring-success/40",
    borderColor: "border-success/40",
  },
  PROFICIENT: {
    label: "Proficient",
    icon: "star",
    color: "text-gold",
    textColor: "text-gold-foreground",
    bgColor: "bg-gold/15",
    ringColor: "ring-gold/40",
    borderColor: "border-gold/40",
  },
  EXPERT: {
    label: "Expert",
    icon: "crown",
    color: "text-purple",
    textColor: "text-purple-foreground",
    bgColor: "bg-purple/15",
    ringColor: "ring-purple/40",
    borderColor: "border-purple/40",
  },
};

export function proficiencyMeta(level: ProficiencyLevel): ProficiencyMeta {
  return { level, ...PROFICIENCY_MAP[level] };
}

export function computeProficiency(
  waveStatuses: Array<{ status: string; highestScore?: number | null }>,
  passingThreshold = 70,
): ProficiencyLevel {
  if (waveStatuses.length === 0) return "NOT_STARTED";
  const allCompleted = waveStatuses.every((w) => w.status === "COMPLETED");
  if (!allCompleted) return "IN_PROGRESS";
  const scores = waveStatuses
    .map((w) => (typeof w.highestScore === "number" ? w.highestScore : null))
    .filter((s): s is number => s !== null);
  if (scores.length === 0) return "COMPLETED";
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (avg >= 100) return "EXPERT";
  if (avg >= 80) return "PROFICIENT";
  void passingThreshold;
  return "COMPLETED";
}

/* ----- Achievement presentation ----- */
//
// The unlock RULES live in gamification-service and reach the UI through the
// `achievements` query with an `unlocked` flag. What is left here is purely how
// an achievement looks: its icon and its tier. Nothing in the frontend decides
// whether an achievement is earned — two copies of those rules had drifted
// apart, and the client's copy read a different XP total than the server's.

export type BadgeTier = "bronze" | "silver" | "gold" | "purple";

export interface AchievementStyle {
  icon: string;
  tier: BadgeTier;
}

const ACHIEVEMENT_STYLES: Record<string, AchievementStyle> = {
  first_wave: { icon: "waves", tier: "bronze" },
  perfect_score: { icon: "target", tier: "silver" },
  lesson_complete: { icon: "book", tier: "bronze" },
  lesson_proficient: { icon: "star", tier: "gold" },
  rising_star: { icon: "sparkles", tier: "silver" },
  scholar: { icon: "graduation", tier: "gold" },
  master: { icon: "crown", tier: "purple" },
  first_course: { icon: "trophy", tier: "gold" },
};

/** How an achievement should look. Unknown ids fall back to bronze. */
export function achievementStyle(id: string): AchievementStyle {
  return ACHIEVEMENT_STYLES[id] ?? { icon: "trophy", tier: "bronze" };
}

/** An achievement as the API returns it. */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl?: string | null;
  unlocked: boolean;
  unlockedAt?: string | null;
}

export function earnedCount(achievements: Array<{ unlocked: boolean }>): number {
  return achievements.filter((a) => a.unlocked).length;
}

/* ----- Leaderboard rank styling ----- */

export function rankMedal(rank: number): string | null {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return null;
}

export function rankBadge(rank: number, total?: number): string | null {
  if (rank <= 3) return null;
  if (rank <= 10) return "star";
  const t = total ?? 100;
  if (rank <= Math.ceil(t * 0.01)) return "crown";
  if (rank <= Math.ceil(t * 0.1)) return "gem";
  return null;
}

/**
 * Returns the leaderboard rank glyph key for a given position:
 *   medal-gold / medal-silver / medal-bronze for top 3,
 *   star for top 10, crown for top 1%, gem for top 10%.
 * Callers map the key to a lucide icon. No emoji glyphs per ui-ux-pro-max.
 */
export function rankBadgeGlyph(rank: number, total?: number): string {
  if (rank === 1) return "medal-gold";
  if (rank === 2) return "medal-silver";
  if (rank === 3) return "medal-bronze";
  const t = total ?? 100;
  if (rank <= 10) return "star";
  if (rank <= Math.ceil(t * 0.01)) return "crown";
  if (rank <= Math.ceil(t * 0.1)) return "gem";
  return "";
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function privateLeaderboardName(fullName: string | null | undefined): string {
  if (!fullName) return "Student Scholar";
  const trimmed = fullName.trim();
  if (!trimmed || UUID_RE.test(trimmed)) return "Student Scholar";
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) return parts[0];
  const first = parts[0];
  const last = parts[parts.length - 1];
  if (last.endsWith(".") && last.length <= 2) {
    return `${first} ${last}`;
  }
  const lastInitial = last[0].toUpperCase();
  return `${first} ${lastInitial}.`;
}

export const maskStudentName = privateLeaderboardName;

export function leaderboardDisplayName(displayName: string | null | undefined): string {
  const trimmed = (displayName ?? "").trim();
  return trimmed === "" ? "Student Scholar" : trimmed;
}

/** Per-question XP breakdown categories for the achievements page. */
export interface XpBreakdown {
  waves: number;
  proficiencyBonuses: number;
  streaks: number;
  perfectScores: number;
}

export function emptyXpBreakdown(): XpBreakdown {
  return { waves: 0, proficiencyBonuses: 0, streaks: 0, perfectScores: 0 };
}

/* ----- League Tiers & Progression ----- */

export type LeagueTier =
  | "HYDROGEN"
  | "LITHIUM"
  | "CARBON"
  | "TITANIUM"
  | "QUANTUM";

export interface LeagueMeta {
  tier: LeagueTier;
  name: string;
  metal: string;
  minXp: number;
  badgeBg: string;
  textColor: string;
  ringColor: string;
  promotionCutoff: number;
  demotionCutoff: number;
}

export const LEAGUE_TIERS: Record<LeagueTier, LeagueMeta> = {
  HYDROGEN: {
    tier: "HYDROGEN",
    name: "Hydrogen League",
    metal: "Bronze",
    minXp: 0,
    badgeBg: "from-amber-600 to-orange-700",
    textColor: "text-amber-500",
    ringColor: "ring-amber-600/30",
    promotionCutoff: 10,
    demotionCutoff: 0,
  },
  LITHIUM: {
    tier: "LITHIUM",
    name: "Lithium League",
    metal: "Silver",
    minXp: 1000,
    badgeBg: "from-slate-400 to-slate-600",
    textColor: "text-slate-300",
    ringColor: "ring-slate-400/30",
    promotionCutoff: 10,
    demotionCutoff: 5,
  },
  CARBON: {
    tier: "CARBON",
    name: "Carbon League",
    metal: "Gold",
    minXp: 2500,
    badgeBg: "from-amber-400 to-yellow-600",
    textColor: "text-gold",
    ringColor: "ring-gold/30",
    promotionCutoff: 7,
    demotionCutoff: 5,
  },
  TITANIUM: {
    tier: "TITANIUM",
    name: "Titanium League",
    metal: "Diamond",
    minXp: 5000,
    badgeBg: "from-cyan-400 to-blue-600",
    textColor: "text-cyan-400",
    ringColor: "ring-cyan-400/30",
    promotionCutoff: 5,
    demotionCutoff: 5,
  },
  QUANTUM: {
    tier: "QUANTUM",
    name: "Quantum League",
    metal: "Obsidian",
    minXp: 10000,
    badgeBg: "from-purple-500 to-indigo-800",
    textColor: "text-purple-400",
    ringColor: "ring-purple-500/30",
    promotionCutoff: 3,
    demotionCutoff: 5,
  },
};

export function getLeagueInfo(xp: number): LeagueMeta {
  if (xp >= 10000) return LEAGUE_TIERS.QUANTUM;
  if (xp >= 5000) return LEAGUE_TIERS.TITANIUM;
  if (xp >= 2500) return LEAGUE_TIERS.CARBON;
  if (xp >= 1000) return LEAGUE_TIERS.LITHIUM;
  return LEAGUE_TIERS.HYDROGEN;
}
