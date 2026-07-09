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
}

const PROFICIENCY_MAP: Record<ProficiencyLevel, Omit<ProficiencyMeta, "level">> = {
  NOT_STARTED: {
    label: "Not Started",
    icon: "circle",
    color: "text-gray-500",
    textColor: "text-gray-700",
    bgColor: "bg-gray-100",
    ringColor: "ring-gray-300",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: "clock",
    color: "text-amber-600",
    textColor: "text-amber-800",
    bgColor: "bg-amber-100",
    ringColor: "ring-amber-300",
  },
  COMPLETED: {
    label: "Completed",
    icon: "check",
    color: "text-green-600",
    textColor: "text-green-800",
    bgColor: "bg-green-100",
    ringColor: "ring-green-300",
  },
  PROFICIENT: {
    label: "Proficient",
    icon: "star",
    color: "text-gold",
    textColor: "text-gold",
    bgColor: "bg-gold/15",
    ringColor: "ring-gold/40",
  },
  EXPERT: {
    label: "Expert",
    icon: "crown",
    color: "text-purple",
    textColor: "text-purple",
    bgColor: "bg-purple/15",
    ringColor: "ring-purple/40",
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

/* ----- Badges (frontend-computed milestones) ----- */

export interface BadgeDef {
  id: string;
  label: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "purple";
}

export const BADGE_DEFS: BadgeDef[] = [
  {
    id: "first_wave",
    label: "First Wave",
    description: "Complete your first wave",
    icon: "waves",
    tier: "bronze",
  },
  {
    id: "perfect_score",
    label: "Perfect Score",
    description: "Score 100% on any wave",
    icon: "target",
    tier: "silver",
  },
  {
    id: "lesson_complete",
    label: "Lesson Complete",
    description: "Complete all waves in a lesson",
    icon: "book",
    tier: "bronze",
  },
  {
    id: "lesson_proficient",
    label: "Lesson Proficient",
    description: "Reach Proficient in a lesson",
    icon: "star",
    tier: "gold",
  },
  {
    id: "rising_star",
    label: "Rising Star",
    description: "Earn 500 XP",
    icon: "sparkles",
    tier: "silver",
  },
  {
    id: "scholar",
    label: "Scholar",
    description: "Earn 2,000 XP",
    icon: "graduation",
    tier: "gold",
  },
  { id: "master", label: "Master", description: "Earn 5,000 XP", icon: "crown", tier: "purple" },
  {
    id: "first_course",
    label: "Course Conqueror",
    description: "Complete an entire course",
    icon: "trophy",
    tier: "gold",
  },
];

export interface BadgeEarned extends BadgeDef {
  earned: boolean;
}

export interface BadgeInputs {
  totalXp: number;
  completedWaves: number;
  hasPerfectScore: boolean;
  completedLessons: number;
  proficientLessons: number;
  completedCourses: number;
}

export function computeBadges(input: BadgeInputs): BadgeEarned[] {
  const earned = (id: string) => {
    switch (id) {
      case "first_wave":
        return input.completedWaves >= 1;
      case "perfect_score":
        return input.hasPerfectScore;
      case "lesson_complete":
        return input.completedLessons >= 1;
      case "lesson_proficient":
        return input.proficientLessons >= 1;
      case "rising_star":
        return input.totalXp >= 500;
      case "scholar":
        return input.totalXp >= 2000;
      case "master":
        return input.totalXp >= 5000;
      case "first_course":
        return input.completedCourses >= 1;
      default:
        return false;
    }
  };
  return BADGE_DEFS.map((def) => ({ ...def, earned: earned(def.id) }));
}

export function earnedCount(badges: BadgeEarned[]): number {
  return badges.filter((b) => b.earned).length;
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
