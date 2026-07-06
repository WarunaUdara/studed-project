import { useState } from "react";

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
        <div className="space-y-2 pl-9">
          {block.options.map((option) => (
            <label
              key={option}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted ${
                answer === option ? "border-primary bg-primary/5" : ""
              }`}
            >
              <input
                type="radio"
                name={`question-${block.id}`}
                value={option}
                checked={answer === option}
                onChange={(e) => onAnswerChange(e.target.value)}
                className="h-4 w-4"
              />
              <span className="text-foreground">{option}</span>
            </label>
          ))}
        </div>
      ) : (
        <div className="pl-9">
          <input
            type="text"
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            onBlur={handleTextBlur}
            placeholder="Type your answer"
            className="w-full rounded-md border bg-background px-3 py-2 text-foreground"
          />
        </div>
      )}

      {feedback && (
        <div
          className={`rounded-lg p-3 pl-9 ${
            feedback.correct ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          <p className="font-medium">{feedback.correct ? "Correct" : "Incorrect"}</p>
          {!feedback.correct && feedback.correctAnswer && (
            <p className="text-sm">Correct answer: {feedback.correctAnswer}</p>
          )}
          {feedback.explanation && (
            <p className="text-sm">{feedback.explanation}</p>
          )}
        </div>
      )}
    </div>
  );
}
