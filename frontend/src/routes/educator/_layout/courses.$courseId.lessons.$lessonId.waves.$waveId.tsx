import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bot, Check, Eye, EyeOff, Loader2, Save, Send } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "urql";

import { AIAssistantPanel } from "@/components/educator/AIAssistantPanel";
import { WavePreview } from "@/components/educator/WavePreview";
import { pushPuckData, setPuckPanelsVisible } from "@/components/puck-blocks/puck-bridge";
import {
  agentBlocksToPuckItems,
  applyBlockOpsToData,
  type EvaluateBlockRaw,
  type LearnBlockRaw,
  type PuckData,
  puckToWaveData,
  waveDataToPuck,
} from "@/components/puck-blocks/puck-config";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { PUBLISH_WAVE_MUTATION, UPDATE_WAVE_MUTATION, WAVE_QUERY } from "@/graphql/courses";
import { type AIBlockOps, useAIAssistant } from "@/stores/ai-assistant";

// @puckeditor/core (~large, plus its CSS) is code-split into its own chunk
// and only fetched when an educator actually opens the wave editor.
const PuckCanvas = lazy(() => import("@/components/puck-blocks/PuckCanvas"));

export const Route = createFileRoute(
  "/educator/_layout/courses/$courseId/lessons/$lessonId/waves/$waveId",
)({
  component: WaveEditorPage,
});

// Custom docked layout: the Puck editor owns the full remaining width and
// the AI assistant docks on the right at a resizable width. The route root
// cancels the shell's vertical padding (-my-6) and sizes to the viewport
// minus the sticky navbar (h-16), so the editor always fits the screen and
// Puck scrolls internally — bottom blocks stay reachable.
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

  // Dock resize drag
  const dockDragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const setHandlers = useAIAssistant((s) => s.setHandlers);

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

  // Apply an edit/delete op set to the live editor content.
  const applyBlockOps = useCallback(
    (ops: AIBlockOps) => {
      if (!puckData) return;
      const next = applyBlockOpsToData(puckData, ops);
      if (
        next.content.length === puckData.content?.length &&
        JSON.stringify(next) === JSON.stringify(puckData)
      ) {
        return; // no-op (nothing to change)
      }
      setPuckData(next);
      pushPuckData(next);
    },
    [puckData],
  );

  // Auto-insert AI-generated blocks at the end of the current content.
  const handleAutoInsert = useCallback(
    (learnBlocks: LearnBlockRaw[], evaluateBlocks: EvaluateBlockRaw[]) => {
      if (!puckData) return;
      const newItems = agentBlocksToPuckItems(learnBlocks, evaluateBlocks);
      if (newItems.length === 0) return;
      const existing = puckData.content ?? [];
      const incomingHTML = newItems.find((item) => item.type === "HtmlSimulationBlock");
      const incomingItems = incomingHTML
        ? [
            incomingHTML,
            ...newItems.filter(
              (item) => item !== incomingHTML && item.type !== "HtmlSimulationBlock",
            ),
          ]
        : newItems;
      const existingIndexByID = new Map(
        existing.map((item, index) => [String(item.props?.id ?? ""), index]),
      );
      const nextContent = [...existing];
      let changed = false;
      for (const item of incomingItems) {
        const id = String(item.props?.id ?? "");
        if (!id) continue;
        const existingIndex =
          item.type === "HtmlSimulationBlock"
            ? nextContent.findIndex((candidate) => candidate.type === "HtmlSimulationBlock")
            : existingIndexByID.get(id);
        if (existingIndex !== undefined && existingIndex >= 0) {
          // A model retry or a later request may reuse the same generated id.
          // Replace in place rather than appending/renaming, which used to
          // leave the old HTML simulation and create a duplicate.
          if (JSON.stringify(nextContent[existingIndex]) !== JSON.stringify(item)) {
            nextContent[existingIndex] = item;
            changed = true;
          }
        } else {
          existingIndexByID.set(id, nextContent.length);
          nextContent.push(item);
          changed = true;
        }
      }
      if (!changed) return;
      const next: PuckData = {
        ...puckData,
        content: nextContent,
      };
      setPuckData(next);
      pushPuckData(next);
    },
    [puckData],
  );

  useEffect(() => {
    setHandlers({
      onInsert: (blocks) => handleAutoInsert(blocks.learnBlocks, blocks.evaluateBlocks),
      onOps: applyBlockOps,
    });
  }, [setHandlers, handleAutoInsert, applyBlockOps]);

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

  // Opening the AI assistant auto-collapses BOTH of Puck's side panels
  // (blocks palette + properties) so the docked chat gets room and the
  // editor canvas keeps the full remaining width; closing the assistant
  // restores both panels.
  const toggleAssistant = (open: boolean) => {
    setAssistantOpen(open);
    setPuckPanelsVisible(!open);
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
    const next = Math.min(
      MAX_DOCK_WIDTH,
      Math.max(MIN_DOCK_WIDTH, drag.startWidth + (drag.startX - e.clientX)),
    );
    setDockWidth(next);
  };
  const endDockDrag = () => {
    dockDragRef.current = null;
  };

  // A short markdown-ish summary of the wave for the agent's context, so it
  // can reference existing content ("keep the same tone as...", "add to the
  // existing learn section", "update block X").
  const waveContext = useMemo(() => {
    if (!wave) return "";
    return [
      `Wave: ${wave.title}`,
      `Difficulty: ${wave.difficulty} | XP: ${wave.xpReward}`,
      `Learn blocks: ${(wave.learnBlocks ?? []).length}`,
      `Evaluate blocks: ${(wave.evaluateBlocks ?? []).length}`,
      ...(wave.learnBlocks ?? []).map(
        (b: { id?: string; type: string; content: string }) =>
          `- [learn/${b.type}] id=${b.id ?? "?"} ${b.content.slice(0, 120)}`,
      ),
      ...(wave.evaluateBlocks ?? []).map(
        (b: { id?: string; type: string; question: string }) =>
          `- [evaluate/${b.type}] id=${b.id ?? "?"} ${b.question.slice(0, 120)}`,
      ),
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
    // -my-6 cancels the shell's py-6 so the editor spans the full viewport
    // below the sticky navbar (h-16); main is overflow-hidden and Puck
    // scrolls its own canvas internally.
    <div className="-my-6 flex h-[calc(100dvh-4rem)] flex-col">
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
              wave.isPublished
                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
            }`}
          >
            {wave.isPublished ? "Published" : "Draft"}
          </span>

          {/* Edit / Preview toggle - segmented shadcn button group */}
          <ButtonGroup size="sm">
            <Button
              size="sm"
              variant={!previewMode ? "default" : "ghost"}
              className="h-9 rounded-none border-0 px-3"
              onClick={() => setPreviewMode(false)}
            >
              <EyeOff className="mr-1.5 h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              size="sm"
              variant={previewMode ? "default" : "ghost"}
              className="h-9 rounded-none border-0 px-3"
              onClick={() => setPreviewMode(true)}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" /> Preview
            </Button>
          </ButtonGroup>

          <Button
            size="sm"
            variant={assistantOpen ? "default" : "outline"}
            onClick={() => toggleAssistant(!assistantOpen)}
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
              title="Publish this wave so students can take it"
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
            title="Save the current editor content"
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
          ) : puckData ? (
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading editor...</span>
                </div>
              }
            >
              <PuckCanvas data={puckData} onChange={setPuckData} onPublish={handleSave} />
            </Suspense>
          ) : null}
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
              <AIAssistantPanel
                waveTitle={wave.title ?? "Wave"}
                waveContext={waveContext}
                grade={wave.gradeLevel ?? undefined}
                language="en"
                puckData={puckData ?? { content: [], root: {}, zones: {} }}
                onClose={() => toggleAssistant(false)}
              />
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
