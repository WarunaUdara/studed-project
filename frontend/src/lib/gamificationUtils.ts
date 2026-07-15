import { type BadgeInputs, cumulativeXpForLevel, levelFromXp } from "./gamification";

export interface WaveProgress {
  status: string;
  attemptsCount: number;
  highestScore?: number | null;
}

export interface EnrollmentWave {
  id: string;
  myProgress?: WaveProgress | null;
}

export interface EnrollmentLesson {
  id: string;
  title: string;
  sequenceOrder: number;
  isPublished: boolean;
  waves: EnrollmentWave[];
}

export interface CourseEnrollment {
  id: string;
  title: string;
  description: string;
  slug: string;
  gradeLevel: string;
  myProgress?: { completedWaves: number; totalWaves: number } | null;
  lessons?: EnrollmentLesson[] | null;
}

export interface PointsLevelTimeline {
  id: string;
  name: string;
  points: number;
  description?: string;
}

export const LEVEL_NAMES = [
  "Rookie",
  "Novice",
  "Learner",
  "Scholar",
  "Expert",
  "Master",
  "Grand Master",
  "Enlightened",
];

export function levelName(level: number): string {
  return LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)] ?? "Enlightened";
}

export function buildLevelTimeline(totalXp: number): PointsLevelTimeline[] {
  const { level } = levelFromXp(totalXp);
  const maxLevel = Math.max(level + 3, 8);
  const levels: PointsLevelTimeline[] = [];
  for (let l = 1; l <= maxLevel; l++) {
    levels.push({
      id: `lvl-${l}`,
      name: levelName(l),
      points: cumulativeXpForLevel(l),
      description: l === 1 ? "Starting your journey" : undefined,
    });
  }
  return levels;
}

export function computeBadgeInputsFromEnrollments(
  enrollments: CourseEnrollment[],
  totalXp: number,
): BadgeInputs {
  let completedWaves = 0;
  let hasPerfectScore = false;
  let completedLessons = 0;
  let proficientLessons = 0;
  let completedCourses = 0;

  for (const course of enrollments) {
    const lessons = course.lessons ?? [];
    if (lessons.length === 0) continue;
    let courseAllCompleted = true;

    for (const lesson of lessons) {
      const waves = lesson.waves ?? [];
      if (waves.length === 0) continue;
      const allCompleted = waves.every((w) => w.myProgress?.status === "COMPLETED");

      if (allCompleted) {
        completedLessons++;
        const scores = waves
          .map((w) => w.myProgress?.highestScore)
          .filter((s): s is number => typeof s === "number" && s >= 0);
        if (scores.length > 0) {
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          if (avg >= 80) proficientLessons++;
        }
      } else {
        courseAllCompleted = false;
      }

      for (const w of waves) {
        if (w.myProgress?.status === "COMPLETED") completedWaves++;
        if (w.myProgress?.highestScore === 100) hasPerfectScore = true;
      }
    }

    if (courseAllCompleted && lessons.length > 0) completedCourses++;
  }

  return {
    totalXp,
    completedWaves,
    hasPerfectScore,
    completedLessons,
    proficientLessons,
    completedCourses,
  };
}
