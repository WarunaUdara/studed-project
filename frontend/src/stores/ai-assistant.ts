import { create } from "zustand";
import { type AgentEvent, type AIChatTurn, streamAgentChat } from "@/lib/ai-chat";

export interface AIChatMessage {
  role: "user" | "assistant";
  text: string;
  events: AgentEvent[];
  /** Model reasoning shown in a collapsible "thoughts" section. */
  thinking: string;
  done: boolean;
  error?: string;
}

export interface AIChatContext {
  waveContext?: string;
  grade?: string;
  language?: string;
  images?: string[]; // base64 data URLs of uploaded photos
}

/** Block sets handed to the wave editor for immediate insertion. */
export interface AIGeneratedBlocks {
  learnBlocks: NonNullable<AgentEvent["learnBlocks"]>;
  evaluateBlocks: NonNullable<AgentEvent["evaluateBlocks"]>;
}

/** Edit/delete operations the wave editor applies to existing blocks. */
export interface AIBlockOps {
  upsertLearn?: NonNullable<AgentEvent["blockOps"]>["upsertLearn"];
  upsertEval?: NonNullable<AgentEvent["blockOps"]>["upsertEval"];
  deleteIDs?: string[];
}

interface AIAssistantState {
  messages: AIChatMessage[];
  running: boolean;
  /** Most recent insert for the confirmation chip ("Added 2 Learn, 1 Evaluate"). */
  lastInserted: AIGeneratedBlocks | null;
  /** Most recent block ops for the confirmation chip ("Updated 1, removed 1"). */
  lastOps: AIBlockOps | null;
  /** In-flight abort controller so "Stop" can cancel the stream. */
  abortRef: AbortController | null;

  sendPrompt: (prompt: string, ctx: AIChatContext) => void;
  stop: () => void;
  clearInserted: () => void;
  clearOps: () => void;
  /** Registers the wave editor's callbacks (set on mount). */
  setHandlers: (h: {
    onInsert: (blocks: AIGeneratedBlocks) => void;
    onOps: (ops: AIBlockOps) => void;
  }) => void;
  reset: () => void;
}

let insertHandler: ((blocks: AIGeneratedBlocks) => void) | null = null;
let opsHandler: ((ops: AIBlockOps) => void) | null = null;

export const useAIAssistant = create<AIAssistantState>((set, get) => ({
  messages: [],
  running: false,
  lastInserted: null,
  lastOps: null,
  abortRef: null,

  sendPrompt: (prompt, ctx) => {
    const trimmed = prompt.trim();
    if (!trimmed || get().running) return;

    const abort = new AbortController();
    // Prior conversation (excluding the message being sent) so the assistant
    // can reference earlier exchanges.
    const history: AIChatTurn[] = get()
      .messages.filter((m) => m.text)
      .map((m) => ({ role: m.role, content: m.text }))
      .slice(-8);

    set((s) => ({
      running: true,
      abortRef: abort,
      lastInserted: null,
      lastOps: null,
      messages: [
        ...s.messages,
        { role: "user", text: trimmed, events: [], thinking: "", done: true },
        { role: "assistant", text: "", events: [], thinking: "", done: false },
      ],
    }));

    const latest: AIGeneratedBlocks = { learnBlocks: [], evaluateBlocks: [] };
    const latestOps: AIBlockOps = {};
    let finalText = "";
    let thinkingText = "";

    const patchLast = (updater: (m: AIChatMessage) => AIChatMessage) => {
      set((s) => {
        const msgs = [...s.messages];
        msgs[msgs.length - 1] = updater(msgs[msgs.length - 1]);
        return { messages: msgs };
      });
    };

    void streamAgentChat(
      {
        prompt: trimmed,
        grade: ctx.grade,
        language: ctx.language,
        waveContext: ctx.waveContext,
        images: ctx.images,
        history,
      },
      {
        signal: abort.signal,
        onEvent: (event) => {
          switch (event.type) {
            case "delta":
              finalText += event.message ?? "";
              patchLast((m) => ({ ...m, text: finalText, events: [...m.events, event] }));
              break;
            case "thinking":
              thinkingText += event.message ?? "";
              patchLast((m) => ({ ...m, thinking: thinkingText, events: [...m.events, event] }));
              break;
            case "tool_start":
            case "tool_end":
              patchLast((m) => ({ ...m, events: [...m.events, event] }));
              break;
            case "done": {
              if (event.learnBlocks?.length) latest.learnBlocks.push(...event.learnBlocks);
              if (event.evaluateBlocks?.length) latest.evaluateBlocks.push(...event.evaluateBlocks);
              if (event.blockOps?.deleteIDs?.length) {
                latestOps.deleteIDs = [...(latestOps.deleteIDs ?? []), ...event.blockOps.deleteIDs];
              }
              if (event.blockOps?.upsertLearn?.length) {
                latestOps.upsertLearn = [
                  ...(latestOps.upsertLearn ?? []),
                  ...event.blockOps.upsertLearn,
                ];
              }
              if (event.blockOps?.upsertEval?.length) {
                latestOps.upsertEval = [
                  ...(latestOps.upsertEval ?? []),
                  ...event.blockOps.upsertEval,
                ];
              }
              const count = (event.learnBlocks?.length ?? 0) + (event.evaluateBlocks?.length ?? 0);
              const summary = count
                ? `Added ${event.learnBlocks?.length ?? 0} Learn block(s) and ${event.evaluateBlocks?.length ?? 0} Evaluate block(s) to your editor.`
                : "";
              patchLast((m) => ({
                ...m,
                // Auto-inserted blocks are rendered in the editor; the chat
                // keeps a human summary instead of raw block syntax.
                text:
                  finalText && !/learnBlocks|evaluateBlocks/i.test(finalText)
                    ? finalText.trim()
                    : summary || "Done.",
                events: [...m.events, event],
                done: true,
              }));
              if (count > 0) {
                insertHandler?.({
                  learnBlocks: latest.learnBlocks,
                  evaluateBlocks: latest.evaluateBlocks,
                });
                set({
                  lastInserted: {
                    learnBlocks: latest.learnBlocks,
                    evaluateBlocks: latest.evaluateBlocks,
                  },
                });
              }
              const hasOps =
                (latestOps.deleteIDs?.length ?? 0) > 0 ||
                (latestOps.upsertLearn?.length ?? 0) > 0 ||
                (latestOps.upsertEval?.length ?? 0) > 0;
              if (hasOps) {
                opsHandler?.(latestOps);
                set({ lastOps: latestOps });
              }
              set({ running: false, abortRef: null });
              break;
            }
            case "error":
              patchLast((m) => ({
                ...m,
                text: m.text || "The assistant hit an error.",
                error: event.error || "Unknown AI error",
                events: [...m.events, event],
                done: true,
              }));
              set({ running: false, abortRef: null });
              break;
          }
        },
        onError: (message) => {
          patchLast((m) => ({
            ...m,
            text: m.text || "The assistant could not respond.",
            error: message,
            done: true,
          }));
          set({ running: false, abortRef: null });
        },
        onComplete: () => {
          set((s) => {
            const msgs = [...s.messages];
            const last = msgs[msgs.length - 1];
            if (last && last.role === "assistant" && !last.done) {
              msgs[msgs.length - 1] = { ...last, done: true };
            }
            return { messages: msgs, running: false, abortRef: null };
          });
        },
      },
    );
  },

  stop: () => {
    get().abortRef?.abort();
    set({ running: false, abortRef: null });
  },

  clearInserted: () => set({ lastInserted: null }),

  clearOps: () => set({ lastOps: null }),

  setHandlers: ({ onInsert, onOps }) => {
    insertHandler = onInsert;
    opsHandler = onOps;
  },

  reset: () =>
    set({ messages: [], running: false, lastInserted: null, lastOps: null, abortRef: null }),
}));
