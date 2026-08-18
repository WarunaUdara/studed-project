/**
 * Shared fallback syllabus for the Scientific Thinking (Gears) demo course.
 *
 * The course does not exist in the backend catalog yet, so every surface that
 * renders it (catalog card, syllabus drawer, journey map, wave player) must
 * agree on the same data. Keeping it here makes the 5-wave syllabus the single
 * source of truth instead of copy-pasted inline mocks.
 *
 * The shape mirrors the GraphQL `CoursePlayer` payload used by the standard
 * course player and `CourseJourneyMap` so the science course flows through the
 * exact same components as every other course.
 */

export interface ScienceFallbackWave {
  id: string;
  title: string;
  sequenceOrder: number;
  xpReward: number;
  maxReattempts: number;
  passingThreshold: number;
  estimatedDuration: number;
  difficulty: string;
  isPublished: boolean;
  myProgress?: {
    status: string;
    attemptsCount?: number;
    highestScore?: number | null;
  } | null;
}

export interface ScienceFallbackLesson {
  id: string;
  title: string;
  sequenceOrder: number;
  isPublished: boolean;
  waves: ScienceFallbackWave[];
}

export const SCIENCE_COURSE_ID = "science-thinking";

export const SCIENCE_FALLBACK_LESSONS: ScienceFallbackLesson[] = [
  {
    id: "lesson-gears",
    title: "Gears & Mechanical Parity",
    sequenceOrder: 1,
    isPublished: true,
    waves: [
      {
        id: "science-gears-1",
        title: "Connecting Gears",
        sequenceOrder: 1,
        xpReward: 30,
        maxReattempts: 0,
        passingThreshold: 60,
        estimatedDuration: 5,
        difficulty: "Beginner",
        isPublished: true,
        myProgress: { status: "COMPLETED", attemptsCount: 1, highestScore: 100 },
      },
      {
        id: "science-gears-2",
        title: "Gear Speeds & Tooth Counts",
        sequenceOrder: 2,
        xpReward: 30,
        maxReattempts: 0,
        passingThreshold: 60,
        estimatedDuration: 5,
        difficulty: "Beginner",
        isPublished: true,
        myProgress: null,
      },
      {
        id: "science-gears-3",
        title: "Direction Inversion in 5-Gear Linear Trains",
        sequenceOrder: 3,
        xpReward: 30,
        maxReattempts: 0,
        passingThreshold: 60,
        estimatedDuration: 5,
        difficulty: "Intermediate",
        isPublished: true,
        myProgress: null,
      },
      {
        id: "science-gears-4",
        title: "6-Gear Curved Arch Mechanism",
        sequenceOrder: 4,
        xpReward: 30,
        maxReattempts: 0,
        passingThreshold: 60,
        estimatedDuration: 5,
        difficulty: "Intermediate",
        isPublished: true,
        myProgress: null,
      },
      {
        id: "science-gears-5",
        title: "7-Gear Branched Cluster Network",
        sequenceOrder: 5,
        xpReward: 30,
        maxReattempts: 0,
        passingThreshold: 60,
        estimatedDuration: 5,
        difficulty: "Advanced",
        isPublished: true,
        myProgress: null,
      },
    ],
  },
];

/** CourseNode-shaped view used by the catalog milestone card. */
export const SCIENCE_COURSE_NODE = {
  id: SCIENCE_COURSE_ID,
  title: "Scientific Thinking",
  description:
    "Learn mechanical physics, gear train parity, and kinematics with interactive simulations.",
  gradeLevel: "G9",
  slug: SCIENCE_COURSE_ID,
  price: 0,
  myProgress: { completedWaves: 1, totalWaves: 5 },
};

/**
 * Course-shaped view used by the CourseDetailSheet syllabus drawer so the
 * science course renders through the exact same standard components as every
 * other course.
 */
export const SCIENCE_COURSE_DETAIL = {
  id: SCIENCE_COURSE_ID,
  title: "Scientific Thinking",
  description:
    "Learn mechanical physics, gear train parity, and kinematics with interactive simulations.",
  gradeLevel: "G9",
  isPublished: true,
  myProgress: { completedWaves: 1, totalWaves: 5 },
  lessons: SCIENCE_FALLBACK_LESSONS,
};

export function isScienceCourseId(courseId: string): boolean {
  return courseId === SCIENCE_COURSE_ID || courseId.startsWith("science") || courseId.includes("gear");
}
