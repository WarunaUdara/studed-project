export interface EvaluateBlockData {
  id: string;
  type: string;
  question: string;
  options?: string[] | null;
  correctAnswer?: string | null;
  explanation?: string | null;
  metadata?: string | null;
}

export interface EvaluateFeedback {
  correct: boolean;
  correctAnswer?: string | null;
  explanation?: string | null;
}

/** Every interactive evaluate renderer takes exactly this shape. */
export interface InteractiveEvaluateProps {
  block: EvaluateBlockData;
  /** Canonical answer string, restored from the encoder for this block type. */
  answer: string;
  onAnswerChange: (answer: string) => void;
  /** Locked once the wave has been graded. */
  disabled?: boolean;
}
