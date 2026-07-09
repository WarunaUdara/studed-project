import { levelFromXp } from "@/lib/gamification";

/**
 * Demo leaderboard entries used when the GraphQL backend isn't ready/returns
 * nothing. These exist purely so the new leaderboard/achievements UI can
 * showcase its gamification affordances (rank glyphs, "You are #42", etc).
 */
export interface DemoLeaderboardEntry {
  rank: number;
  user: { id: string; fullName: string };
  totalXp: number;
}

const NAMES = [
  "Kavindi P.",
  "Tharindu W.",
  "Achini L.",
  "Sahan F.",
  "Mihiranga S.",
  "Dilini R.",
  "Hashan A.",
  "Nimasha T.",
  "Ravindu J.",
  "Sewwandi M.",
  "Kasun D.",
  "Ishara N.",
];

export function buildDemoLeaderboard(youId: string, youXp = 3120): DemoLeaderboardEntry[] {
  const xs = [8420, 7635, 6890, 5920, 5385, 4860, 4225, 3870, 3510, 3120, 2845, 2480, 2120, 1780];
  const entries: DemoLeaderboardEntry[] = xs.map((xp, i) => ({
    rank: i + 1,
    user: {
      // For the row that should highlight as "you", use the supplied id.
      id: xp === youXp ? youId : `bot-${i}`,
      fullName: NAMES[i % NAMES.length] ?? `Learner ${i + 1}`,
    },
    totalXp: xp,
  }));
  // Ensure an entry with youId appears so the snapshot can find it.
  if (!entries.some((e) => e.user.id === youId)) {
    entries.push({ rank: 42, user: { id: youId, fullName: "You" }, totalXp: youXp });
  }
  return entries.sort((a, b) => a.rank - b.rank);
}

/** Daily XP series for a 7-day dashboard chart (used when backend empty). */
export const DEMO_7DAY_XP = [80, 140, 220, 120, 360, 280, 200];

/** Daily XP series for a 30-day achievements chart. */
export function demo30dayXp(): number[] {
  const out: number[] = [];
  for (let i = 0; i < 30; i++) {
    out.push(Math.round(40 + Math.random() * 240 + (i % 7 === 0 ? 360 : 0)));
  }
  return out;
}

/** XP breakdown by category — used in the achievements page bar chart. */
export function demoXpBreakdown(totalXp: number): {
  waves: number;
  proficiencyBonuses: number;
  streaks: number;
  perfectScores: number;
} {
  return {
    waves: Math.round(totalXp * 0.62),
    proficiencyBonuses: Math.round(totalXp * 0.18),
    streaks: Math.round(totalXp * 0.12),
    perfectScores: Math.round(totalXp * 0.08),
  };
}

/** Per-lesson proficiency counts used to render the proficiency dashboard. */
export interface DemoProficiencyBucket {
  level: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "PROFICIENT" | "EXPERT";
  label: string;
  count: number;
}

export function demoProficiencyBuckets(): DemoProficiencyBucket[] {
  return [
    { level: "NOT_STARTED", label: "Not Started", count: 6 },
    { level: "IN_PROGRESS", label: "In Progress", count: 4 },
    { level: "COMPLETED", label: "Completed", count: 5 },
    { level: "PROFICIENT", label: "Proficient", count: 3 },
    { level: "EXPERT", label: "Expert", count: 1 },
  ];
}

export interface DemoTopTarget {
  lessonTitle: string;
  wavesRemaining: number;
}

export function demoTopTargets(): DemoTopTarget[] {
  return [
    { lessonTitle: "Algebra Basics", wavesRemaining: 2 },
    { lessonTitle: "Cell Biology", wavesRemaining: 1 },
    { lessonTitle: "Newton's Laws", wavesRemaining: 3 },
  ];
}

export interface DemoSuggestedReattempt {
  lessonTitle: string;
  waveTitle: string;
  bestScore: number;
}

export function demoSuggestedReattempts(): DemoSuggestedReattempt[] {
  return [
    { lessonTitle: "Numbers", waveTitle: "Fractions Quiz", bestScore: 75 },
    { lessonTitle: "Forces", waveTitle: "Friction MCQ", bestScore: 68 },
  ];
}

export function levelName(level: number): string {
  const names = [
    "Rookie",
    "Novice",
    "Learner",
    "Scholar",
    "Expert",
    "Master",
    "Grand Master",
    "Enlightened",
  ];
  return names[Math.min(level - 1, names.length - 1)] ?? "Enlightened";
}

export function levelInfoForXp(totalXp: number) {
  return levelFromXp(totalXp);
}

/**
 * Featured course preview used on the public home page catalog section.
 * These mirror the structure of the GraphQL `Course` type so the existing
 * ProgressRing / ProficiencyBadge components accept them unmodified.
 */
export interface FeaturedCourse {
  id: string;
  title: string;
  description: string;
  gradeLevel: string;
  subjectIcon: "math" | "science" | "english" | "sinhala";
  totalWaves: number;
  completedWaves: number;
  proficiency: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "PROFICIENT" | "EXPERT";
}

export const FEATURED_COURSES: FeaturedCourse[] = [
  {
    id: "demo-math-g7",
    title: "Mathematics",
    description: "Algebra, geometry and problem-solving with interactive worked examples.",
    gradeLevel: "G7",
    subjectIcon: "math",
    totalWaves: 24,
    completedWaves: 18,
    proficiency: "PROFICIENT",
  },
  {
    id: "demo-sci-g9",
    title: "Science",
    description: "Biology, chemistry and physics units with visual experiments.",
    gradeLevel: "G9",
    subjectIcon: "science",
    totalWaves: 30,
    completedWaves: 9,
    proficiency: "IN_PROGRESS",
  },
  {
    id: "demo-eng-ol",
    title: "English",
    description: "Grammar, comprehension and exam-style practice for O/L success.",
    gradeLevel: "OL",
    subjectIcon: "english",
    totalWaves: 18,
    completedWaves: 0,
    proficiency: "NOT_STARTED",
  },
  {
    id: "demo-sin-al",
    title: "Sinhala",
    description: "සාහිත්‍යය, ව්‍යාකරණ සහ රචනා අත්පොත — A/L සඳහා සම්පූර්ණ අධ්‍යයන ඒකක.",
    gradeLevel: "AL",
    subjectIcon: "sinhala",
    totalWaves: 22,
    completedWaves: 22,
    proficiency: "EXPERT",
  },
];

/** A short, "live-feel" leaderboard snapshot for the public home preview. */
export function demoLeaderboardSnapshot(youId = "you"): DemoLeaderboardEntry[] {
  return buildDemoLeaderboard(youId, 3120)
    .filter((e) => e.rank <= 4 || e.user.id === youId)
    .slice(0, 5);
}
