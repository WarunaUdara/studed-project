import {
  ArrowDownToLine,
  Bot,
  Loader2,
  Sparkles,
  User,
  Wand2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import {
  type AgentEvent,
  streamAgentChat,
} from "@/lib/ai-chat";
import { type PuckData } from "@/components/puck-blocks/puck-config";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  events: AgentEvent[];
  done: boolean;
  error?: string;
}

export interface AIAssistantPanelProps {
  waveTitle: string;
  waveContext: string;
  grade?: string;
  language?: string;
  puckData: PuckData;
  onInsertBlocks: (
    learnBlocks: NonNullable<AgentEvent["learnBlocks"]>,
    evaluateBlocks: NonNullable<AgentEvent["evaluateBlocks"]>,
  ) => void;
  onClose: () => void;
}

const TOOL_LABELS: Record<string, string> = {
  generate_learn_blocks: "Generating Learn blocks",
  generate_evaluate_blocks: "Generating Evaluate blocks",
  generate_visualization: "Creating interactive visualization",
  translate: "Translating content",
};

export function AIAssistantPanel({
  waveTitle,
  waveContext,
  grade,
  language,
  puckData,
  onInsertBlocks,
  onClose,
}: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<{
    learnBlocks: AgentEvent["learnBlocks"];
    evaluateBlocks: AgentEvent["evaluateBlocks"];
  } | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, running]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const suggestions = [
    "Create 3 learn blocks and 2 questions about this topic",
    "Generate a multiple choice question for this wave",
    "Create an example to illustrate the concept",
  ];

  const send = async (rawPrompt?: string) => {
    const prompt = (rawPrompt ?? input).trim();
    if (!prompt || running) return;
    setInput("");
    setRunning(true);
    setLastGenerated(null);

    const userMsg: ChatMessage = { role: "user", text: prompt, events: [], done: true };
    const assistantMsg: ChatMessage = { role: "assistant", text: "", events: [], done: false };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    const abort = new AbortController();
    abortRef.current = abort;

    const updateAssistant = (updater: (m: ChatMessage) => ChatMessage) => {
      setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? updater(m) : m)));
    };

    // Grab the latest blocks the agent produced for the insert buttons.
    const latestBlocks = {
      learnBlocks: [] as NonNullable<AgentEvent["learnBlocks"]>,
      evaluateBlocks: [] as NonNullable<AgentEvent["evaluateBlocks"]>,
    };

    let finalText = "";

    await streamAgentChat(
      {
        prompt,
        grade,
        language,
        waveContext: waveContext || `Wave: ${waveTitle}`,
      },
      {
        signal: abort.signal,
        onEvent: (event) => {
          if (event.type === "delta") {
            finalText += event.message ?? "";
            updateAssistant((m) => ({ ...m, text: finalText, events: [...m.events, event] }));
          } else if (event.type === "tool_start") {
            updateAssistant((m) => ({ ...m, events: [...m.events, event] }));
          } else if (event.type === "tool_end") {
            updateAssistant((m) => ({ ...m, events: [...m.events, event] }));
          } else if (event.type === "done") {
            if (event.learnBlocks?.length) latestBlocks.learnBlocks.push(...event.learnBlocks);
            if (event.evaluateBlocks?.length) latestBlocks.evaluateBlocks.push(...event.evaluateBlocks);
            const blocks = event.learnBlocks?.length || event.evaluateBlocks?.length;
            const summary = blocks
              ? `Generated ${event.learnBlocks?.length ?? 0} Learn block(s) and ${event.evaluateBlocks?.length ?? 0} Evaluate block(s).`
              : "";
            updateAssistant((m) => ({
              ...m,
              text: finalText || event.message || summary || "Done.",
              events: [...m.events, event],
              done: true,
            }));
            setLastGenerated({
              learnBlocks: latestBlocks.learnBlocks,
              evaluateBlocks: latestBlocks.evaluateBlocks,
            });
          } else if (event.type === "error") {
            updateAssistant((m) => ({
              ...m,
              text: m.text || "The assistant hit an error.",
              error: event.error || "Unknown AI error",
              events: [...m.events, event],
              done: true,
            }));
          }
        },
        onError: (message) => {
          updateAssistant((m) => ({
            ...m,
            text: m.text || "The assistant could not respond.",
            error: message,
            done: true,
          }));
        },
        onComplete: () => {
          setRunning(false);
        },
      },
    );

    // If the stream ended without a terminal event, mark done.
    setMessages((prev) =>
      prev.map((m, i) => (i === prev.length - 1 && !m.done ? { ...m, done: true } : m)),
    );
    setRunning(false);
  };

  const insertBlocks = () => {
    if (!lastGenerated) return;
    onInsertBlocks(
      lastGenerated.learnBlocks ?? [],
      lastGenerated.evaluateBlocks ?? [],
    );
    setLastGenerated(null);
  };

  const toolChip = (event: AgentEvent) => {
    if (event.type !== "tool_start") return null;
    const label = TOOL_LABELS[event.tool ?? ""] ?? `Using tool: ${event.tool}`;
    return (
      <div key={`tool-${event.tool}-${event.message}`} className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Wand2 className="h-3 w-3 text-primary" />
        <span>{label}</span>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col border-l bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">AI Assistant</h3>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            {waveTitle}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="hidden text-[10px] text-muted-foreground sm:inline">
            {puckData.content?.length ?? 0} block(s) in editor
          </span>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-muted" aria-label="Close AI assistant">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
              <p className="mb-2 flex items-center gap-1.5 font-medium text-foreground">
                <Bot className="h-4 w-4" /> I can build this wave&apos;s content with you.
              </p>
              <p>
                Ask me to create Learn blocks (text, formulas, images) and Evaluate blocks (MCQ, fill-in-the-blank,
                drag-and-drop) for this wave. I&apos;ll generate them with the editor&apos;s block types so you can insert
                them directly.
              </p>
            </div>
            <div className="space-y-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
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
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {m.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm border bg-card text-card-foreground"
                }`}
              >
                {m.text || (m.done ? "" : <span className="text-muted-foreground">Thinking...</span>)}
              </div>
            </div>

            {m.role === "assistant" && (
              <>
                {m.events.filter((e) => e.type === "tool_start").map((e) => toolChip(e))}
                {m.error && (
                  <p className="text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded px-2 py-1.5">
                    {m.error}
                  </p>
                )}
                {m.done && !m.error && m.events.some((e) => e.type === "done") && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ArrowDownToLine className="h-3 w-3" />
                    Review the blocks below, then insert them into the editor.
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

      {/* Insert actions */}
      {lastGenerated && (
        <div className="border-t bg-muted/30 px-4 py-3 shrink-0">
          <p className="mb-2 text-xs font-medium text-foreground">
            Ready to insert: {lastGenerated.learnBlocks?.length ?? 0} Learn,{" "}
            {lastGenerated.evaluateBlocks?.length ?? 0} Evaluate block(s)
          </p>
          <Button size="sm" className="w-full" onClick={insertBlocks}>
            <ArrowDownToLine className="mr-1.5 h-4 w-4" /> Insert into editor
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-3 shrink-0">
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
            placeholder="Ask the assistant to build content..."
            disabled={running}
            className="h-9 text-sm"
          />
          <Button type="submit" size="sm" disabled={running || !input.trim()} className="h-9 shrink-0">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
