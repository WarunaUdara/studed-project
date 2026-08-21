import { useState } from "react";
import type { SliderTargetConfig } from "@/lib/content/interactiveBlocks";
import { encodeSliderAnswer, parseBlockConfig } from "@/lib/content/interactiveBlocks";
import { playClickSound } from "@/lib/sounds";
import type { InteractiveEvaluateProps } from "./types";

/**
 * Slide to the right amount. The answer is the band the slider lands in, not an
 * exact number, so a child is judged on the physical judgement the question is
 * really asking about.
 */
export function SliderTargetBlock({
  block,
  answer,
  onAnswerChange,
  disabled,
}: InteractiveEvaluateProps) {
  const config = parseBlockConfig<SliderTargetConfig>(block.metadata);
  const min = config?.min ?? 0;
  const max = config?.max ?? 10;
  const bands = config?.bands ?? [];

  const [value, setValue] = useState(() => Math.round((min + max) / 2));
  const band = encodeSliderAnswer(value, bands);

  const commit = (next: number) => {
    setValue(next);
    onAnswerChange(encodeSliderAnswer(next, bands));
  };

  return (
    <div className="space-y-2">
      <input
        id={`slider-${block.id}`}
        type="range"
        min={min}
        max={max}
        step={config?.step ?? 1}
        value={value}
        disabled={disabled}
        onChange={(event) => commit(Number(event.target.value))}
        onPointerUp={() => playClickSound()}
        aria-label={block.question}
        aria-valuetext={`${value}${config?.unit ? ` ${config.unit}` : ""}`}
        className="h-11 w-full cursor-pointer accent-primary touch-manipulation disabled:cursor-not-allowed"
      />
      <p className="text-sm font-medium text-foreground">
        {value}
        {config?.unit ? ` ${config.unit}` : ""}
        {answer && band ? ` · ${band.replace(/-/g, " ")}` : ""}
      </p>
    </div>
  );
}
