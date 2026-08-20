import { getScene } from "@/components/learn/interactive/animationRegistry";
import type { TapTargetConfig } from "@/lib/content/interactiveBlocks";
import {
  decodeTapAnswer,
  encodeTapAnswer,
  parseBlockConfig,
} from "@/lib/content/interactiveBlocks";
import { playClickSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import type { InteractiveEvaluateProps } from "./types";

/** Tap the right thing in the picture: the cheapest manipulation to explain. */
export function TapTargetBlock({
  block,
  answer,
  onAnswerChange,
  disabled,
}: InteractiveEvaluateProps) {
  const config = parseBlockConfig<TapTargetConfig>(block.metadata);
  const targets = config?.targets ?? [];
  const selected = decodeTapAnswer(answer);
  const scene = getScene(config?.scene);

  const toggle = (targetId: string) => {
    if (disabled) return;
    playClickSound();
    const isSelected = selected.includes(targetId);
    if (config?.multi) {
      const next = isSelected ? selected.filter((id) => id !== targetId) : [...selected, targetId];
      onAnswerChange(encodeTapAnswer(next));
      return;
    }
    onAnswerChange(isSelected ? "" : encodeTapAnswer([targetId]));
  };

  return (
    <div className="space-y-3">
      {scene && (
        <div className="rounded-xl border bg-muted/30 p-3">
          <scene.Component params={{}} />
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {targets.map((target) => {
          const isSelected = selected.includes(target.id);
          return (
            <button
              key={target.id}
              type="button"
              onClick={() => toggle(target.id)}
              disabled={disabled}
              aria-pressed={isSelected}
              className={cn(
                "min-h-12 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-70",
                isSelected
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted",
              )}
            >
              {target.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
