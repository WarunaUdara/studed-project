import type { Config, Data } from "@puckeditor/core";

// Define the component props types
export interface TextBlockProps {
  content: string;
}

export interface ImageBlockProps {
  src: string;
  alt: string;
  caption: string;
}

export interface MathVizProps {
  formula: string;
}

export interface MCQBlockProps {
  question: string;
  options: string; // Newline separated options
  correctAnswer: string;
  explanation: string;
}

export interface FillBlankBlockProps {
  question: string;
  correctAnswer: string;
  explanation: string;
}

export interface DragDropBlockProps {
  question: string;
  correctAnswer: string;
  explanation: string;
}

// Define the configuration mapping
export const puckConfig: Config = {
  components: {
    TextBlock: {
      fields: {
        content: { type: "textarea", label: "Text Content" },
      },
      defaultProps: {
        content: "Enter explanation text here...",
      },
      render: ({ content }) => (
        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1.5 py-0.5 rounded bg-muted">
            Learn · Text
          </span>
          <p className="whitespace-pre-wrap leading-relaxed">{content || "No content"}</p>
        </div>
      ),
    },

    ImageBlock: {
      fields: {
        src: { type: "text", label: "Image URL" },
        alt: { type: "text", label: "Alt Text" },
        caption: { type: "text", label: "Caption" },
      },
      defaultProps: {
        src: "",
        alt: "Visual learning aid",
        caption: "",
      },
      render: ({ src, alt, caption }) => (
        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm space-y-3">
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
            Learn · Image
          </span>
          {src ? (
            <div className="space-y-2">
              <img
                src={src}
                alt={alt}
                className="max-h-72 w-full rounded-md object-contain border"
              />
              {caption && <p className="text-xs text-center text-muted-foreground">{caption}</p>}
            </div>
          ) : (
            <div className="flex h-36 items-center justify-center rounded-md border border-dashed bg-muted/50 text-sm text-muted-foreground">
              Provide an Image URL in fields
            </div>
          )}
        </div>
      ),
    },

    MathViz: {
      fields: {
        formula: { type: "textarea", label: "Formula (LaTeX / Text)" },
      },
      defaultProps: {
        formula: "E = mc^2",
      },
      render: ({ formula }) => (
        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm space-y-2 text-center">
          <div className="text-left">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
              Learn · Formula
            </span>
          </div>
          <div className="py-4 bg-muted/30 rounded-md font-mono text-lg select-all">
            {formula || "Provide formula"}
          </div>
        </div>
      ),
    },

    MCQBlock: {
      fields: {
        question: { type: "textarea", label: "Question Text" },
        options: { type: "textarea", label: "Options (One per line)" },
        correctAnswer: { type: "text", label: "Correct Option Value" },
        explanation: { type: "textarea", label: "Explanation for answer" },
      },
      defaultProps: {
        question: "What is the capital of Sri Lanka?",
        options: "Sri Jayawardenepura Kotte\nColombo\nKandy\nGalle",
        correctAnswer: "Sri Jayawardenepura Kotte",
        explanation: "Sri Jayawardenepura Kotte is the official administrative capital.",
      },
      render: ({ question, options, correctAnswer, explanation }) => {
        const optionList = options ? options.split("\n").filter((o: string) => o.trim()) : [];
        return (
          <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 text-card-foreground shadow-sm space-y-3">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-primary px-1.5 py-0.5 rounded bg-primary/10">
              Evaluate · Multiple Choice Quiz
            </span>
            <p className="font-semibold text-foreground">{question}</p>
            {optionList.length > 0 ? (
              <div className="space-y-1.5 pl-2">
                {optionList.map((opt: string) => (
                  <div
                    key={opt}
                    className="flex items-center gap-2 text-sm border rounded p-2 bg-background/50"
                  >
                    <input
                      type="radio"
                      disabled
                      checked={opt === correctAnswer}
                      className="h-3.5 w-3.5"
                    />
                    <span className={opt === correctAnswer ? "font-medium text-success" : ""}>
                      {opt}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic pl-2">No options defined</p>
            )}
            {correctAnswer && (
              <p className="text-xs text-success font-medium">
                Correct Answer: <span className="underline">{correctAnswer}</span>
              </p>
            )}
            {explanation && (
              <p className="text-xs text-muted-foreground bg-background/30 p-2 rounded">
                <span className="font-semibold">Explanation:</span> {explanation}
              </p>
            )}
          </div>
        );
      },
    },

    FillBlankBlock: {
      fields: {
        question: { type: "textarea", label: "Question Text" },
        correctAnswer: { type: "text", label: "Correct Answer" },
        explanation: { type: "textarea", label: "Explanation for answer" },
      },
      defaultProps: {
        question: "Complete: Water consists of hydrogen and ___.",
        correctAnswer: "oxygen",
        explanation: "H2O indicates two parts hydrogen and one part oxygen.",
      },
      render: ({ question, correctAnswer, explanation }) => (
        <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 text-card-foreground shadow-sm space-y-3">
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-primary px-1.5 py-0.5 rounded bg-primary/10">
            Evaluate · Fill In the Blank
          </span>
          <p className="font-semibold text-foreground">{question}</p>
          <div className="flex gap-2 items-center pl-2">
            <input
              type="text"
              disabled
              placeholder="User types here..."
              className="border rounded px-3 py-1.5 bg-background text-sm max-w-xs w-full"
            />
          </div>
          {correctAnswer && (
            <p className="text-xs text-success font-medium">
              Correct Answer: <span className="underline">{correctAnswer}</span>
            </p>
          )}
          {explanation && (
            <p className="text-xs text-muted-foreground bg-background/30 p-2 rounded">
              <span className="font-semibold">Explanation:</span> {explanation}
            </p>
          )}
        </div>
      ),
    },

    DragDropBlock: {
      fields: {
        question: { type: "textarea", label: "Instruction / Question" },
        correctAnswer: { type: "text", label: "Correct Match / Answer" },
        explanation: { type: "textarea", label: "Explanation" },
      },
      defaultProps: {
        question: "Match the following formulas to their names.",
        correctAnswer: "Newton's Second Law: F=ma",
        explanation: "Force equals mass times acceleration.",
      },
      render: ({ question, correctAnswer, explanation }) => (
        <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 text-card-foreground shadow-sm space-y-3">
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-primary px-1.5 py-0.5 rounded bg-primary/10">
            Evaluate · Drag and Drop Match
          </span>
          <p className="font-semibold text-foreground">{question}</p>
          <div className="flex flex-wrap gap-2 pl-2">
            <span className="border rounded-md px-3 py-1.5 bg-background text-sm cursor-grab">
              Formula
            </span>
            <span className="border border-dashed rounded-md px-3 py-1.5 text-muted-foreground text-sm">
              Drop zone
            </span>
          </div>
          {correctAnswer && (
            <p className="text-xs text-success font-medium">
              Correct Pattern: <span className="underline">{correctAnswer}</span>
            </p>
          )}
          {explanation && (
            <p className="text-xs text-muted-foreground bg-background/30 p-2 rounded">
              <span className="font-semibold">Explanation:</span> {explanation}
            </p>
          )}
        </div>
      ),
    },
  },
};

// Serialization mapping functions
export interface LearnBlockRaw {
  id: string;
  type: string;
  content: string;
  metadata?: string | null;
}

export interface EvaluateBlockRaw {
  id: string;
  type: string;
  question: string;
  options?: string[] | null;
  correctAnswer?: string | null;
  explanation?: string | null;
  metadata?: string | null;
}

// Re-export Puck's Data type as PuckData for use in the rest of the app
export type PuckData = Data;

// Convert from GraphQL structure to Puck flat structure
export function waveDataToPuck(
  learnBlocks: LearnBlockRaw[],
  evaluateBlocks: EvaluateBlockRaw[],
): PuckData {
  const content: PuckData["content"] = [];

  // Map Learn blocks
  for (const lb of learnBlocks) {
    if (lb.type === "image") {
      content.push({
        type: "ImageBlock",
        props: {
          id: lb.id,
          src: lb.content,
          alt: "Visual aid",
          caption: lb.metadata || "",
        },
      });
    } else if (lb.type === "formula") {
      content.push({
        type: "MathViz",
        props: {
          id: lb.id,
          formula: lb.content,
        },
      });
    } else {
      content.push({
        type: "TextBlock",
        props: {
          id: lb.id,
          content: lb.content,
        },
      });
    }
  }

  // Map Evaluate blocks
  for (const eb of evaluateBlocks) {
    if (eb.type === "multiple_choice") {
      content.push({
        type: "MCQBlock",
        props: {
          id: eb.id,
          question: eb.question,
          options: (eb.options || []).join("\n"),
          correctAnswer: eb.correctAnswer || "",
          explanation: eb.explanation || "",
        },
      });
    } else if (eb.type === "fill_in_the_blank") {
      content.push({
        type: "FillBlankBlock",
        props: {
          id: eb.id,
          question: eb.question,
          correctAnswer: eb.correctAnswer || "",
          explanation: eb.explanation || "",
        },
      });
    } else {
      content.push({
        type: "DragDropBlock",
        props: {
          id: eb.id,
          question: eb.question,
          correctAnswer: eb.correctAnswer || "",
          explanation: eb.explanation || "",
        },
      });
    }
  }

  return {
    content,
    root: {},
    zones: {},
  };
}

// Convert Puck flat structure back to GraphQL inputs
interface LearnBlockInput {
  id: string;
  type: string;
  content: string;
  metadata: string | null;
}

interface EvaluateBlockInput {
  id: string;
  type: string;
  question: string;
  options: string[] | null;
  correctAnswer: string;
  explanation: string;
  metadata: string | null;
}

// Safe coercion for unknown props
const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);

export function puckToWaveData(puckData: PuckData) {
  const learnBlocks: LearnBlockInput[] = [];
  const evaluateBlocks: EvaluateBlockInput[] = [];

  puckData.content.forEach((block, index) => {
    const id = str(block.props.id) || `block-${index}-${Date.now()}`;
    const type = block.type;

    if (type === "TextBlock") {
      learnBlocks.push({
        id,
        type: "text",
        content: str(block.props.content),
        metadata: null,
      });
    } else if (type === "ImageBlock") {
      learnBlocks.push({
        id,
        type: "image",
        content: str(block.props.src),
        metadata: str(block.props.caption) || null,
      });
    } else if (type === "MathViz") {
      learnBlocks.push({
        id,
        type: "formula",
        content: str(block.props.formula),
        metadata: null,
      });
    } else if (type === "MCQBlock") {
      const rawOptions = str(block.props.options);
      const parsedOptions = rawOptions
        ? rawOptions.split("\n").filter((o: string) => o.trim())
        : [];
      evaluateBlocks.push({
        id,
        type: "multiple_choice",
        question: str(block.props.question),
        options: parsedOptions,
        correctAnswer: str(block.props.correctAnswer),
        explanation: str(block.props.explanation),
        metadata: null,
      });
    } else if (type === "FillBlankBlock") {
      evaluateBlocks.push({
        id,
        type: "fill_in_the_blank",
        question: str(block.props.question),
        options: null,
        correctAnswer: str(block.props.correctAnswer),
        explanation: str(block.props.explanation),
        metadata: null,
      });
    } else if (type === "DragDropBlock") {
      evaluateBlocks.push({
        id,
        type: "drag_and_drop",
        question: str(block.props.question),
        options: null,
        correctAnswer: str(block.props.correctAnswer),
        explanation: str(block.props.explanation),
        metadata: null,
      });
    }
  });

  return {
    learnBlocks,
    evaluateBlocks,
  };
}
