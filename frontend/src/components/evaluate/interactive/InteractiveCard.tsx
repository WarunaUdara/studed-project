import { cn } from "@/lib/utils";
import type { EvaluateFeedback } from "./types";

interface InteractiveCardProps {
  index: number;
  question: string;
  /** One short line telling a child what to do with their hands. */
  instruction: string;
  feedback?: EvaluateFeedback | null;
  children: React.ReactNode;
}

/**
 * Shared chrome for manipulative questions: the number, the question, the
 * instruction, and the graded feedback. Keeping it in one place means every
 * interaction type reads the same to a student.
 */
export function InteractiveCard({
  index,
  question,
  instruction,
  feedback,
  children,
}: InteractiveCardProps) {
  return (
    <div className="space-y-4 rounded-2xl border p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          {index + 1}
        </span>
        <div className="space-y-1">
          <p className="font-medium text-foreground">{question}</p>
          <p className="text-sm text-muted-foreground">{instruction}</p>
        </div>
      </div>

      {children}

      {feedback && (
        <div
          aria-live="polite"
          className={cn(
            "rounded-xl p-3.5 text-sm",
            feedback.correct ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
          )}
        >
          <p className="font-medium">{feedback.correct ? "Correct!" : "Not quite yet"}</p>
          {feedback.explanation && <p className="mt-1">{feedback.explanation}</p>}
        </div>
      )}
    </div>
  );
}
