import { hasInteractiveConfig, isInteractiveEvaluateType } from "@/lib/content/interactiveBlocks";
import { DragDropBlock } from "./interactive/DragDropBlock";
import { InteractiveCard } from "./interactive/InteractiveCard";
import { OrderStepsBlock } from "./interactive/OrderStepsBlock";
import { SliderTargetBlock } from "./interactive/SliderTargetBlock";
import { TapTargetBlock } from "./interactive/TapTargetBlock";
import { ToggleSwitchBlock } from "./interactive/ToggleSwitchBlock";
import type {
  EvaluateBlockData,
  EvaluateFeedback,
  InteractiveEvaluateProps,
} from "./interactive/types";
import { QuizBlock } from "./QuizBlock";

interface EvaluateBlockRendererProps {
  block: EvaluateBlockData;
  index: number;
  answer: string;
  onAnswerChange: (answer: string) => void;
  feedback?: EvaluateFeedback | null;
  disabled?: boolean;
}

const INTERACTIVE_BODIES: Record<string, (props: InteractiveEvaluateProps) => React.ReactElement> =
  {
    tap_target: TapTargetBlock,
    drag_drop: DragDropBlock,
    order_steps: OrderStepsBlock,
    toggle_switch: ToggleSwitchBlock,
    slider_target: SliderTargetBlock,
  };

/** Kid-level instruction shown under every question of that type. */
const INSTRUCTIONS: Record<string, string> = {
  tap_target: "Tap your answer.",
  drag_drop: "Pick a part, then tap where it goes.",
  order_steps: "Use the arrows to put these in order.",
  toggle_switch: "Flip the switches.",
  slider_target: "Slide it to the right spot.",
};

/**
 * Single entry point for rendering an evaluate block. Interactive types get the
 * manipulative renderer; multiple choice and typed answers keep the existing
 * quiz card, so older content keeps working unchanged.
 */
export function EvaluateBlockRenderer({
  block,
  index,
  answer,
  onAnswerChange,
  feedback,
  disabled,
}: EvaluateBlockRendererProps) {
  const type = block.type.toLowerCase();

  // A manipulative type with no interaction to manipulate is not manipulative;
  // it falls back to the plain question card so the student can still answer.
  if (!isInteractiveEvaluateType(type) || !hasInteractiveConfig(type, block.metadata)) {
    return (
      <QuizBlock
        block={block}
        index={index}
        answer={answer}
        onAnswerChange={onAnswerChange}
        feedback={feedback}
      />
    );
  }

  const Body = INTERACTIVE_BODIES[type];

  return (
    <InteractiveCard
      index={index}
      question={block.question}
      instruction={INSTRUCTIONS[type] ?? "Try it out."}
      feedback={feedback}
    >
      <Body block={block} answer={answer} onAnswerChange={onAnswerChange} disabled={disabled} />
    </InteractiveCard>
  );
}
