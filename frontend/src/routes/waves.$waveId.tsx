import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle, Clock, Lock, RotateCcw, Trophy, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "urql";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { QuizBlock } from "@/components/evaluate/QuizBlock";
import { Confetti } from "@/components/gamification/Confetti";
import { ProficiencyBadge } from "@/components/gamification/ProficiencyBadge";
import { XPBar } from "@/components/gamification/XPBar";
import { XPToast } from "@/components/gamification/XPToast";
import { LearnBlockRenderer } from "@/components/learn/LearnBlockRenderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PointsBadge } from "@/components/ui/points-badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { SUBMIT_WAVE_ANSWERS_MUTATION, WAVE_PLAYER_QUERY } from "@/graphql/student";
import { sanitizeGraphQLError } from "@/lib/errors";
import { computeProficiency } from "@/lib/gamification";
import { playErrorSound, playSuccessSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

interface LearnBlock {
  id: string;
  type: string;
  content: string;
  metadata?: string | null;
}

interface EvaluateBlock {
  id: string;
  type: string;
  question: string;
  options?: string[] | null;
  correctAnswer?: string | null;
  explanation?: string | null;
  metadata?: string | null;
}

interface WaveResult {
  score: number;
  xpEarned: number;
  totalXp: number;
  passed: boolean;
  remainingAttempts: number;
  feedback: {
    evaluateBlockId: string;
    correct: boolean;
    correctAnswer?: string | null;
    explanation?: string | null;
  }[];
}

export const Route = createFileRoute("/waves/$waveId")({
  component: WavePlayerPage,
});

function WavePlayerPage() {
  const { waveId } = Route.useParams();
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: WAVE_PLAYER_QUERY,
    variables: { id: waveId },
  });
  const [submitResult, submitAnswers] = useMutation(SUBMIT_WAVE_ANSWERS_MUTATION);
  const { user, updateTotalXp } = useAuthStore();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<WaveResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"learn" | "evaluate">("learn");
  const [learnViewed, setLearnViewed] = useState(false);
  const [showXpToast, setShowXpToast] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const wave = data?.wave;

  const learnBlocks: LearnBlock[] = useMemo(() => wave?.learnBlocks ?? [], [wave]);
  const evaluateBlocks: EvaluateBlock[] = useMemo(() => wave?.evaluateBlocks ?? [], [wave]);

  const hasLearn = learnBlocks.length > 0;
  const evaluateLocked = hasLearn && !learnViewed;

  useEffect(() => {
    if (!hasLearn) setLearnViewed(true);
  }, [hasLearn]);

  const handleAnswerChange = (blockId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [blockId]: answer }));
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    const answersInput = evaluateBlocks.map((block) => ({
      evaluateBlockId: block.id,
      answer: answers[block.id] ?? "",
    }));

    const res = await submitAnswers({ waveId, answers: answersInput });
    if (res.error) {
      setSubmitError(res.error.message);
      return;
    }
    
    if (res.data?.submitWaveAnswers) {
      const r = res.data.submitWaveAnswers as WaveResult;
      setResult(r);
      updateTotalXp(r.totalXp);
      if (r.passed && r.xpEarned > 0) {
        setShowXpToast(true);
        setShowConfetti(true);
        playSuccessSound();
        window.setTimeout(() => setShowConfetti(false), 3200);
      } else if (!r.passed) {
        playErrorSound();
      }
    }
    reexecuteQuery({ requestPolicy: "network-only" });
  };

  const handleTryAgain = () => {
    setAnswers({});
    setResult(null);
  };

  if (fetching) {
    return (
      <ProtectedRoute>
        <main className="mx-auto max-w-4xl space-y-4 p-4 pt-6 sm:p-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-64 w-full" />
        </main>
      </ProtectedRoute>
    );
  }

  if (error || !wave) {
    const err = error
      ? sanitizeGraphQLError(error)
      : {
          title: "Wave Not Found",
          message: "This wave could not be found or you do not have permission to view it.",
        };
    return (
      <ProtectedRoute>
        <main className="mx-auto max-w-xl p-6 pt-16 text-center space-y-6">
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 space-y-2">
            <h2 className="text-lg font-semibold text-destructive">{err.title}</h2>
            <p className="text-sm text-muted-foreground">{err.message}</p>
          </div>
          <Link to="/dashboard">
            <Button variant="outline">Back to dashboard</Button>
          </Link>
        </main>
      </ProtectedRoute>
    );
  }

  const isLocked = wave.myProgress?.status === "LOCKED";
  if (isLocked) {
    return (
      <ProtectedRoute>
        <main className="mx-auto max-w-xl p-6 pt-16 text-center space-y-6">
          <div className="rounded-2xl border border-muted bg-muted/5 p-8 flex flex-col items-center justify-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Lock className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-foreground">Wave is Locked</h2>
              <p className="text-sm text-muted-foreground">
                You must complete the preceding waves in this lesson before you can unlock and play
                this wave.
              </p>
            </div>
          </div>
          <Link to="/courses/$courseId" params={{ courseId: wave.lesson?.course?.id ?? "" }}>
            <Button variant="outline">Back to course</Button>
          </Link>
        </main>
      </ProtectedRoute>
    );
  }

  const isCompleted = wave.myProgress?.status === "COMPLETED";
  const attemptsCount = wave.myProgress?.attemptsCount ?? 0;
  const maxAttempts = wave.maxReattempts > 0 ? wave.maxReattempts : null;
  const canReattempt = result ? !result.passed && result.remainingAttempts > 0 : false;
  const justEarnedXp = result?.passed && result.xpEarned > 0;
  const proficiency = computeProficiency(
    isCompleted ? [{ status: "COMPLETED", highestScore: wave.myProgress?.highestScore }] : [],
  );

  return (
    <ProtectedRoute>
      <Confetti show={showConfetti} />
      <XPToast
        amount={result?.xpEarned ?? 0}
        show={showXpToast}
        onDismiss={() => setShowXpToast(false)}
      />

      <div className="mx-auto max-w-4xl space-y-5 p-4 pt-6 sm:p-6 sm:pt-8">
        {/* Header bar */}
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/courses/$courseId"
            params={{ courseId: wave.lesson?.course?.id ?? "" }}
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> {wave.lesson?.course?.title ?? "Course"}
          </Link>
          <div className="hidden w-48 sm:block">
            <XPBar totalXp={user?.totalXp ?? 0} compact />
          </div>
        </div>

        {/* Title block */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {isCompleted && <ProficiencyBadge level={proficiency} size="sm" />}
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Clock className="h-3 w-3" /> Wave {wave.sequenceOrder}
            </span>
            <PointsBadge
              name="XP Reward"
              total={wave.xpReward}
              size="sm"
              icon={Zap}
              className="border-0 p-0"
            />
            {maxAttempts !== null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                Attempts {Math.min(attemptsCount + (result ? 1 : 0), maxAttempts)}/{maxAttempts}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{wave.title}</h1>
          <p className="text-sm text-muted-foreground">
            {wave.lesson?.title} · {wave.difficulty} · Pass: {wave.passingThreshold}%
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "learn" | "evaluate")}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="learn" className="flex-1 sm:flex-none">
              Learn
            </TabsTrigger>
            <TabsTrigger value="evaluate" disabled={evaluateLocked} className="flex-1 sm:flex-none">
              {evaluateLocked ? (
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="h-3 w-3" /> Evaluate
                </span>
              ) : (
                "Evaluate"
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="learn" className="mt-5 space-y-6">
            {learnBlocks.length === 0 ? (
              <p className="text-muted-foreground">No learning content yet.</p>
            ) : (
              learnBlocks.map((block) => <LearnBlockRenderer key={block.id} block={block} />)
            )}
            <Button
              onClick={() => {
                setLearnViewed(true);
                setActiveTab("evaluate");
              }}
              className="w-full"
              size="lg"
            >
              Start Evaluation
            </Button>
          </TabsContent>

          <TabsContent value="evaluate" className="mt-5 space-y-6">
            {evaluateBlocks.length === 0 ? (
              <p className="text-muted-foreground">No evaluation questions yet.</p>
            ) : (
              <>
                {evaluateBlocks.map((block, index) => (
                  <QuizBlock
                    key={block.id}
                    block={block}
                    index={index}
                    answer={answers[block.id] ?? ""}
                    onAnswerChange={(answer) => handleAnswerChange(block.id, answer)}
                    feedback={
                      result
                        ? {
                            correct:
                              result.feedback.find((f) => f.evaluateBlockId === block.id)
                                ?.correct ?? false,
                            correctAnswer: result.feedback.find(
                              (f) => f.evaluateBlockId === block.id,
                            )?.correctAnswer,
                            explanation: result.feedback.find((f) => f.evaluateBlockId === block.id)
                              ?.explanation,
                          }
                        : null
                    }
                  />
                ))}

                {result && (
                  <div className="space-y-4">
                    <ResultCard
                      passed={result.passed}
                      score={result.score}
                      xpEarned={result.xpEarned}
                      totalXp={result.totalXp}
                      passingThreshold={wave.passingThreshold}
                      remainingAttempts={result.remainingAttempts}
                      justEarnedXp={!!justEarnedXp}
                      canReattempt={canReattempt}
                      onTryAgain={handleTryAgain}
                    />
                    {result.passed && (
                      <Link
                        to="/courses/$courseId"
                        params={{ courseId: wave.lesson?.course?.id ?? "" }}
                        className="block w-full"
                      >
                        <Button className="w-full" size="lg">
                          Back to Course
                        </Button>
                      </Link>
                    )}
                  </div>
                )}

                {!result && (
                  <>
                    {submitError && <p className="text-sm text-destructive">{submitError}</p>}
                    <Button
                      onClick={handleSubmit}
                      disabled={submitResult.fetching || evaluateBlocks.length === 0 || result?.passed || result?.remainingAttempts === 0}
                      className="w-full"
                      size="lg"
                    >
                      {submitResult.fetching ? "Submitting..." : "Submit Answers"}
                    </Button>
                  </>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}

interface ResultCardProps {
  passed: boolean;
  score: number;
  xpEarned: number;
  totalXp: number;
  passingThreshold: number;
  remainingAttempts: number;
  justEarnedXp: boolean;
  canReattempt: boolean;
  onTryAgain: () => void;
}

function ResultCard({
  passed,
  score,
  xpEarned,
  totalXp,
  passingThreshold,
  remainingAttempts,
  justEarnedXp,
  canReattempt,
  onTryAgain,
}: ResultCardProps) {
  return (
    <Card
      className={
        passed ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5"
      }
    >
      <CardHeader>
        <CardTitle
          className={cn("flex items-center gap-2", passed ? "text-success" : "text-destructive")}
        >
          {passed ? (
            <>
              <CheckCircle className="h-5 w-5" /> Wave Completed!
            </>
          ) : (
            <>
              <RotateCcw className="h-5 w-5" /> Not quite — try again
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-3xl font-extrabold tabular-nums">{score}%</p>

        {passed && (
          <div className="flex items-center gap-2 rounded-lg bg-gold/10 px-3 py-2">
            <Trophy className="h-5 w-5 text-gold" />
            <p className="text-sm font-semibold text-gold">
              {justEarnedXp ? `+${xpEarned} XP earned!` : "Already completed — no additional XP."}
            </p>
          </div>
        )}

        {!passed && (
          <p className="text-sm text-destructive">
            You need {passingThreshold}% to pass. Remaining attempts: {remainingAttempts}
          </p>
        )}

        <p className="text-xs text-muted-foreground">Total XP: {totalXp.toLocaleString()}</p>

        {canReattempt && (
          <Button onClick={onTryAgain} variant="outline" className="w-full">
            <RotateCcw className="mr-1 h-4 w-4" /> Try Again
          </Button>
        )}
        {!passed && remainingAttempts === 0 && (
          <p className="rounded-lg bg-muted px-3 py-2 text-center text-sm text-muted-foreground">
            No reattempts remaining. This wave is now review-only.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
