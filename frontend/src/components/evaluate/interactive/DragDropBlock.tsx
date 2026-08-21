import { useState } from "react";
import type { DragDropConfig } from "@/lib/content/interactiveBlocks";
import {
  decodeDragAnswer,
  encodeDragAnswer,
  parseBlockConfig,
} from "@/lib/content/interactiveBlocks";
import { playClickSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import type { InteractiveEvaluateProps } from "./types";

/**
 * Move parts into labelled places.
 *
 * The gesture is pick-then-place rather than a pointer drag: it works the same
 * with a finger, a mouse, and a keyboard, and a child on a tablet cannot lose
 * the item halfway. Native drag is offered on top for students who reach for it.
 */
export function DragDropBlock({
  block,
  answer,
  onAnswerChange,
  disabled,
}: InteractiveEvaluateProps) {
  const config = parseBlockConfig<DragDropConfig>(block.metadata);
  const items = config?.items ?? [];
  const slots = config?.slots ?? [];
  const placements = decodeDragAnswer(answer);
  const [picked, setPicked] = useState<string | null>(null);

  const placedItemIds = new Set(Object.values(placements));

  const place = (slotId: string) => {
    if (disabled) return;
    playClickSound();
    const next = { ...placements };
    if (next[slotId]) {
      delete next[slotId];
      onAnswerChange(encodeDragAnswer(next));
      return;
    }
    if (!picked) return;
    for (const [existingSlot, itemId] of Object.entries(next)) {
      if (itemId === picked) delete next[existingSlot];
    }
    next[slotId] = picked;
    setPicked(null);
    onAnswerChange(encodeDragAnswer(next));
  };

  const labelFor = (itemId: string) => items.find((item) => item.id === itemId)?.label ?? itemId;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">Parts</p>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => {
            const isPlaced = placedItemIds.has(item.id);
            return (
              <button
                key={item.id}
                type="button"
                draggable={!disabled}
                onDragStart={() => setPicked(item.id)}
                onClick={() => {
                  if (disabled) return;
                  playClickSound();
                  setPicked((prev) => (prev === item.id ? null : item.id));
                }}
                disabled={disabled}
                aria-pressed={picked === item.id}
                className={cn(
                  "min-h-11 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:cursor-not-allowed disabled:opacity-70",
                  picked === item.id
                    ? "border-primary bg-primary/15 text-foreground"
                    : isPlaced
                      ? "border-border bg-muted text-muted-foreground"
                      : "border-border bg-background text-foreground hover:bg-muted",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        {picked && (
          <p className="text-sm text-muted-foreground">
            {labelFor(picked)} is ready. Now tap the place it belongs.
          </p>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {slots.map((slot) => {
          const placed = placements[slot.id];
          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => place(slot.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                place(slot.id);
              }}
              disabled={disabled}
              aria-label={
                placed
                  ? `${slot.label}: holds ${labelFor(placed)}. Activate to take it out.`
                  : `${slot.label}: empty. Activate to place the chosen part.`
              }
              className={cn(
                "min-h-16 rounded-xl border-2 px-4 py-3 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-70",
                placed
                  ? "border-primary bg-primary/10"
                  : "border-dashed border-muted-foreground bg-background hover:bg-muted",
              )}
            >
              <span className="block text-sm text-muted-foreground">{slot.label}</span>
              <span className="block text-sm font-semibold text-foreground">
                {placed ? labelFor(placed) : "Empty"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
