import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "urql";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { QuizBlock } from "@/components/evaluate/QuizBlock";
import { LearnBlockRenderer } from "@/components/learn/LearnBlockRenderer";
import { SUBMIT_WAVE_ANSWERS_MUTATION, WAVE_PLAYER_QUERY } from "@/graphql/student";

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

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<WaveResult | null>(null);
  const [activeTab, setActiveTab] = useState<"learn" | "evaluate">("learn");

  const wave = data?.wave;

  const learnBlocks: LearnBlock[] = useMemo(() => wave?.learnBlocks ?? [], [wave]);
  const evaluateBlocks: EvaluateBlock[] = useMemo(() => wave?.evaluateBlocks ?? [], [wave]);

  const handleAnswerChange = (blockId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [blockId]: answer }));
  };

  const handleSubmit = async () => {
    const answersInput = evaluateBlocks.map((block) => ({
      evaluateBlockId: block.id,
      answer: answers[block.id] ?? "",
    }));

    const res = await submitAnswers({ waveId, answers: answersInput });
    if (res.data?.submitWaveAnswers) {
      setResult(res.data.submitWaveAnswers as WaveResult);
    }
    reexecuteQuery({ requestPolicy: "network-only" });
  };

  if (fetching) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-background p-6">
          <p className="text-muted-foreground">Loading wave...</p>
        </main>
      </ProtectedRoute>
    );
  }

  if (error || !wave) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-background p-6">
          <p className="text-destructive">Failed to load wave.</p>
          <Link to="/dashboard">
            <Button variant="outline" className="mt-4">
              Back to dashboard
            </Button>
          </Link>
        </main>
      </ProtectedRoute>
    );
  }

  const isCompleted = wave.myProgress?.status === "COMPLETED";

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <header className="border-b">
          <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
            <Link
              to="/courses/$courseId"
              params={{ courseId: wave.lesson?.course?.id ?? "" }}
              className="text-sm font-medium hover:text-primary"
            >
              <ArrowLeft className="inline h-4 w-4" /> Back to {wave.lesson?.course?.title ?? "Course"}
            </Link>
            <div className="flex items-center gap-3">
              {isCompleted && <CheckCircle className="h-5 w-5 text-green-600" />}
              <span className="text-sm text-muted-foreground">
                <Zap className="inline h-4 w-4" /> {wave.xpReward} XP
              </span>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-4xl py-8">
          <div className="mb-6 space-y-2">
            <h1 className="text-2xl font-bold">{wave.title}</h1>
            <p className="text-sm text-muted-foreground">
              {wave.lesson?.title} · {wave.difficulty} · Passing: {wave.passingThreshold}%
            </p>
          </div>

          <div className="mb-6 flex gap-2 border-b">
            <button
              type="button"
              onClick={() => setActiveTab("learn")}
              className={`border-b-2 px-4 py-2 text-sm font-medium ${
                activeTab === "learn"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Learn
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("evaluate")}
              className={`border-b-2 px-4 py-2 text-sm font-medium ${
                activeTab === "evaluate"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Evaluate
            </button>
          </div>

          {activeTab === "learn" && (
            <div className="space-y-6">
              {learnBlocks.length === 0 ? (
                <p className="text-muted-foreground">No learning content yet.</p>
              ) : (
                learnBlocks.map((block) => (
                  <LearnBlockRenderer key={block.id} block={block} />
                ))
              )}
              <Button onClick={() => setActiveTab("evaluate")} className="w-full">
                Start Evaluation
              </Button>
            </div>
          )}

          {activeTab === "evaluate" && (
            <div className="space-y-6">
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
                                result.feedback.find((f) => f.evaluateBlockId === block.id)?.correct ??
                                false,
                              correctAnswer: result.feedback.find(
                                (f) => f.evaluateBlockId === block.id,
                              )?.correctAnswer,
                              explanation: result.feedback.find(
                                (f) => f.evaluateBlockId === block.id,
                              )?.explanation,
                            }
                          : null
                      }
                    />
                  ))}

                  {result && (
                    <Card className={result.passed ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                      <CardHeader>
                        <CardTitle className={result.passed ? "text-green-800" : "text-red-800"}>
                          {result.passed ? "Wave Completed!" : "Try Again"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-lg font-medium">
                          Score: {result.score}%
                        </p>
                        {result.passed && (
                          <p className="text-green-700">
                            +{result.xpEarned} XP earned! Total XP: {result.totalXp}
                          </p>
                        )}
                        {!result.passed && (
                          <p className="text-red-700">
                            You need {wave.passingThreshold}% to pass. Remaining attempts: {result.remainingAttempts}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <Button
                    onClick={handleSubmit}
                    disabled={submitResult.fetching || evaluateBlocks.length === 0}
                    className="w-full"
                  >
                    {submitResult.fetching ? "Submitting..." : "Submit Answers"}
                  </Button>
                </>
              )}
            </div>
          )}
        </section>
      </main>
    </ProtectedRoute>
  );
}
