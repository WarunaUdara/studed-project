/**
 * Demo leaderboard entries used only by the public, pre-login landing page
 * preview (GamifiedPreview). Never used on authenticated pages — real
 * leaderboard data always comes from the GraphQL API there.
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

function buildDemoLeaderboard(youId: string, youXp = 3120): DemoLeaderboardEntry[] {
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
