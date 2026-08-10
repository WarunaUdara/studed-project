import type { Config, Data } from "@puckeditor/core";
import { MathFormula } from "@/components/ui/MathFormula";
import { ManimBlock } from "@/components/learn/visualizations/ManimBlock";
import { Mol3DBlock } from "@/components/learn/visualizations/Mol3DBlock";
import { TsCircuitBlock } from "@/components/learn/visualizations/TsCircuitBlock";
import { MatterPhysicsBlock } from "@/components/learn/visualizations/MatterPhysicsBlock";

// ---------------------------------------------------------------------------
// Block props
// ---------------------------------------------------------------------------

export interface TextBlockProps {
  content: string;
}

export interface ImageBlockProps {
  src: string;
  alt: string;
  caption: string;
}

export interface VideoBlockProps {
  src: string;
  caption: string;
}

export interface CalloutBlockProps {
  content: string;
}

export interface ExampleBlockProps {
  content: string;
}

export interface MathVizProps {
  formula: string;
}

export interface VizBlockProps {
  vizType: string; // mathviz_manim | chemviz_3dmol | elecsim_tscircuit | mechsim_matterjs
  content: string;
  metadata: string;
  // Convenience editor fields (merged into metadata at render time).
  scenarioType?: string;
  moleculeSmiles?: string;
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

export interface TrueFalseBlockProps {
  question: string;
  correctAnswer: string; // "True" | "False"
  explanation: string;
}

export interface NumericBlockProps {
  question: string;
  correctAnswer: string;
  explanation: string;
}

export interface DragDropBlockProps {
  question: string;
  correctAnswer: string;
  explanation: string;
}

// ---------------------------------------------------------------------------
// Shared render helpers
// ---------------------------------------------------------------------------

function LearnBadge({ label }: { label: string }) {
  return (
    <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
      Learn · {label}
    </span>
  );
}

function EvaluateBadge({ label }: { label: string }) {
  return (
    <span className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary mb-2">
      Evaluate · {label}
    </span>
  );
}

const VIZ_LABELS: Record<string, string> = {
  mathviz_manim: "Math Animation (Manim)",
  chemviz_3dmol: "3D Molecule (3Dmol.js)",
  elecsim_tscircuit: "Circuit Simulation (tscircuit)",
  mechsim_matterjs: "Physics Simulation (Matter.js)",
};

// Renders the same interactive visualization components students see, right
// inside the editor canvas, so educators can inspect them while editing.
function VizBlockPreview({ vizType, content, metadata }: VizBlockProps) {
  switch (vizType) {
    case "chemviz_3dmol":
    case "molecule_3dmol":
      return <Mol3DBlock content={content} metadata={metadata} />;
    case "elecsim_tscircuit":
    case "circuit_tscircuit":
      return <TsCircuitBlock content={content} metadata={metadata} />;
    case "mechsim_matterjs":
    case "simulation_matter":
      return <MatterPhysicsBlock content={content} metadata={metadata} />;
    case "mathviz_manim":
    case "manim":
    default:
      return <ManimBlock content={content} metadata={metadata} />;
  }
}

// ---------------------------------------------------------------------------
// Puck config
// ---------------------------------------------------------------------------

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
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <LearnBadge label="Text" />
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
        <div className="space-y-3 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <LearnBadge label="Image" />
          {src ? (
            <div className="space-y-2">
              <img
                src={src}
                alt={alt}
                className="max-h-72 w-full rounded-md border object-contain"
              />
              {caption && <p className="text-center text-xs text-muted-foreground">{caption}</p>}
            </div>
          ) : (
            <div className="flex h-36 items-center justify-center rounded-md border border-dashed bg-muted/50 text-sm text-muted-foreground">
              Provide an Image URL in fields
            </div>
          )}
        </div>
      ),
    },

    VideoBlock: {
      fields: {
        src: { type: "text", label: "Video URL / Embed URL" },
        caption: { type: "text", label: "Caption" },
      },
      defaultProps: {
        src: "",
        caption: "",
      },
      render: ({ src, caption }) => (
        <div className="space-y-3 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <LearnBadge label="Video" />
          {src ? (
            <div className="space-y-2">
              <div className="aspect-video overflow-hidden rounded-md border bg-black">
                {src.includes("youtube.com") || src.includes("youtu.be") ? (
                  <iframe
                    src={src.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                    title="Lesson video"
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video src={src} controls className="h-full w-full" />
                )}
              </div>
              {caption && <p className="text-center text-xs text-muted-foreground">{caption}</p>}
            </div>
          ) : (
            <div className="flex h-36 items-center justify-center rounded-md border border-dashed bg-muted/50 text-sm text-muted-foreground">
              Provide a video URL in fields
            </div>
          )}
        </div>
      ),
    },

    CalloutBlock: {
      fields: {
        content: { type: "textarea", label: "Callout Content" },
      },
      defaultProps: {
        content: "Remember this key point...",
      },
      render: ({ content }) => (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-card-foreground shadow-sm">
          <LearnBadge label="Callout" />
          <p className="whitespace-pre-wrap leading-relaxed">{content || "No content"}</p>
        </div>
      ),
    },

    ExampleBlock: {
      fields: {
        content: { type: "textarea", label: "Example Content" },
      },
      defaultProps: {
        content: "Worked example...",
      },
      render: ({ content }) => (
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <LearnBadge label="Example" />
          <p className="whitespace-pre-wrap leading-relaxed">{content || "No content"}</p>
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
        <div className="space-y-2 rounded-lg border bg-card p-4 text-center text-card-foreground shadow-sm">
          <div className="text-left">
            <LearnBadge label="Formula" />
          </div>
          <div className="overflow-x-auto rounded-md bg-muted/30 py-4 text-lg">
            <MathFormula formula={formula || "\\text{Provide formula}"} />
          </div>
        </div>
      ),
    },

    VizBlock: {
      fields: {
        vizType: {
          type: "select",
          label: "Visualization Type",
          options: Object.entries(VIZ_LABELS).map(([value, label]) => ({ value, label })),
        },
        content: { type: "textarea", label: "Description / Content" },
        // Physics (mechsim_matterjs): scenario + world config
        scenarioType: {
          type: "select",
          label: "Physics Scenario",
          options: [
            { value: "pendulum", label: "Pendulum" },
            { value: "collision", label: "Collision" },
            { value: "projectile", label: "Projectile Motion" },
            { value: "spring", label: "Spring" },
            { value: "newtons_cradle", label: "Newton's Cradle" },
            { value: "inclined_plane", label: "Inclined Plane" },
            { value: "circular_motion", label: "Circular Motion" },
            { value: "planetary_orbit", label: "Planetary Orbit" },
            { value: "custom", label: "Custom" },
          ],
        },
        // Chemistry (chemviz_3dmol): molecule source
        moleculeSmiles: { type: "text", label: "Molecule SMILES (chemistry)" },
        // Advanced: raw config JSON
        metadata: { type: "textarea", label: "Config JSON (advanced)" },
      },
      defaultProps: {
        vizType: "mathviz_manim",
        content: "Interactive visualization",
        scenarioType: "custom",
        moleculeSmiles: "O",
        metadata: "{}",
      },
      render: ({ vizType, content, scenarioType, moleculeSmiles, metadata }) => {
        // Merge convenience fields into the raw config so the renderers get
        // a complete metadata object even when only the quick fields were set.
        let merged: Record<string, unknown> = {};
        try {
          merged = metadata ? JSON.parse(metadata) : {};
        } catch {
          merged = {};
        }
        if (vizType === "mechsim_matterjs" && scenarioType && !merged.scenario_type) {
          merged.scenario_type = scenarioType;
          merged.title = merged.title ?? content ?? "Physics Simulation";
          merged.world_config = merged.world_config ?? {
            gravity: { x: 0, y: 1, scale: 0.001 },
            bounds: { width: 800, height: 400 },
            bodies: [{ id: "ball", type: "circle", position: { x: 400, y: 100 }, radius: 25, density: 0.001, restitution: 0.8 }],
          };
        }
        if (vizType === "chemviz_3dmol" && moleculeSmiles) {
          merged.title = merged.title ?? content ?? "Molecule";
          merged.molecule = merged.molecule ?? { source_type: "smiles", source_value: moleculeSmiles };
          merged.style = merged.style ?? { stick: { radius: 0.15, colorscheme: "Jmol" } };
        }
        return <VizBlockPreview vizType={vizType} content={content} metadata={JSON.stringify(merged)} />;
      },
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
          <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-card-foreground shadow-sm">
            <EvaluateBadge label="Multiple Choice" />
            <p className="font-semibold text-foreground">{question}</p>
            {optionList.length > 0 ? (
              <div className="space-y-1.5 pl-2">
                {optionList.map((opt: string) => (
                  <div
                    key={opt}
                    className="flex items-center gap-2 rounded border bg-background/50 p-2 text-sm"
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
              <p className="pl-2 text-sm italic text-muted-foreground">No options defined</p>
            )}
            {correctAnswer && (
              <p className="text-xs font-medium text-success">
                Correct Answer: <span className="underline">{correctAnswer}</span>
              </p>
            )}
            {explanation && (
              <p className="rounded bg-background/30 p-2 text-xs text-muted-foreground">
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
        <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-card-foreground shadow-sm">
          <EvaluateBadge label="Fill In the Blank" />
          <p className="font-semibold text-foreground">{question}</p>
          <div className="flex w-full max-w-xs gap-2 pl-2">
            <input
              type="text"
              disabled
              placeholder="User types here..."
              className="w-full rounded border bg-background px-3 py-1.5 text-sm"
            />
          </div>
          {correctAnswer && (
            <p className="text-xs font-medium text-success">
              Correct Answer: <span className="underline">{correctAnswer}</span>
            </p>
          )}
          {explanation && (
            <p className="rounded bg-background/30 p-2 text-xs text-muted-foreground">
              <span className="font-semibold">Explanation:</span> {explanation}
            </p>
          )}
        </div>
      ),
    },

    TrueFalseBlock: {
      fields: {
        question: { type: "textarea", label: "Statement" },
        correctAnswer: {
          type: "select",
          label: "Correct Answer",
          options: [
            { value: "True", label: "True" },
            { value: "False", label: "False" },
          ],
        },
        explanation: { type: "textarea", label: "Explanation" },
      },
      defaultProps: {
        question: "The Earth revolves around the Sun.",
        correctAnswer: "True",
        explanation: "The Earth orbits the Sun once per year.",
      },
      render: ({ question, correctAnswer, explanation }) => (
        <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-card-foreground shadow-sm">
          <EvaluateBadge label="True / False" />
          <p className="font-semibold text-foreground">{question}</p>
          <div className="flex gap-2 pl-2">
            {["True", "False"].map((opt) => (
              <span
                key={opt}
                className={`rounded border px-4 py-1.5 text-sm ${
                  opt === correctAnswer
                    ? "border-success/40 bg-success/10 font-medium text-success"
                    : "bg-background/50"
                }`}
              >
                {opt}
              </span>
            ))}
          </div>
          {correctAnswer && (
            <p className="text-xs font-medium text-success">
              Correct Answer: <span className="underline">{correctAnswer}</span>
            </p>
          )}
          {explanation && (
            <p className="rounded bg-background/30 p-2 text-xs text-muted-foreground">
              <span className="font-semibold">Explanation:</span> {explanation}
            </p>
          )}
        </div>
      ),
    },

    NumericBlock: {
      fields: {
        question: { type: "textarea", label: "Question Text" },
        correctAnswer: { type: "text", label: "Numeric Answer" },
        explanation: { type: "textarea", label: "Explanation" },
      },
      defaultProps: {
        question: "What is the value of pi to two decimal places?",
        correctAnswer: "3.14",
        explanation: "Pi rounded to two decimals is 3.14.",
      },
      render: ({ question, correctAnswer, explanation }) => (
        <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-card-foreground shadow-sm">
          <EvaluateBadge label="Numeric" />
          <p className="font-semibold text-foreground">{question}</p>
          <input
            type="number"
            disabled
            placeholder="User enters a number..."
            className="w-full max-w-xs rounded border bg-background px-3 py-1.5 pl-2 text-sm"
          />
          {correctAnswer && (
            <p className="text-xs font-medium text-success">
              Correct Answer: <span className="underline">{correctAnswer}</span>
            </p>
          )}
          {explanation && (
            <p className="rounded bg-background/30 p-2 text-xs text-muted-foreground">
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
        <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-card-foreground shadow-sm">
          <EvaluateBadge label="Drag and Drop" />
          <p className="font-semibold text-foreground">{question}</p>
          <div className="flex flex-wrap gap-2 pl-2">
            <span className="cursor-grab rounded-md border bg-background px-3 py-1.5 text-sm">
              Item
            </span>
            <span className="rounded-md border border-dashed px-3 py-1.5 text-sm text-muted-foreground">
              Drop zone
            </span>
          </div>
          {correctAnswer && (
            <p className="text-xs font-medium text-success">
              Correct Pattern: <span className="underline">{correctAnswer}</span>
            </p>
          )}
          {explanation && (
            <p className="rounded bg-background/30 p-2 text-xs text-muted-foreground">
              <span className="font-semibold">Explanation:</span> {explanation}
            </p>
          )}
        </div>
      ),
    },
  },
};

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

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

export type PuckData = Data;

// Map a raw learn block to a Puck content item.
function learnBlockToItem(lb: LearnBlockRaw): PuckData["content"][number] {
  const type = lb.type.toLowerCase();
  const common = { id: lb.id };
  switch (type) {
    case "image":
      return { type: "ImageBlock", props: { ...common, src: lb.content, alt: "Visual aid", caption: lb.metadata || "" } };
    case "video":
      return { type: "VideoBlock", props: { ...common, src: lb.content, caption: lb.metadata || "" } };
    case "formula":
    case "math":
      return { type: "MathViz", props: { ...common, formula: lb.content } };
    case "callout":
      return { type: "CalloutBlock", props: { ...common, content: lb.content } };
    case "example":
      return { type: "ExampleBlock", props: { ...common, content: lb.content } };
    case "mathviz_manim":
    case "chemviz_3dmol":
    case "elecsim_tscircuit":
    case "mechsim_matterjs":
      return { type: "VizBlock", props: { ...common, vizType: type, content: lb.content, metadata: lb.metadata || "{}" } };
    default:
      return { type: "TextBlock", props: { ...common, content: lb.content } };
  }
}

// Map a raw evaluate block to a Puck content item.
function evaluateBlockToItem(eb: EvaluateBlockRaw): PuckData["content"][number] {
  const type = eb.type.toLowerCase();
  const common = { id: eb.id, question: eb.question, correctAnswer: eb.correctAnswer || "", explanation: eb.explanation || "" };
  switch (type) {
    case "multiple_choice":
    case "mcq":
      return { type: "MCQBlock", props: { ...common, options: (eb.options || []).join("\n") } };
    case "fill_in_the_blank":
    case "fill_in_blank":
      return { type: "FillBlankBlock", props: { ...common } };
    case "true_false":
      return { type: "TrueFalseBlock", props: { ...common } };
    case "numeric":
      return { type: "NumericBlock", props: { ...common } };
    default:
      return { type: "DragDropBlock", props: { ...common } };
  }
}

// Convert wave blocks (GraphQL shape) to a full Puck document.
export function waveDataToPuck(
  learnBlocks: LearnBlockRaw[],
  evaluateBlocks: EvaluateBlockRaw[],
): PuckData {
  const content: PuckData["content"] = [];
  for (const lb of learnBlocks ?? []) content.push(learnBlockToItem(lb));
  for (const eb of evaluateBlocks ?? []) content.push(evaluateBlockToItem(eb));
  return { content, root: {}, zones: {} };
}

// Convert AI-agent generated blocks into Puck content items for auto-insert.
export function agentBlocksToPuckItems(
  learnBlocks: LearnBlockRaw[],
  evaluateBlocks: EvaluateBlockRaw[],
): PuckData["content"] {
  const items: PuckData["content"] = [];
  for (const lb of learnBlocks ?? []) items.push(learnBlockToItem(lb));
  for (const eb of evaluateBlocks ?? []) items.push(evaluateBlockToItem(eb));
  return items;
}

// ---------------------------------------------------------------------------
// Block operations (edit / delete from the AI assistant)
// ---------------------------------------------------------------------------

export interface BlockOpsInput {
  upsertLearn?: LearnBlockRaw[];
  upsertEval?: EvaluateBlockRaw[];
  deleteIDs?: string[];
}

const itemId = (v: unknown): string => (typeof v === "string" ? v : "");

/**
 * Applies upsert (update-or-add by id) and delete operations to a Puck
 * document. Used when the agent edits or removes existing blocks: existing
 * ids are replaced in place, new ids are appended, and deleteIDs are removed.
 * Pure and unit-tested.
 */
export function applyBlockOpsToData(data: PuckData, ops: BlockOpsInput): PuckData {
  const deleteSet = new Set(ops.deleteIDs ?? []);
  const upsertItems = agentBlocksToPuckItems(ops.upsertLearn ?? [], ops.upsertEval ?? []);
  const upsertById = new Map(upsertItems.map((it) => [itemId(it.props.id), it]));

  let content = (data.content ?? []).slice();
  content = content.filter((item) => !deleteSet.has(itemId(item.props.id)));

  const seen = new Set(content.map((item) => itemId(item.props.id)));
  content = content.map((item) => upsertById.get(itemId(item.props.id)) ?? item);
  for (const [id, item] of upsertById) {
    if (!seen.has(id)) content.push(item);
  }

  return { ...data, content };
}

// ---------------------------------------------------------------------------
// Puck document -> GraphQL wave inputs
// ---------------------------------------------------------------------------

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

const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);

export function puckToWaveData(puckData: PuckData) {
  const learnBlocks: LearnBlockInput[] = [];
  const evaluateBlocks: EvaluateBlockInput[] = [];

  puckData.content.forEach((block, index) => {
    const id = str(block.props.id) || `block-${index}-${Date.now()}`;
    const type = block.type;

    switch (type) {
      case "TextBlock":
        learnBlocks.push({ id, type: "text", content: str(block.props.content), metadata: null });
        break;
      case "ImageBlock":
        learnBlocks.push({
          id,
          type: "image",
          content: str(block.props.src),
          metadata: str(block.props.caption) || null,
        });
        break;
      case "VideoBlock":
        learnBlocks.push({
          id,
          type: "video",
          content: str(block.props.src),
          metadata: str(block.props.caption) || null,
        });
        break;
      case "CalloutBlock":
        learnBlocks.push({ id, type: "callout", content: str(block.props.content), metadata: null });
        break;
      case "ExampleBlock":
        learnBlocks.push({ id, type: "example", content: str(block.props.content), metadata: null });
        break;
      case "MathViz":
        learnBlocks.push({ id, type: "formula", content: str(block.props.formula), metadata: null });
        break;
      case "VizBlock":
        learnBlocks.push({
          id,
          type: str(block.props.vizType) || "mathviz_manim",
          content: str(block.props.content),
          metadata: str(block.props.metadata) || null,
        });
        break;
      case "MCQBlock": {
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
        break;
      }
      case "FillBlankBlock":
        evaluateBlocks.push({
          id,
          type: "fill_in_the_blank",
          question: str(block.props.question),
          options: null,
          correctAnswer: str(block.props.correctAnswer),
          explanation: str(block.props.explanation),
          metadata: null,
        });
        break;
      case "TrueFalseBlock":
        evaluateBlocks.push({
          id,
          type: "true_false",
          question: str(block.props.question),
          options: null,
          correctAnswer: str(block.props.correctAnswer),
          explanation: str(block.props.explanation),
          metadata: null,
        });
        break;
      case "NumericBlock":
        evaluateBlocks.push({
          id,
          type: "numeric",
          question: str(block.props.question),
          options: null,
          correctAnswer: str(block.props.correctAnswer),
          explanation: str(block.props.explanation),
          metadata: null,
        });
        break;
      case "DragDropBlock":
        evaluateBlocks.push({
          id,
          type: "drag_and_drop",
          question: str(block.props.question),
          options: null,
          correctAnswer: str(block.props.correctAnswer),
          explanation: str(block.props.explanation),
          metadata: null,
        });
        break;
    }
  });

  return { learnBlocks, evaluateBlocks };
}
