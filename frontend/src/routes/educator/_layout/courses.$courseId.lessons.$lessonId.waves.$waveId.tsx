import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Loader2, Save, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "urql";
import { Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  WAVE_QUERY,
  UPDATE_WAVE_MUTATION,
  PUBLISH_WAVE_MUTATION,
} from "@/graphql/courses";
import { puckConfig, waveDataToPuck, puckToWaveData } from "@/components/puck-blocks/puck-config";

export const Route = createFileRoute(
  "/educator/_layout/courses/$courseId/lessons/$lessonId/waves/$waveId"
)({
  component: WaveEditorPage,
});

function WaveEditorPage() {
  const { courseId, lessonId, waveId } = Route.useParams();
  const navigate = useNavigate();

  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: WAVE_QUERY,
    variables: { id: waveId },
  });

  const [updateResult, updateWave] = useMutation(UPDATE_WAVE_MUTATION);
  const [publishResult, publishWave] = useMutation(PUBLISH_WAVE_MUTATION);

  const [puckData, setPuckData] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const wave = data?.wave;

  // Initialize Puck data once the wave is loaded
  useEffect(() => {
    if (wave) {
      const formatted = waveDataToPuck(wave.learnBlocks, wave.evaluateBlocks);
      setPuckData(formatted);
    }
  }, [wave]);

  const handleSave = async (dataToSave: any) => {
    setSaveStatus("saving");
    setErrorMessage(null);

    const { learnBlocks, evaluateBlocks } = puckToWaveData(dataToSave);

    const result = await updateWave({
      id: waveId,
      input: {
        title: wave.title,
        sequenceOrder: wave.sequenceOrder,
        xpReward: wave.xpReward,
        maxReattempts: wave.maxReattempts,
        passingThreshold: wave.passingThreshold,
        estimatedDuration: wave.estimatedDuration,
        difficulty: wave.difficulty,
        learnBlocks,
        evaluateBlocks,
      },
    });

    if (result.error) {
      setSaveStatus("error");
      setErrorMessage(result.error.message);
      return;
    }

    setSaveStatus("success");
    reexecuteQuery({ requestPolicy: "network-only" });
    setTimeout(() => setSaveStatus("idle"), 3000);
  };

  const handlePublish = async () => {
    setErrorMessage(null);
    const result = await publishWave({ id: waveId });
    if (result.error) {
      setErrorMessage(result.error.message);
      return;
    }
    reexecuteQuery({ requestPolicy: "network-only" });
  };

  if (fetching && !puckData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading Wave Editor...</span>
      </div>
    );
  }

  if (error || !wave) {
    return (
      <div className="space-y-4">
        <p className="text-destructive font-medium">Failed to load Wave: {error?.message || "Not found"}</p>
        <Link to="/educator/courses/$courseId/lessons/$lessonId" params={{ courseId, lessonId }}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Lesson
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/educator/courses/$courseId/lessons/$lessonId" params={{ courseId, lessonId }}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold">{wave.title}</h2>
            <p className="text-xs text-muted-foreground">
              Lesson: {wave.lesson?.title || "Lesson"} · Difficulty: {wave.difficulty}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              wave.isPublished ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {wave.isPublished ? "Published" : "Draft"}
          </span>

          {!wave.isPublished && (
            <Button size="sm" variant="outline" onClick={handlePublish} disabled={publishResult.fetching}>
              {publishResult.fetching ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1.5 h-4 w-4" />
              )}
              Publish Wave
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => handleSave(puckData)}
            disabled={saveStatus === "saving" || updateResult.fetching}
          >
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : saveStatus === "success" ? (
              <>
                <Check className="mr-1.5 h-4 w-4 text-green-500" /> Saved!
              </>
            ) : (
              <>
                <Save className="mr-1.5 h-4 w-4" /> Save Content
              </>
            )}
          </Button>
        </div>
      </div>

      {errorMessage && (
        <p className="text-sm text-destructive font-medium bg-destructive/10 border border-destructive/20 rounded p-3 shrink-0">
          {errorMessage}
        </p>
      )}

      {/* Puck Canvas Container */}
      <div className="flex-1 border rounded-lg overflow-hidden bg-background relative min-h-[400px]">
        {puckData && (
          <Puck
            config={puckConfig}
            data={puckData}
            onChange={(newData) => setPuckData(newData)}
            onPublish={handleSave}
          />
        )}
      </div>
    </div>
  );
}
