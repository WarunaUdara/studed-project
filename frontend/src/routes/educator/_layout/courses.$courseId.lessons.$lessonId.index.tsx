import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Layers, Loader2, Plus, Send, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "urql";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { CREATE_WAVE_MUTATION, LESSON_QUERY, PUBLISH_WAVE_MUTATION } from "@/graphql/courses";
import { sanitizeGraphQLError } from "@/lib/errors";

interface Wave {
  id: string;
  title: string;
  sequenceOrder: number;
  xpReward: number;
  maxReattempts: number;
  passingThreshold: number;
  estimatedDuration: number;
  difficulty: string;
  isPublished: boolean;
}

interface Lesson {
  id: string;
  title: string;
  sequenceOrder: number;
  isPublished: boolean;
  waves: Wave[];
}

const difficulties: SelectOption[] = [
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
];

export const Route = createFileRoute("/educator/_layout/courses/$courseId/lessons/$lessonId/")({
  component: LessonDetailPage,
});

function LessonDetailPage() {
  const { courseId, lessonId } = Route.useParams();
  const { toast } = useToast();
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: LESSON_QUERY,
    variables: { id: lessonId },
  });
  const [createResult, createWave] = useMutation(CREATE_WAVE_MUTATION);
  const [publishWaveResult, publishWave] = useMutation(PUBLISH_WAVE_MUTATION);
  const [publishingWaveId, setPublishingWaveId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [sequenceOrder, setSequenceOrder] = useState("1");
  const [xpReward, setXpReward] = useState("10");
  const [maxReattempts, setMaxReattempts] = useState("3");
  const [passingThreshold, setPassingThreshold] = useState("50");
  const [estimatedDuration, setEstimatedDuration] = useState("5");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [formError, setFormError] = useState<string | null>(null);

  const lesson: Lesson | undefined = data?.lesson;
  const waves = useMemo(() => lesson?.waves ?? [], [lesson]);

  const handlePublishWave = async (id: string) => {
    setPublishingWaveId(id);
    const result = await publishWave({ id });
    setPublishingWaveId(null);
    if (result.error) {
      const e = sanitizeGraphQLError(result.error);
      toast({ type: "error", title: e.title, message: e.message });
    } else {
      toast({ type: "success", title: "Published", message: "Wave is now visible to students." });
      reexecuteQuery({ requestPolicy: "network-only" });
    }
  };

  const handleCreateWave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const result = await createWave({
      lessonId,
      input: {
        title,
        sequenceOrder: parseInt(sequenceOrder, 10) || 1,
        xpReward: parseInt(xpReward, 10) || 0,
        maxReattempts: parseInt(maxReattempts, 10) || 3,
        passingThreshold: parseInt(passingThreshold, 10) || 50,
        estimatedDuration: parseInt(estimatedDuration, 10) || 0,
        difficulty,
      },
    });

    if (result.error) {
      setFormError(result.error.message);
      return;
    }

    setTitle("");
    setSequenceOrder(String((waves.length || 0) + 2));
    setXpReward("10");
    setMaxReattempts("3");
    setPassingThreshold("50");
    setEstimatedDuration("5");
    setDifficulty("MEDIUM");
    setShowForm(false);
    reexecuteQuery({ requestPolicy: "network-only" });
  };

  if (fetching) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">Failed to load lesson.</p>
        <Link to="/educator/courses/$courseId" params={{ courseId }}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to course
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/educator/courses/$courseId" params={{ courseId }}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <h2 className="text-2xl font-bold">{lesson.title}</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lesson Details</CardTitle>
            <span className={lesson.isPublished ? "text-green-600" : "text-amber-600"}>
              {lesson.isPublished ? "Published" : "Draft"}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Sequence order: {lesson.sequenceOrder}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Waves
            </CardTitle>
            <Button size="sm" onClick={() => setShowForm(true)} disabled={showForm}>
              <Plus className="mr-1 h-4 w-4" />
              Add Wave
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showForm && (
            <form onSubmit={handleCreateWave} className="space-y-3 rounded-lg border p-4">
              <div className="space-y-2">
                <Label htmlFor="wave-title">Wave Title</Label>
                <Input
                  id="wave-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Linear Equations"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="wave-order">Order</Label>
                  <Input
                    id="wave-order"
                    type="number"
                    min={1}
                    value={sequenceOrder}
                    onChange={(e) => setSequenceOrder(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wave-xp">XP Reward</Label>
                  <Input
                    id="wave-xp"
                    type="number"
                    min={0}
                    value={xpReward}
                    onChange={(e) => setXpReward(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="wave-reattempts">Max Reattempts</Label>
                  <Input
                    id="wave-reattempts"
                    type="number"
                    min={1}
                    value={maxReattempts}
                    onChange={(e) => setMaxReattempts(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wave-threshold">Passing Threshold (%)</Label>
                  <Input
                    id="wave-threshold"
                    type="number"
                    min={0}
                    max={100}
                    value={passingThreshold}
                    onChange={(e) => setPassingThreshold(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="wave-duration">Duration (min)</Label>
                  <Input
                    id="wave-duration"
                    type="number"
                    min={0}
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wave-difficulty">Difficulty</Label>
                  <Select
                    id="wave-difficulty"
                    options={difficulties}
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  />
                </div>
              </div>
              {formError && <p className="text-sm text-destructive">{formError}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={createResult.fetching || !title.trim()}>
                  {createResult.fetching ? "Creating..." : "Create Wave"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {waves.length === 0 ? (
            <p className="text-muted-foreground">No waves yet. Add the first wave.</p>
          ) : (
            <div className="space-y-2">
              {waves.map((wave) => (
                <div
                  key={wave.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted transition-colors"
                >
                  <Link
                    to="/educator/courses/$courseId/lessons/$lessonId/waves/$waveId"
                    params={{ courseId, lessonId, waveId: wave.id }}
                    className="min-w-0 flex-1"
                  >
                    <p className="font-medium">{wave.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Order {wave.sequenceOrder} · {wave.difficulty} ·{" "}
                      <Zap className="inline h-3 w-3" /> {wave.xpReward} XP
                    </p>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span className={wave.isPublished ? "text-green-600" : "text-amber-600"}>
                      {wave.isPublished ? "Published" : "Draft"}
                    </span>
                    {!wave.isPublished && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={publishingWaveId === wave.id || publishWaveResult.fetching}
                        onClick={() => handlePublishWave(wave.id)}
                      >
                        {publishingWaveId === wave.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
