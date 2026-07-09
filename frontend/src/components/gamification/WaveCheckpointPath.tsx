import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle, Clock, Lock, PlayCircle } from "lucide-react";
import { ProficiencyBadge } from "@/components/gamification/ProficiencyBadge";
import { type ProficiencyLevel, proficiencyMeta } from "@/lib/gamification";
import { playClickSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export type WaveCheckpointStatus = "LOCKED" | "AVAILABLE" | "STARTED" | "COMPLETED";

export interface WaveCheckpoint {
  id: string;
  title: string;
  sequenceOrder: number;
  status: WaveCheckpointStatus;
  xpReward?: number;
  highestScore?: number | null;
  wavePath?: string;
}

export interface WaveCheckpointPathProps {
  waves: WaveCheckpoint[];
  currentWaveId?: string;
  /** Optional proficiency computed for this lesson, shown above the path. */
  proficiency?: ProficiencyLevel;
}

const STATUS_STYLE: Record<WaveCheckpointStatus, { ring: string; bg: string; text: string }> = {
  LOCKED: { ring: "border-border", bg: "bg-muted/40", text: "text-muted-foreground" },
  AVAILABLE: { ring: "border-primary/40", bg: "bg-primary/10", text: "text-primary" },
  STARTED: { ring: "border-orange/50", bg: "bg-orange/15", text: "text-orange" },
  COMPLETED: { ring: "border-success/50", bg: "bg-success/15", text: "text-success" },
};

function StatusIcon({ status, className }: { status: WaveCheckpointStatus; className?: string }) {
  if (status === "COMPLETED") return <CheckCircle className={cn("h-4 w-4", className)} />;
  if (status === "STARTED") return <Clock className={cn("h-4 w-4", className)} />;
  if (status === "AVAILABLE") return <PlayCircle className={cn("h-4 w-4", className)} />;
  return <Lock className={cn("h-4 w-4", className)} />;
}

/**
 * WaveCheckpointPath — a visual path of waves (per 04-Student-Portal & 06-UI-UX
 * spec). Each node shows its state, with an unlock-glow bounce on the
 * next-available wave.
 */
export function WaveCheckpointPath({ waves, currentWaveId, proficiency }: WaveCheckpointPathProps) {
  if (waves.length === 0) {
    return <p className="text-sm text-muted-foreground">No waves in this lesson yet.</p>;
  }

  return (
    <div className="space-y-3">
      {proficiency && proficiency !== "NOT_STARTED" && (
        <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
          <span className="text-xs text-muted-foreground">Lesson proficiency</span>
          <ProficiencyBadge level={proficiency} size="sm" />
        </div>
      )}

      <ol className="relative space-y-2">
        {waves.map((wave, i) => {
          const style = STATUS_STYLE[wave.status];
          const isNext = wave.status === "AVAILABLE";
          const isCurrent = wave.id === currentWaveId;
          const isLocked = wave.status === "LOCKED";
          const connectorCls = i === waves.length - 1 ? "hidden" : "block";

          return (
            <li key={wave.id} className="relative pl-9">
              {/* Vertical connector */}
              <span
                className={cn(
                  connectorCls,
                  "absolute left-[14px] top-7 h-[calc(100%-1.5rem)] w-px",
                  isLocked ? "bg-border" : "bg-primary/30",
                )}
                aria-hidden
              />
              {/* Node */}
              <span
                className={cn(
                  "absolute left-0 top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 bg-card",
                  style.ring,
                  style.text,
                )}
              >
                <StatusIcon status={wave.status} className="h-3.5 w-3.5" />
              </span>

              {/* Card */}
              {isLocked ? (
                <div
                  className={cn(
                    "flex items-center justify-between rounded-xl border bg-muted/30 px-3 py-2.5 opacity-70",
                    style.ring,
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">Wave {wave.sequenceOrder}</p>
                    <p className="truncate text-xs text-muted-foreground">Locked</p>
                  </div>
                </div>
              ) : (
                <Link
                  to="/waves/$waveId"
                  params={{ waveId: wave.id }}
                  onClick={() => playClickSound()}
                  className={cn(
                    "group relative flex items-center justify-between rounded-xl border bg-card px-3 py-2.5 transition-all lift-on-hover hover:shadow-md",
                    style.ring,
                    isCurrent && "ring-2 ring-primary",
                  )}
                >
                  {isNext && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="pointer-events-none absolute -left-0.5 top-0 h-[calc(100%+0.25rem)] w-1 rounded-full bg-primary"
                      aria-hidden
                    />
                  )}
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "truncate text-sm font-medium",
                        wave.status === "COMPLETED"
                          ? "text-success"
                          : wave.status === "STARTED"
                            ? "text-orange"
                            : "group-hover:text-primary",
                      )}
                    >
                      {wave.title || `Wave ${wave.sequenceOrder}`}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Wave {wave.sequenceOrder}
                      {typeof wave.xpReward === "number" && wave.xpReward > 0 && (
                        <> · {wave.xpReward} XP</>
                      )}
                      {typeof wave.highestScore === "number" && wave.highestScore !== null && (
                        <> · Best {wave.highestScore}%</>
                      )}
                      {isNext && (
                        <span className="ml-1 font-semibold text-primary">Start here</span>
                      )}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold",
                      wave.status === "COMPLETED"
                        ? "bg-success/10 text-success"
                        : wave.status === "STARTED"
                          ? "bg-orange/10 text-orange"
                          : "bg-primary/10 text-primary",
                    )}
                  >
                    {wave.status === "COMPLETED"
                      ? "Done"
                      : wave.status === "STARTED"
                        ? "Resume"
                        : "Start"}
                  </span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      <p className="px-1 text-xs text-muted-foreground">
        {waves.filter((w) => w.status === "COMPLETED").length}/{waves.length} waves complete ·{" "}
        proficiency {proficiencyMeta(proficiency ?? "NOT_STARTED").glyph}{" "}
        {proficiencyMeta(proficiency ?? "NOT_STARTED").label}
      </p>
    </div>
  );
}
