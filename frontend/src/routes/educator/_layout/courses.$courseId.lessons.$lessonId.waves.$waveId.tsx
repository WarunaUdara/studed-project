import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bot, Check, Eye, EyeOff, Loader2, Save, Send } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "urql";

import { AIAssistantPanel } from "@/components/educator/AIAssistantPanel";
import { WavePreview } from "@/components/educator/WavePreview";
import {
  agentBlocksToPuckItems,
  type PuckData,
  puckToWaveData,
  waveDataToPuck,
} from "@/components/puck-blocks/puck-config";
import { Button } from "@/components/ui/button";
import { PUBLISH_WAVE_MUTATION, UPDATE_WAVE_MUTATION, WAVE_QUERY } from "@/graphql/courses";
import { useAIAssistant } from "@/stores/ai-assistant";

// @puckeditor/core (~large, plus its CSS) is code-split into its own chunk
// and only fetched when an educator actually opens the wave editor.
const PuckCanvas = lazy(() => import("@/components/puck-blocks/PuckCanvas"));

export const Route = createFileRoute(
  "/educator/_layout/courses/$courseId/lessons/$lessonId/waves/$waveId",
)({
  component: WaveEditorPage,
});

// Custom docked layout: the Puck editor owns the full remaining width and
// the AI assistant docks on the right at a resizable width. (layout-manager
// was replaced: its tab chrome clashed with the design system and the editor
// deserves the whole screen.)
const DEFAULT_DOCK_WIDTH = 400;
const MIN_DOCK_WIDTH = 320;
const MAX_DOCK_WIDTH = 560;

// Safe coercion for unknown props
const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);

function WaveEditorPage() {
  const { courseId, lessonId, waveId } = Route.useParams();

  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: WAVE_QUERY,
    variables: { id: waveId },
  });

  const [updateResult, updateWave] = useMutation(UPDATE_WAVE_MUTATION);
  const [publishResult, publishWave] = useMutation(PUBLISH_WAVE_MUTATION);

  const [puckData, setPuckData] = useState<PuckData | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [dockWidth, setDockWidth] = useState(DEFAULT_DOCK_WIDTH);
  // Bumped on AI auto-insert: Puck's data prop is uncontrolled, so remounting
  // with a new key makes it reinitialize from the updated data.
  const [puckVersion, setPuckVersion] = useState(0);

  // Dock resize drag
  const dockDragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const setInsertHandler = useAIAssistant((s) => s.setInsertHandler);

  const wave = data?.wave;

  // Initialize Puck data once the wave is loaded
  useEffect(() => {
    if (wave) {
      const formatted = waveDataToPuck(wave.learnBlocks, wave.evaluateBlocks);
      // Mirror the wave title into the Puck root page so the properties
      // panel shows it (and it is saved back as the wave title).
      formatted.root = { props: { title: wave.title ?? "" } };
      setPuckData(formatted);
    }
  }, [wave]);

  // Auto-insert AI-generated blocks at the end of the current content. Called
  // by the assistant store the moment a done event with blocks arrives, so
  // blocks land in the editor without any manual insert step.
  const handleAutoInsert = useCallback(
    (learnBlocks: Parameters<typeof agentBlocksToPuckItems>[0], evaluateBlocks: Parameters<typeof agentBlocksToPuckItems>[1]) => {
      if (!puckData) return;
      const newItems = agentBlocksToPuckItems(learnBlocks, evaluateBlocks);
      if (newItems.length === 0) return;
      setPuckData({
        ...puckData,
        content: [...(puckData.content ?? []), ...newItems],
      });
      setPuckVersion((v) => v + 1);
    },
    [puckData],
  );

  useEffect(() => {
    setInsertHandler((blocks) => handleAutoInsert(blocks.learnBlocks, blocks.evaluateBlocks));
  }, [setInsertHandler, handleAutoInsert]);

  const handleSave = async (dataToSave: PuckData) => {
    setSaveStatus("saving");
    setErrorMessage(null);

    const { learnBlocks, evaluateBlocks } = puckToWaveData(dataToSave);
    const editedTitle = str(dataToSave.root?.props?.title) || wave.title;

    const result = await updateWave({
      id: waveId,
      input: {
        title: editedTitle,
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

  // Dock drag handlers (pointer-based, so it works with mouse + touch).
  const startDockDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    dockDragRef.current = { startX: e.clientX, startWidth: dockWidth };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const moveDockDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dockDragRef.current;
    if (!drag) return;
    const next = Math.min(MAX_DOCK_WIDTH, Math.max(MIN_DOCK_WIDTH, drag.startWidth + (drag.startX - e.clientX)));
    setDockWidth(next);
  };
  const endDockDrag = () => {
    dockDragRef.current = null;
  };

  const factory = useCallback(
    (node: { component?: string }) => {
      if (node.component === "ai-assistant") {
        return (
          <AIAssistantPanel
            waveTitle={wave?.title ?? "Wave"}
            waveContext={waveContext}
            grade={wave?.gradeLevel ?? undefined}
            language="en"
            puckData={puckData ?? { content: [], root: {}, zones: {} }}
            onClose={() => setAssistantOpen(false)}
          />
        );
      }
      return null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [puckData, wave],
  );

  // A short markdown-ish summary of the wave for the agent's context, so it
  // can reference existing content ("keep the same tone as...", "add to the
  // existing learn section").
  const waveContext = useMemo(() => {
    if (!wave) return "";
    return [
      `Wave: ${wave.title}`,
      `Difficulty: ${wave.difficulty} | XP: ${wave.xpReward}`,
      `Learn blocks: ${(wave.learnBlocks ?? []).length}`,
      `Evaluate blocks: ${(wave.evaluateBlocks ?? []).length}`,
      ...(wave.learnBlocks ?? []).map((b: { type: string; content: string }) => `- [learn/${b.type}] ${b.content.slice(0, 120)}`),
      ...(wave.evaluateBlocks ?? []).map((b: { type: string; question: string }) => `- [evaluate/${b.type}] ${b.question.slice(0, 120)}`),
    ].join("\n");
  }, [wave]);

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
        <p className="text-destructive font-medium">
          Failed to load Wave: {error?.message || "Not found"}
        </p>
        <Link to="/educator/courses/$courseId/lessons/$lessonId" params={{ courseId, lessonId }}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Lesson
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Header bar */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b bg-background/95 px-4 py-2.5 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/educator/courses/$courseId/lessons/$lessonId" params={{ courseId, lessonId }}>
            <Button variant="ghost" size="sm" className="px-2">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
          </Link>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold leading-tight">{wave.title}</h2>
            <p className="truncate text-xs text-muted-foreground">
              Lesson: {wave.lesson?.title || "Lesson"} · Difficulty: {wave.difficulty}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              wave.isPublished ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
            }`}
          >
            {wave.isPublished ? "Published" : "Draft"}
          </span>

          {/* Edit / Preview toggle */}
          <div className="flex overflow-hidden rounded-lg border">
            <Button
              size="sm"
              variant={!previewMode ? "default" : "ghost"}
              className="rounded-none px-3"
              onClick={() => setPreviewMode(false)}
            >
              <EyeOff className="mr-1.5 h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              size="sm"
              variant={previewMode ? "default" : "ghost"}
              className="rounded-none px-3"
              onClick={() => setPreviewMode(true)}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" /> Preview
            </Button>
          </div>

          <Button
            size="sm"
            variant={assistantOpen ? "default" : "outline"}
            onClick={() => setAssistantOpen((open) => !open)}
            className="gap-1.5"
          >
            <Bot className="h-4 w-4" />
            AI Assistant
          </Button>

          {!wave.isPublished && (
            <Button
              size="sm"
              variant="outline"
              onClick={handlePublish}
              disabled={publishResult.fetching}
            >
              {publishResult.fetching ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1.5 h-4 w-4" />
              )}
              Publish
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => puckData && handleSave(puckData)}
            disabled={!puckData || saveStatus === "saving" || updateResult.fetching}
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
                <Save className="mr-1.5 h-4 w-4" /> Save
              </>
            )}
          </Button>
        </div>
      </header>

      {errorMessage && (
        <p className="shrink-0 border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive">
          {errorMessage}
        </p>
      )}

      {/* Body: editor (or preview) + optional AI dock */}
      <div className="flex min-h-0 flex-1">
        {/* Main pane: Puck editor or student preview */}
        <main className="relative min-w-0 flex-1 overflow-hidden">
          {previewMode ? (
            puckData ? (
              <div className="h-full overflow-y-auto bg-background">
                <WavePreview title={wave.title} puckData={puckData} />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Load preview...
              </div>
            )
          ) : (
            <>
              {puckData && (
                <Suspense
                  fallback={
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2 text-muted-foreground">Loading editor...</span>
                    </div>
                  }
                >
                  <PuckCanvas
                    key={puckVersion}
                    data={puckData}
                    onChange={setPuckData}
                    onPublish={handleSave}
                  />
                </Suspense>
              )}
            </>
          )}
        </main>

        {/* Resizable AI dock */}
        {assistantOpen && (
          <>
            <div
              className="w-1.5 shrink-0 cursor-col-resize bg-border transition-colors hover:bg-primary/40"
              onPointerDown={startDockDrag}
              onPointerMove={moveDockDrag}
              onPointerUp={endDockDrag}
              onPointerCancel={endDockDrag}
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize AI assistant panel"
            />
            <aside
              className="shrink-0 overflow-hidden border-l bg-background"
              style={{ width: dockWidth }}
            >
              {factory({ component: "ai-assistant" })}
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
