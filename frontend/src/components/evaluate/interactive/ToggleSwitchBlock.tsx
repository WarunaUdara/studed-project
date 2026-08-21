import type { ToggleSwitchConfig } from "@/lib/content/interactiveBlocks";
import {
  decodeSwitchAnswer,
  encodeSwitchAnswer,
  parseBlockConfig,
} from "@/lib/content/interactiveBlocks";
import { playClickSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import type { InteractiveEvaluateProps } from "./types";

/** Flip the switches into the right position. */
export function ToggleSwitchBlock({
  block,
  answer,
  onAnswerChange,
  disabled,
}: InteractiveEvaluateProps) {
  const config = parseBlockConfig<ToggleSwitchConfig>(block.metadata);
  const switches = config?.switches ?? [];
  const stored = decodeSwitchAnswer(answer);

  // Every switch is always part of the answer, so an untouched switch reads as
  // a deliberate "off" instead of a missing value.
  const states: Record<string, boolean> = {};
  for (const item of switches) states[item.id] = stored[item.id] ?? false;

  const flip = (switchId: string) => {
    if (disabled) return;
    playClickSound();
    onAnswerChange(encodeSwitchAnswer({ ...states, [switchId]: !states[switchId] }));
  };

  return (
    <div className="space-y-2">
      {switches.map((item) => {
        const on = states[item.id];
        return (
          <button
            key={item.id}
            type="button"
            role="switch"
            aria-checked={on}
            onClick={() => flip(item.id)}
            disabled={disabled}
            className={cn(
              "flex min-h-14 w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-70",
              on ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-muted",
            )}
          >
            <span className="text-sm font-medium text-foreground">{item.label}</span>
            <span
              className={cn(
                "flex h-8 w-16 shrink-0 items-center rounded-xl border px-1 text-xs font-semibold",
                on
                  ? "justify-end border-primary text-primary"
                  : "justify-start border-border text-muted-foreground",
              )}
            >
              <span className="rounded-lg bg-current px-2 py-1 text-transparent">on</span>
            </span>
          </button>
        );
      })}
      <p className="text-sm text-muted-foreground">
        {switches
          .map(
            (item) =>
              `${item.label}: ${states[item.id] ? (item.onLabel ?? "on") : (item.offLabel ?? "off")}`,
          )
          .join(" · ")}
      </p>
    </div>
  );
}
