import { Film, Pause, Play, RotateCcw, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MathFormula } from "@/components/ui/MathFormula";

interface ManimBlockProps {
  content: string;
  metadata?: string | null;
}

interface ManimMetadata {
  title?: string;
  videoUrl?: string;
  formula?: string;
  steps?: string[];
  fps?: number;
}

export function ManimBlock({ content, metadata }: ManimBlockProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  let meta: ManimMetadata = {};
  try {
    if (metadata) {
      meta = JSON.parse(metadata);
    }
  } catch {
    // Fallback if metadata is non-JSON
  }

  const steps = meta.steps ?? [
    content || "a^2 + b^2 = c^2",
    "\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}",
    "E = mc^2",
  ];

  const videoUrl = meta.videoUrl ?? (content.startsWith("http") ? content : null);
  const title = meta.title ?? "Math-To-Manim Mathematical Animation";

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Film className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            <p className="text-[11px] text-muted-foreground">Powered by Math-To-Manim Engine</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-purple/10 px-2.5 py-0.5 text-[10px] font-bold text-purple uppercase tracking-wider">
          <Sparkles className="h-3 w-3" /> Manim AI
        </span>
      </div>

      {videoUrl ? (
        <div className="relative overflow-hidden rounded-xl bg-black/90 aspect-video flex items-center justify-center border">
          <video
            src={videoUrl}
            controls
            className="h-full w-full object-contain"
            poster="/manim-poster.png"
          >
            <track kind="captions" />
            Your browser does not support the video tag.
          </video>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 p-6 text-white text-center flex flex-col items-center justify-center min-h-[220px]">
          {/* Animated formula display */}
          <div className="my-4 text-xl sm:text-2xl transition-all duration-300 font-serif">
            <MathFormula formula={steps[currentStep] || content} />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 mr-1.5" />
              ) : (
                <Play className="h-4 w-4 mr-1.5" />
              )}
              {isPlaying ? "Pause Step" : "Play Animation"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white/80 hover:text-white hover:bg-white/10"
              onClick={() => {
                setCurrentStep((prev) => (prev + 1) % steps.length);
              }}
            >
              Next Step ({currentStep + 1}/{steps.length})
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8"
              onClick={() => {
                setCurrentStep(0);
                setIsPlaying(false);
              }}
              title="Reset Animation"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {meta.formula && (
        <div className="rounded-lg bg-muted/40 p-3 text-center text-xs font-mono text-muted-foreground border">
          Formula: {meta.formula}
        </div>
      )}
    </div>
  );
}
