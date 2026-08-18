import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardAITutorNudge() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card/80 p-4 shadow-sm backdrop-blur-sm transition-all hover:border-primary/40 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-primary">
          <Sparkles className="size-3.5 text-primary" />
          <span>AI Tutor Nudge</span>
        </div>
        <p className="text-xs sm:text-sm font-medium text-foreground">
          You stumbled on quadratic factorization twice this week. Want a 5-minute refresher?
        </p>
      </div>
      <div className="shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full border-primary/30 text-primary hover:bg-primary/10 text-xs font-bold"
        >
          Review with AI
        </Button>
      </div>
    </div>
  );
}
