import type { ManifestEvaluateBlock } from "./manifest";

export interface GradedFeedback {
  evaluateBlockId: string;
  correct: boolean;
  correctAnswer?: string | null;
  explanation?: string | null;
}

export interface GradedResult {
  score: number;
  xpEarned: number;
  totalXp: number;
  passed: boolean;
  remainingAttempts: number;
  feedback: GradedFeedback[];
}

interface GradableBlock {
  id: string;
  correctAnswer?: string | null;
  explanation?: string | null;
}

/**
 * Mirrors the server's answer comparison: trim, lowercase, and treat the result
 * as an exact match. The canonical encoders already produce lowercase,
 * order-stable strings, so a manipulation grades the same here as it does after
 * the course is synced to the backend.
 */
export function answersMatch(given: string, expected: string | null | undefined): boolean {
  if (!expected) return false;
  return given.trim().toLowerCase() === expected.trim().toLowerCase();
}

/**
 * Grades a manifest-backed wave in the browser, for courses that are playable
 * before they have been seeded. Scoring matches the backend: percentage of
 * blocks correct, passed at or above the wave's threshold, full XP on a pass.
 */
export function gradeWaveLocally(
  blocks: (GradableBlock | ManifestEvaluateBlock)[],
  answers: Record<string, string>,
  options: { passingThreshold: number; xpReward: number; currentTotalXp: number },
): GradedResult {
  const feedback: GradedFeedback[] = blocks.map((block) => ({
    evaluateBlockId: block.id,
    correct: answersMatch(answers[block.id] ?? "", block.correctAnswer),
    correctAnswer: block.correctAnswer ?? null,
    explanation: block.explanation ?? null,
  }));

  const correctCount = feedback.filter((entry) => entry.correct).length;
  const score = blocks.length === 0 ? 0 : Math.round((correctCount / blocks.length) * 100);
  const passed = score >= options.passingThreshold;
  const xpEarned = passed ? options.xpReward : 0;

  return {
    score,
    xpEarned,
    totalXp: options.currentTotalXp + xpEarned,
    passed,
    remainingAttempts: -1,
    feedback,
  };
}
