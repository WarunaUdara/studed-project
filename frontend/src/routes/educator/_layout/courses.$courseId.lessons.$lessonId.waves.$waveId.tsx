import { createFileRoute, Link } from "@tanstack/react-router";
import {
  createTab,
  createTabSet,
  findNodeById,
  Layout,
  removeNodeById,
  type CloseTabsetPayload,
  type LayoutAction,
  type LayoutModel,
  type LayoutNode,
} from "layout-manager-react";
import "layout-manager-react/dist/style.css";
import { ArrowLeft, Bot, Check, Loader2, Save, Send } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "urql";

import { AIAssistantPanel } from "@/components/educator/AIAssistantPanel";
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

const EDITOR_TABSET_ID = "wave-editor-tabset";
const AI_TABSET_ID = "ai-assistant-tabset";

// buildLayoutModel assembles the docked editor + AI assistant layout.
// The AI tabset is only present when the assistant is open; closing it
// removes the node so the editor reclaims the full width.
function buildLayoutModel(assistantOpen: boolean, aiFlex: number): LayoutModel {
  // createTab's 4th arg is stored in `config`, not on the node, and the
  // factory helpers hardcode enableClose: true — set the flags explicitly
  // so the editor tab can never be closed into an empty layout.
  const editorTab: LayoutNode = createTab("wave-editor-tab", "wave-editor", "Wave Editor");
  editorTab.enableClose = false;
  editorTab.enableDrag = false;

  const editorTabset: LayoutNode = createTabSet(EDITOR_TABSET_ID, [editorTab]);
  editorTabset.flex = 1;

  const children: LayoutNode[] = [editorTabset];
  if (assistantOpen) {
    const aiTab: LayoutNode = createTab("ai-assistant-tab", "ai-assistant", "AI Assistant");
    aiTab.enableClose = false;
    aiTab.enableDrag = false;

    const aiTabset: LayoutNode = createTabSet(AI_TABSET_ID, [aiTab]);
    aiTabset.flex = aiFlex;
    children.push(aiTabset);
  }

  return {
    global: {
      enableClose: false,
      enableDrag: false,
      enableResize: true,
      splitterSize: 8,
      direction: "ltr",
    },
    layout: {
      id: "wave-layout-root",
      type: "row",
      children,
    },
  };
}

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
  // Bumped on AI insert: Puck's data prop is uncontrolled, so remounting
  // with a new key makes it reinitialize from the updated data.
  const [puckVersion, setPuckVersion] = useState(0);

  // Remember the last AI tabset width so reopen restores the user's resize.
  const aiFlexRef = useRef(0.3);
  const [layoutModel, setLayoutModel] = useState<LayoutModel>(() => buildLayoutModel(false, 0.3));

  const setInsertHandler = useAIAssistant((s) => s.setInsertHandler);

  const wave = data?.wave;

  // Initialize Puck data once the wave is loaded
  useEffect(() => {
    if (wave) {
      const formatted = waveDataToPuck(wave.learnBlocks, wave.evaluateBlocks);
      setPuckData(formatted);
    }
  }, [wave]);

  // Insert AI-generated blocks at the end of the current editor content.
  // The parent state is updated and Puck is remounted (key bump) so it
  // reinitializes from the new data — Puck's data prop is uncontrolled.
  const handleInsertBlocks = useCallback(
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

  // The store calls this when the panel's "Insert" button is pressed.
  useEffect(() => {
    setInsertHandler((blocks) =>
      handleInsertBlocks(blocks.learnBlocks, blocks.evaluateBlocks),
    );
  }, [setInsertHandler, handleInsertBlocks]);

  const openAssistant = () => {
    setAssistantOpen(true);
    setLayoutModel(buildLayoutModel(true, aiFlexRef.current));
  };

  const closeAssistant = () => {
    // Remember the live width from the current model before removing it.
    const current = findNodeById(layoutModel.layout, AI_TABSET_ID);
    if (current && typeof current.flex === "number") {
      aiFlexRef.current = current.flex;
    }
    setAssistantOpen(false);
    setLayoutModel((prev) => ({
      ...prev,
      layout: removeNodeById(prev.layout, AI_TABSET_ID),
    }));
  };

  // The layout-manager renders a close button on every tab (the enableClose
  // flag is not honored by this library version) and dispatches closeTabset
  // actions for them. Intercept: the editor tab must never close (it would
  // leave an empty workspace), and closing the AI tabset should behave like
  // the panel's own X button.
  const handleLayoutAction = useCallback(
    (action: LayoutAction) => {
      if (action.type !== "closeTabset") return;
      const payload = action.payload as CloseTabsetPayload;
      if (payload?.nodeId === AI_TABSET_ID) {
        closeAssistant();
        return;
      }
      if (payload?.nodeId === EDITOR_TABSET_ID) {
        // The editor tab must never close (it would leave an empty
        // workspace); ignore the close action entirely.
        return;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layoutModel, assistantOpen],
  );

  const toggleAssistant = () => {
    if (assistantOpen) {
      closeAssistant();
    } else {
      openAssistant();
    }
  };

  const handleSave = async (dataToSave: PuckData) => {
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

  // Factory renders tab content by component id. The AI assistant content is
  // cheap to re-render; the editor content keeps its own React state across
  // layout model changes (resize/toggle) because the tab node stays mounted.
  const factory = useCallback(
    (node: LayoutNode) => {
      switch (node.component) {
        case "wave-editor":
          if (!puckData) {
            return (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading editor...</span>
              </div>
            );
          }
          return (
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading editor...</span>
                </div>
              }
            >
              <PuckCanvas key={puckVersion} data={puckData} onChange={setPuckData} onPublish={handleSave} />
            </Suspense>
          );
        case "ai-assistant":
          return (
            <AIAssistantPanel
              waveTitle={wave?.title ?? "Wave"}
              waveContext={waveContext}
              grade={wave?.gradeLevel ?? undefined}
              language="en"
              puckData={puckData ?? { content: [], root: {}, zones: {} }}
              onClose={closeAssistant}
            />
          );
        default:
          return null;
      }
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

          <Button
            size="sm"
            variant={assistantOpen ? "default" : "outline"}
            onClick={toggleAssistant}
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
              Publish Wave
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

      {/* Resizable docked layout: editor + AI assistant (layout-manager-react).
          The assistant docks on the right; the editor tabset keeps its flex
          share, so content is retained while the canvas shrinks. */}
      <div className="flex-1 min-h-[400px] overflow-hidden rounded-lg border bg-background">
        <Layout
          model={layoutModel}
          factory={factory}
          onModelChange={setLayoutModel}
          onAction={handleLayoutAction}
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </div>
  );
}
