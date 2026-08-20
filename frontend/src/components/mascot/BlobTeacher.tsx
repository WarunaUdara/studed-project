import { useGSAP } from "@gsap/react";
import { JellyBlobMascot, type JellyBlobMood } from "feral-blob";
import { gsap } from "gsap";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef, useState } from "react";
import "feral-blob/blob.css";
import type { BlobDialogLine } from "@/lib/content/interactiveBlocks";
import { useReducedMotion } from "@/lib/motion";
import { playClickSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface BlobTeacherProps {
  lines: BlobDialogLine[];
  className?: string;
}

/** Content moods stay child-readable; the mascot library's names stay internal. */
const MOOD_MAP: Record<NonNullable<BlobDialogLine["mood"]>, JellyBlobMood> = {
  happy: "happy",
  thinking: "hmm",
  cheer: "happy",
  surprised: "neutral",
};

/**
 * The speakable script for a dialog, in order.
 *
 * Text-to-speech is not wired up yet, but every line already has one stable,
 * markup-free string, so switching it on later is a matter of feeding this
 * array to a speech engine rather than rewriting content.
 */
export function dialogSpeechScript(lines: BlobDialogLine[]): string[] {
  return lines.map((line) => line.text.trim()).filter(Boolean);
}

/**
 * The blob teacher: a mascot with a dialog box a Grade 4 child can move through
 * at their own pace. One idea per line, one button to go on.
 */
export function BlobTeacher({ lines, className }: BlobTeacherProps) {
  const [index, setIndex] = useState(0);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const safeLines = lines.length > 0 ? lines : [{ id: "empty", text: "Let us begin." }];
  const line = safeLines[Math.min(index, safeLines.length - 1)];
  const isLast = index >= safeLines.length - 1;

  useGSAP(
    () => {
      if (reducedMotion || !bubbleRef.current) return;
      gsap.fromTo(
        bubbleRef.current,
        { opacity: 0, y: 8, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.32, ease: "back.out(1.6)" },
      );
    },
    { dependencies: [index, reducedMotion] },
  );

  const go = (delta: number) => {
    playClickSound();
    setIndex((prev) => Math.min(Math.max(prev + delta, 0), safeLines.length - 1));
  };

  return (
    <div className={cn("flex items-end gap-3 sm:gap-4", className)}>
      <div className="w-20 shrink-0 sm:w-24">
        <JellyBlobMascot
          mood={MOOD_MAP[line.mood ?? "happy"]}
          happyEyes={line.mood === "cheer" ? "star" : "smile"}
        />
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div
          ref={bubbleRef}
          className="rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm"
        >
          {/* data-tts-text is the stable handle a speech engine reads. */}
          <p data-tts-text={line.text} className="text-base leading-relaxed text-foreground">
            {line.text}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={index === 0}
            aria-label="Previous thing the teacher said"
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl border transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => go(1)}
            disabled={isLast}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary bg-primary/10 px-4 py-2.5",
              "text-sm font-semibold text-foreground transition-colors hover:bg-primary/20",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            {line.cta ?? "Got it"}
            <ArrowRight className="h-4 w-4" />
          </button>

          <span className="text-sm text-muted-foreground">
            {index + 1} of {safeLines.length}
          </span>
        </div>
      </div>
    </div>
  );
}
