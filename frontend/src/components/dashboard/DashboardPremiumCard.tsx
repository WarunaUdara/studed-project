import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardPremiumCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-b from-blue-500/5 via-purple-500/5 to-pink-500/5 p-5 shadow-sm backdrop-blur-sm transition-all hover:border-border">
      <div className="flex items-center gap-3">
        {/* Multi-faceted crystal icon */}
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-sm text-white">
          <Sparkles className="size-5" />
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-foreground">
            Unlock all learning with Premium
          </h4>
          <p className="text-[11px] text-muted-foreground">to get smarter, faster</p>
        </div>
      </div>

      <div className="mt-4">
        <Link to="/subscription" className="w-full block">
          <Button className="w-full rounded-full font-bold text-xs bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-400 hover:opacity-95 text-white shadow-sm">
            Explore Premium
          </Button>
        </Link>
      </div>
    </div>
  );
}
