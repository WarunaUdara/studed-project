import { Eye, Info, Play } from "lucide-react";
import { LearnBlockRenderer } from "@/components/learn/LearnBlockRenderer";
import { type PuckData, puckToWaveData } from "@/components/puck-blocks/puck-config";

interface WavePreviewProps {
  title: string;
  puckData: PuckData;
}

// Read-only student-facing preview of the wave. Reuses the same renderers
// students see (LearnBlockRenderer + a static quiz layout) so the educator
// can verify exactly what learners will experience before publishing.
export function WavePreview({ title, puckData }: WavePreviewProps) {
  const { learnBlocks, evaluateBlocks } = puckToWaveData(puckData);
  const hasContent = learnBlocks.length + evaluateBlocks.length > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      {/* Wave header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Play className="h-3.5 w-3.5" />
          Wave Preview
        </div>
        <h1 className="text-3xl font-bold text-foreground">{title || "Untitled wave"}</h1>
      </div>

      {!hasContent && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30 py-20 text-center">
          <Eye className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium text-foreground">Nothing to preview yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Add blocks in the editor or ask the AI assistant to generate content, then switch
            back to Preview to see the student experience.
          </p>
        </div>
      )}

      {/* Learn section */}
      {learnBlocks.length > 0 && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Info className="h-4 w-4" /> Learn
          </h2>
          {learnBlocks.map((block) => (
            <LearnBlockRenderer key={block.id} block={block} />
          ))}
        </section>
      )}

      {/* Evaluate section */}
      {evaluateBlocks.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Evaluate
          </h2>
          {evaluateBlocks.map((block, index) => (
            <EvaluatePreview key={block.id} block={block} index={index} />
          ))}
        </section>
      )}
    </div>
  );
}

interface EvaluateBlockLike {
  id: string;
  type: string;
  question: string;
  options?: string[] | null;
  correctAnswer?: string | null;
  explanation?: string | null;
}

function EvaluatePreview({ block, index }: { block: EvaluateBlockLike; index: number }) {
  const isMcq = block.type === "multiple_choice" || block.type === "mcq";
  const isNumeric = block.type === "numeric";
  const isTrueFalse = block.type === "true_false";
  const isFill = block.type === "fill_in_the_blank" || block.type === "fill_in_blank";
  const options = block.options?.filter(Boolean) ?? [];

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          {index + 1}
        </span>
        <p className="font-medium text-foreground">{block.question}</p>
      </div>

      {isMcq && options.length > 0 && (
        <div className="space-y-2 pl-9">
          {options.map((option) => (
            <div
              key={option}
              className="flex items-center gap-3 rounded-xl border p-3.5 text-sm text-foreground"
            >
              <input type="radio" disabled className="h-4 w-4" />
              <span>{option}</span>
            </div>
          ))}
        </div>
      )}

      {isTrueFalse && (
        <div className="flex gap-2 pl-9">
          {["True", "False"].map((opt) => (
            <span
              key={opt}
              className="rounded-xl border px-5 py-2.5 text-sm text-foreground"
            >
              {opt}
            </span>
          ))}
        </div>
      )}

      {isNumeric && (
        <div className="pl-9">
          <input
            type="number"
            disabled
            placeholder="Your answer..."
            className="w-full max-w-xs rounded-xl border bg-background px-3.5 py-3 text-sm"
          />
        </div>
      )}

      {isFill && (
        <div className="pl-9">
          <input
            type="text"
            disabled
            placeholder="Type your answer..."
            className="w-full max-w-xs rounded-xl border bg-background px-3.5 py-3 text-sm"
          />
        </div>
      )}

      {!isMcq && !isTrueFalse && !isNumeric && !isFill && (
        <p className="pl-9 text-sm text-muted-foreground italic">
          {block.type === "drag_and_drop" || block.type === "drag_drop"
            ? "Interactive drag-and-drop activity"
            : "Interactive activity"}
        </p>
      )}

      {block.correctAnswer && (
        <p className="pl-9 text-xs font-medium text-success">
          Correct answer: {block.correctAnswer}
        </p>
      )}
      {block.explanation && (
        <p className="rounded-xl bg-muted/40 p-3 pl-9 text-xs text-muted-foreground">
          <span className="font-semibold">Explanation:</span> {block.explanation}
        </p>
      )}
    </div>
  );
}
