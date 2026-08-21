import { ArrowDown, ArrowUp } from "lucide-react";
import type { OrderStepsConfig } from "@/lib/content/interactiveBlocks";
import {
  decodeOrderAnswer,
  encodeOrderAnswer,
  parseBlockConfig,
} from "@/lib/content/interactiveBlocks";
import { playClickSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import type { InteractiveEvaluateProps } from "./types";

/** Moves an item one place up or down, leaving the rest of the order intact. */
export function moveStep(order: string[], index: number, direction: -1 | 1): string[] {
  const target = index + direction;
  if (target < 0 || target >= order.length) return order;
  const next = [...order];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** Put the steps in the order they really happen. */
export function OrderStepsBlock({
  block,
  answer,
  onAnswerChange,
  disabled,
}: InteractiveEvaluateProps) {
  const config = parseBlockConfig<OrderStepsConfig>(block.metadata);
  const steps = config?.steps ?? [];
  const stored = decodeOrderAnswer(answer);

  // Fall back to the authored order so the list is never empty, and drop any
  // stored id that no longer exists in the block.
  const order = stored.length === steps.length ? stored : steps.map((step) => step.id);

  const move = (index: number, direction: -1 | 1) => {
    if (disabled) return;
    playClickSound();
    onAnswerChange(encodeOrderAnswer(moveStep(order, index, direction)));
  };

  return (
    <ol className="space-y-2">
      {order.map((stepId, index) => {
        const step = steps.find((candidate) => candidate.id === stepId);
        if (!step) return null;
        return (
          <li key={step.id} className="flex items-center gap-3 rounded-xl border bg-background p-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-foreground">
              {index + 1}
            </span>
            <span className="flex-1 text-sm text-foreground">{step.label}</span>
            <span className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={disabled || index === 0}
                aria-label={`Move "${step.label}" earlier`}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl border transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40",
                )}
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={disabled || index === order.length - 1}
                aria-label={`Move "${step.label}" later`}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl border transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40",
                )}
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
