import { useState } from "react";
import { cn } from "@/lib/utils";

interface EvaluateBlock {
  id: string;
  type: string;
  question: string;
  options?: string[] | null;
  correctAnswer?: string | null;
  explanation?: string | null;
  metadata?: string | null;
}

interface QuizBlockProps {
  block: EvaluateBlock;
  index: number;
  answer: string;
  onAnswerChange: (answer: string) => void;
  feedback?: {
    correct: boolean;
    correctAnswer?: string | null;
    explanation?: string | null;
  } | null;
}

export function QuizBlock({ block, index, answer, onAnswerChange, feedback }: QuizBlockProps) {
  const [textAnswer, setTextAnswer] = useState(answer);

  const handleTextBlur = () => {
    onAnswerChange(textAnswer);
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          {index + 1}
        </span>
        <p className="font-medium text-foreground">{block.question}</p>
      </div>

      {block.options && block.options.length > 0 ? (
        <div className="space-y-2 pl-0 sm:pl-9">
          {block.options.map((option) => (
            <label
              key={option}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 min-h-[48px] touch-manipulation transition-colors hover:bg-muted active:bg-muted/80 ${
                answer === option ? "border-primary bg-primary/5 font-medium" : ""
              }`}
            >
              <input
                type="radio"
                name={`question-${block.id}`}
                value={option}
                checked={answer === option}
                onChange={(e) => onAnswerChange(e.target.value)}
                className="h-4.5 w-4.5 text-primary"
              />
              <span className="text-foreground text-sm sm:text-base leading-snug">{option}</span>
            </label>
          ))}
        </div>
      ) : (
        <div className="pl-0 sm:pl-9">
          <input
            type="text"
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            onBlur={handleTextBlur}
            placeholder="Type your answer..."
            className="w-full rounded-xl border bg-background px-3.5 py-3 text-base sm:text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      )}

      {feedback && (
        <div
          className={cn(
            "mt-3 rounded-xl p-3.5 pl-3 sm:pl-9",
            feedback.correct ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
          )}
        >
          <p className="font-medium">{feedback.correct ? "Correct!" : "Incorrect"}</p>
          {!feedback.correct && feedback.correctAnswer && (
            <p className="text-sm">Correct answer: {feedback.correctAnswer}</p>
          )}
          {feedback.explanation && <p className="text-sm mt-1">{feedback.explanation}</p>}
        </div>
      )}
    </div>
  );
}
