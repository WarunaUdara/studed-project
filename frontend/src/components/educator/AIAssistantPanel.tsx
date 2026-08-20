import {
  ArrowDownToLine,
  Bot,
  Brain,
  Check,
  ChevronDown,
  ChevronRight,
  ImagePlus,
  Loader2,
  ScanText,
  Sparkles,
  Square,
  User,
  Wand2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { ChatMarkdown } from "@/components/educator/ChatMarkdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { type PuckData } from "@/components/puck-blocks/puck-config";
import { type AgentEvent } from "@/lib/ai-chat";
import { cn } from "@/lib/utils";
import { useAIAssistant } from "@/stores/ai-assistant";

export interface AIAssistantPanelProps {
  waveTitle: string;
  waveContext: string;
  grade?: string;
  language?: string;
  puckData: PuckData;
  onClose: () => void;
}

const TOOL_LABELS: Record<string, string> = {
  generate_learn_blocks: "Generating Learn blocks",
  generate_evaluate_blocks: "Generating Evaluate blocks",
  generate_visualization: "Creating interactive visualization",
  translate: "Translating content",
  manage_blocks: "Updating editor blocks",
};

const MAX_IMAGES = 6;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB per image

export function AIAssistantPanel({
  waveTitle,
  waveContext,
  grade,
  language,
  puckData,
  onClose,
}: AIAssistantPanelProps) {
  const { messages, running, lastInserted, lastOps, sendPrompt, stop, clearInserted, clearOps } =
    useAIAssistant();
  const [input, setInput] = useState("");
  const [images, setImages] = useState<{ file: File; dataUrl: string }[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [expandedThoughts, setExpandedThoughts] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const suggestions = [
    "Create 3 learn blocks and 2 questions about this topic",
    "Generate a multiple choice question for this wave",
    "Create an example to illustrate the concept",
    "Make the first paragraph simpler for Grade 6",
  ];

  const addImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setImageError(null);

    const pending: { file: File; dataUrl: string }[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        setImageError(`"${file.name}" is not an image.`);
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setImageError(`"${file.name}" is larger than 4MB.`);
        continue;
      }
      pending.push({ file, dataUrl: "" });
    }
    if (pending.length === 0) return;

    const remaining = MAX_IMAGES - images.length;
    if (pending.length > remaining) {
      setImageError(`You can attach up to ${MAX_IMAGES} images.`);
    }
    const toAdd = pending.slice(0, Math.max(0, remaining));

    for (const item of toAdd) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result ?? "");
        setImages((prev) => prev.map((p) => (p.file === item.file ? { ...p, dataUrl } : p)));
      };
      reader.readAsDataURL(item.file);
    }

    setImages((prev) => [...prev, ...toAdd]);
  };

  const removeImage = (name: string) => {
    setImages((prev) => prev.filter((i) => i.file.name !== name));
    setImageError(null);
  };

  const send = async (rawPrompt?: string) => {
    const prompt = (rawPrompt ?? input).trim();
    if (!prompt || running) return;
    const attached = images.filter((i) => i.dataUrl).map((i) => i.dataUrl);
    sendPrompt(prompt, { waveContext, grade, language, images: attached });
    setInput("");
    setImages([]);
  };

  const toggleThoughts = (msgIndex: number) => {
    setExpandedThoughts((prev) => {
      const next = new Set(prev);
      if (next.has(msgIndex)) next.delete(msgIndex);
      else next.add(msgIndex);
      return next;
    });
  };

  const toolChip = (event: AgentEvent, index: number) => {
    if (event.type === "ocr") {
      return (
        <div key={`ocr-${index}`} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ScanText className="h-3 w-3 text-primary" />
          <span>{event.message || "Analyzing uploaded images..."}</span>
        </div>
      );
    }
    if (event.type !== "tool_start") return null;
    const label = TOOL_LABELS[event.tool ?? ""] ?? `Using tool: ${event.tool}`;
    return (
      <div key={`tool-${index}`} className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Wand2 className="h-3 w-3 text-primary" />
        <span>{label}</span>
      </div>
    );
  };

  const opsSummary = (() => {
    if (!lastOps) return null;
    const parts: string[] = [];
    if (lastOps.upsertLearn?.length) parts.push(`${lastOps.upsertLearn.length} updated`);
    if (lastOps.upsertEval?.length) parts.push(`${lastOps.upsertEval.length} updated`);
    if (lastOps.deleteIDs?.length) parts.push(`${lastOps.deleteIDs.length} removed`);
    return parts.length ? parts.join(", ") : null;
  })();

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <h3 className="truncate text-sm font-semibold">AI Assistant</h3>
          <span className="hidden rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary lg:inline">
            {waveTitle}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="hidden text-[10px] text-muted-foreground xl:inline">
            {puckData.content?.length ?? 0} block(s)
          </span>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted"
            aria-label="Close AI assistant"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
              <p className="mb-2 flex items-center gap-1.5 font-medium text-foreground">
                <Bot className="h-4 w-4" /> I can build this wave&apos;s content with you.
              </p>
              <p>
                Ask me to create any content: text, formulas, images, videos, callouts,
                examples, interactive visualizations, MCQs, fill-in-the-blank, true/false,
                numeric, and drag-and-drop. Generated blocks appear in your editor instantly.
                You can also ask me to edit or remove blocks already in the editor, and I
                respond in context across messages. Upload photos of notes or textbook pages
                and I&apos;ll read them with high-effort OCR first.
              </p>
            </div>
            <div className="space-y-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => void send(s)}
                  disabled={running}
                  className="w-full rounded-lg border border-dashed p-2.5 text-left text-xs text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className="space-y-2">
            <div className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {m.role === "user" ? (
                  <User className="h-3.5 w-3.5" />
                ) : (
                  <Bot className="h-3.5 w-3.5" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                  m.role === "user"
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm border bg-card text-card-foreground",
                )}
              >
                {m.role === "assistant" ? (
                  m.text ? (
                    <ChatMarkdown content={m.text} />
                  ) : m.done ? (
                    <span className="text-muted-foreground">Done.</span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking...
                    </span>
                  )
                ) : (
                  <span className="whitespace-pre-wrap">{m.text}</span>
                )}
              </div>
            </div>

            {m.role === "assistant" && (
              <>
                {/* Model thoughts (reasoning) - agentic-style: a distinct,
                    muted, italic block that reads like Claude/Codex thinking
                    (NOT a chat bubble). Collapsed by default with a chevron;
                    expands inline. */}
                {m.thinking && (
                  <div className="ml-9 mt-1.5">
                    <button
                      onClick={() => toggleThoughts(i)}
                      className="group flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    >
                      <Brain className="h-3 w-3 text-primary/70" />
                      {expandedThoughts.has(i) ? (
                        <ChevronDown className="h-3 w-3 transition-transform" />
                      ) : (
                        <ChevronRight className="h-3 w-3 transition-transform" />
                      )}
                      Thought
                      {!expandedThoughts.has(i) && (
                        <span className="ml-1 max-w-[220px] truncate italic text-muted-foreground/70">
                          {m.thinking.replace(/\s+/g, " ").slice(0, 80)}…
                        </span>
                      )}
                    </button>
                    {expandedThoughts.has(i) && (
                      <div className="mt-1.5 rounded-md border border-dashed border-muted-foreground/25 bg-muted/40 px-3 py-2.5">
                        <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                          <Brain className="h-3 w-3" /> Model reasoning
                        </p>
                        <p className="whitespace-pre-wrap text-xs italic leading-relaxed text-muted-foreground">
                          {m.thinking}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {m.events
                  .filter((e) => e.type === "ocr" || e.type === "tool_start")
                  .map((e, idx) => toolChip(e, idx))}

                {m.error && (
                  <p className="rounded border border-destructive/20 bg-destructive/10 px-2 py-1.5 text-xs font-medium text-destructive">
                    {m.error}
                  </p>
                )}
              </>
            )}
          </div>
        ))}

        {running && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            The agent is working...
          </div>
        )}
      </div>

      {/* Auto-insert / ops confirmation (already applied to the editor). */}
      {!running && (lastInserted || lastOps) && (
        <div className="shrink-0 border-t bg-muted/30 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              {lastInserted && (
                <>
                  <ArrowDownToLine className="h-3.5 w-3.5 text-success" />
                  Added {lastInserted.learnBlocks.length} Learn, {lastInserted.evaluateBlocks.length}{" "}
                  Evaluate block(s)
                </>
              )}
              {lastInserted && lastOps && <span className="text-muted-foreground">·</span>}
              {lastOps && opsSummary && (
                <>
                  <Check className="h-3.5 w-3.5 text-success" />
                  {opsSummary} block(s)
                </>
              )}
            </p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                clearInserted();
                clearOps();
              }}
              className="h-7 px-2 text-xs"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Upload + Input */}
      <div className="shrink-0 border-t p-3">
        {imageError && (
          <p className="mb-2 rounded border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
            {imageError}
          </p>
        )}

        {images.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {images.map((img) => (
              <div key={img.file.name} className="relative h-14 w-14 shrink-0">
                {img.dataUrl ? (
                  <img
                    src={img.dataUrl}
                    alt={img.file.name}
                    className="h-full w-full rounded-md border object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-md border bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                <button
                  onClick={() => removeImage(img.file.name)}
                  disabled={running}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow disabled:opacity-50"
                  aria-label={`Remove ${img.file.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the assistant..."
            disabled={running}
            className="h-9 text-sm"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              addImages(e.target.files);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 shrink-0 px-2.5"
            disabled={running || images.length >= MAX_IMAGES}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload images"
            title="Upload images (up to 6)"
          >
            <ImagePlus className="h-4 w-4" />
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={running || (!input.trim() && images.length === 0)}
            className="h-9 shrink-0"
          >
            {running ? <Square className="h-3.5 w-3.5 fill-current" /> : <Sparkles className="h-4 w-4" />}
          </Button>
        </form>
        {running && (
          <button
            onClick={stop}
            className="mt-2 w-full rounded-md border border-dashed py-1.5 text-xs text-muted-foreground hover:border-destructive hover:text-destructive"
          >
            Stop generation
          </button>
        )}
      </div>
    </div>
  );
}
