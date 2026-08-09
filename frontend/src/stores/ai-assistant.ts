import { create } from "zustand";
import {
  type AgentEvent,
  streamAgentChat,
} from "@/lib/ai-chat";

export interface AIChatMessage {
  role: "user" | "assistant";
  text: string;
  events: AgentEvent[];
  done: boolean;
  error?: string;
}

export interface AIChatContext {
  waveContext?: string;
  grade?: string;
  language?: string;
  images?: string[]; // base64 data URLs of uploaded photos
}

export interface AIGeneratedBlocks {
  learnBlocks: NonNullable<AgentEvent["learnBlocks"]>;
  evaluateBlocks: NonNullable<AgentEvent["evaluateBlocks"]>;
}

interface AIAssistantState {
  messages: AIChatMessage[];
  running: boolean;
  lastGenerated: AIGeneratedBlocks | null;
  /** In-flight abort controller so "Stop" can cancel the stream. */
  abortRef: AbortController | null;

  sendPrompt: (prompt: string, ctx: AIChatContext) => void;
  stop: () => void;
  clearGenerated: () => void;
  /** Registers the wave editor's insert callback (set on mount). */
  setInsertHandler: (fn: (blocks: AIGeneratedBlocks) => void) => void;
  insertGenerated: () => void;
  reset: () => void;
}

let insertHandler: ((blocks: AIGeneratedBlocks) => void) | null = null;

export const useAIAssistant = create<AIAssistantState>((set, get) => ({
  messages: [],
  running: false,
  lastGenerated: null,
  abortRef: null,

  sendPrompt: (prompt, ctx) => {
    const trimmed = prompt.trim();
    if (!trimmed || get().running) return;

    const abort = new AbortController();
    set((s) => ({
      running: true,
      abortRef: abort,
      lastGenerated: null,
      messages: [
        ...s.messages,
        { role: "user", text: trimmed, events: [], done: true },
        { role: "assistant", text: "", events: [], done: false },
      ],
    }));

    const latest: AIGeneratedBlocks = { learnBlocks: [], evaluateBlocks: [] };
    let finalText = "";

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
      },
      {
        signal: abort.signal,
        onEvent: (event) => {
          switch (event.type) {
            case "delta":
              finalText += event.message ?? "";
              patchLast((m) => ({ ...m, text: finalText, events: [...m.events, event] }));
              break;
            case "tool_start":
            case "tool_end":
              patchLast((m) => ({ ...m, events: [...m.events, event] }));
              break;
            case "done": {
              if (event.learnBlocks?.length) latest.learnBlocks.push(...event.learnBlocks);
              if (event.evaluateBlocks?.length) latest.evaluateBlocks.push(...event.evaluateBlocks);
              const count =
                (event.learnBlocks?.length ?? 0) + (event.evaluateBlocks?.length ?? 0);
              const summary = count
                ? `Generated ${event.learnBlocks?.length ?? 0} Learn block(s) and ${event.evaluateBlocks?.length ?? 0} Evaluate block(s).`
                : "";
              patchLast((m) => ({
                ...m,
                text: finalText || event.message || summary || "Done.",
                events: [...m.events, event],
                done: true,
              }));
              set({
                running: false,
                abortRef: null,
                lastGenerated: {
                  learnBlocks: latest.learnBlocks,
                  evaluateBlocks: latest.evaluateBlocks,
                },
              });
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
          // Mark the last assistant message done if the stream ended without
          // a terminal event (e.g. abort).
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

  clearGenerated: () => set({ lastGenerated: null }),

  setInsertHandler: (fn) => {
    insertHandler = fn;
  },

  insertGenerated: () => {
    const { lastGenerated } = get();
    if (!lastGenerated) return;
    insertHandler?.(lastGenerated);
    set({ lastGenerated: null });
  },

  reset: () => set({ messages: [], running: false, lastGenerated: null, abortRef: null }),
}));
