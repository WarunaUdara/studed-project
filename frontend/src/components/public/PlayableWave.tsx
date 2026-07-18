import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, RotateCcw, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { Confetti } from "@/components/gamification/Confetti";
import { XPToast } from "@/components/gamification/XPToast";
import { Button } from "@/components/ui/button";
import { type PublicStringKey, usePublicI18n } from "@/lib/i18n";
import { playErrorSound, playSuccessSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

/**
 * PlayableWave — a real, playable wave embedded in the landing page. Visitors
 * read a Learn phase, answer an Evaluate question, and earn XP with confetti —
 * the full StudEd loop in twenty seconds, no account required.
 */

const OPTION_KEYS: PublicStringKey[] = ["playOptA", "playOptB", "playOptC", "playOptD"];
const CORRECT_IDX = 3; // "It quadruples"
const OPTION_LETTERS = ["A", "B", "C", "D"];
const XP_REWARD = 50;

export function PlayableWave() {
  const { t } = usePublicI18n();
  const reduce = useReducedMotion();

  const [done, setDone] = useState(false);
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [toast, setToast] = useState(false);
  const [confetti, setConfetti] = useState(false);

  const pick = (i: number) => {
    if (done) return;
    if (i === CORRECT_IDX) {
      setDone(true);
      playSuccessSound();
      setToast(true);
      if (!reduce) {
        setConfetti(true);
        setTimeout(() => setConfetti(false), 2400);
      }
      return;
    }
    setWrongIdx(i);
    setShowHint(true);
    playErrorSound();
    setTimeout(() => setWrongIdx(null), 500);
  };

  const replay = () => {
    setDone(false);
    setWrongIdx(null);
    setShowHint(false);
    setToast(false);
  };

  return (
    <div className="relative">
      <Confetti show={confetti} count={36} />
      <XPToast amount={XP_REWARD} show={toast} onDismiss={() => setToast(false)} />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15%" }}
        transition={{ duration: 0.55 }}
        className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border bg-card shadow-xl"
      >
        {/* Wave header: tag + segment progress + reward */}
        <div className="flex flex-wrap items-center gap-3 border-b bg-muted/30 px-5 py-3.5 sm:px-7">
          <span className="text-xs font-semibold text-muted-foreground">{t("playWaveTag")}</span>
          <div className="flex items-center gap-1" role="img" aria-label={t("playWaveTag")}>
            {[0, 1, 2, 3, 4, 5].map((seg) => (
              <span
                key={`seg-${seg}`}
                className={cn(
                  "h-1.5 w-6 rounded-full",
                  seg < 3 && "bg-success",
                  seg === 3 && "bg-primary",
                  seg > 3 && "bg-border",
                )}
              />
            ))}
          </div>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-xs font-bold text-foreground ring-1 ring-gold/30">
            <Zap className="h-3.5 w-3.5 fill-gold text-gold" />
            {XP_REWARD} XP
          </span>
        </div>

        <div className="grid lg:grid-cols-5">
          {/* Learn phase */}
          <div className="border-b bg-muted/20 p-6 sm:p-8 lg:col-span-2 lg:border-b-0 lg:border-r">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
              {t("playLearnLabel")}
            </p>
            <h3 className="mt-3 font-serif text-2xl leading-snug text-foreground">
              {t("playLearnTitle")}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t("playLearnCopy")}
            </p>

            {/* Circle scaling diagram */}
            <svg
              viewBox="0 0 260 170"
              className="mt-6 w-full max-w-[280px]"
              role="img"
              aria-label={t("playLearnTitle")}
            >
              {/* small circle */}
              <circle
                cx={58}
                cy={80}
                r={30}
                fill="var(--accent)"
                stroke="var(--primary)"
                strokeWidth={2}
              />
              <line
                x1={58}
                y1={80}
                x2={88}
                y2={80}
                stroke="var(--primary)"
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
              <text
                x={70}
                y={74}
                textAnchor="middle"
                className="fill-current font-mono text-[11px] text-primary"
              >
                r
              </text>
              <text
                x={58}
                y={135}
                textAnchor="middle"
                className="fill-current font-mono text-[11px] text-muted-foreground"
              >
                A = πr²
              </text>
              {/* arrow */}
              <line
                x1={102}
                y1={80}
                x2={128}
                y2={80}
                stroke="var(--muted-foreground)"
                strokeWidth={1.5}
              />
              <path d="M 128 80 l -6 -4 v 8 z" className="fill-current text-muted-foreground" />
              {/* big circle */}
              <circle
                cx={192}
                cy={80}
                r={52}
                fill="var(--accent)"
                stroke="var(--primary)"
                strokeWidth={2}
              />
              <line
                x1={192}
                y1={80}
                x2={244}
                y2={80}
                stroke="var(--primary)"
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
              <text
                x={214}
                y={74}
                textAnchor="middle"
                className="fill-current font-mono text-[11px] text-primary"
              >
                2r
              </text>
              <text
                x={192}
                y={152}
                textAnchor="middle"
                className="fill-current font-mono text-[11px] text-muted-foreground"
              >
                A = 4πr²
              </text>
            </svg>
          </div>

          {/* Evaluate phase */}
          <div className="p-6 sm:p-8 lg:col-span-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-purple">
              {t("playEvaluateLabel")}
            </p>
            <p className="mt-3 font-serif text-xl italic leading-snug text-foreground sm:text-2xl">
              {t("playQuestion")}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {OPTION_KEYS.map((key, i) => {
                const isCorrect = done && i === CORRECT_IDX;
                const isWrong = wrongIdx === i;
                return (
                  <motion.button
                    key={key}
                    type="button"
                    onClick={() => pick(i)}
                    disabled={done}
                    animate={isWrong ? { x: [0, -7, 7, -5, 5, 0] } : { x: 0 }}
                    transition={{ duration: 0.45 }}
                    className={cn(
                      "group flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-all",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      !done && "lift-on-hover hover:border-primary/40 hover:bg-accent/60",
                      isCorrect &&
                        "border-success bg-success/10 text-success shadow-md shadow-success/15 ring-2 ring-success/40",
                      isWrong && "border-destructive/60 bg-destructive/5 text-destructive",
                      done && !isCorrect && "opacity-50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors",
                        !done && "group-hover:border-primary/50 group-hover:text-primary",
                        isCorrect && "border-success bg-success text-success-foreground",
                      )}
                    >
                      {isCorrect ? (
                        <Check className="h-4 w-4" strokeWidth={3} />
                      ) : (
                        OPTION_LETTERS[i]
                      )}
                    </span>
                    {t(key)}
                  </motion.button>
                );
              })}
            </div>

            {/* Socratic AI hint after a wrong pick */}
            <AnimatePresence>
              {showHint && !done && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 flex items-start gap-2 rounded-xl bg-purple/8 px-4 py-3 text-sm text-purple"
                >
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    <span className="mr-1.5 text-[10px] font-bold uppercase tracking-wide">
                      {t("playHintLabel")}
                    </span>
                    <span className="font-serif italic">{t("playHint")}</span>
                  </span>
                </motion.p>
              )}
            </AnimatePresence>

            {/* Completion banner */}
            <AnimatePresence>
              {done && (
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="mt-6 rounded-2xl border border-success/30 bg-gradient-to-br from-success/12 via-card to-card p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground shadow-md shadow-success/30">
                      <Check className="h-5 w-5" strokeWidth={3} />
                    </span>
                    <div>
                      <p className="font-serif text-lg text-foreground">{t("playCorrectTitle")}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {t("playCorrectCopy")}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link to="/register">
                          <Button size="sm" className="gap-2 rounded-full">
                            <Zap className="h-4 w-4" />
                            {t("playCta")}
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-2 rounded-full"
                          onClick={replay}
                        >
                          <RotateCcw className="h-4 w-4" />
                          {t("playReplay")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
