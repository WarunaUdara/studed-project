import { useGSAP } from "@gsap/react";
import { JellyBlobMascot } from "feral-blob";
import { gsap } from "gsap";
import { CornerLeftUp, Send, X } from "lucide-react";
import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";
import "feral-blob/blob.css";
import { streamStudentAsk } from "@/lib/ai-chat";
import { useReducedMotion } from "@/lib/motion";
import { playClickSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { DEFAULT_PANEL, type PanelSize, resizeFromCorner } from "./lessonChatSize";

interface LessonChatPanelProps {
  waveTitle: string;
  /** Lesson text the assistant should answer from. */
  waveContext: string;
  grade?: string;
  language?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const GREETING =
  "Hi! I am Blobby. Ask me anything about this lesson and I will explain it in a simple way.";

/**
 * The student's helper for the current wave.
 *
 * It sits out of the way as a small button and opens into a panel the student
 * can resize by dragging its top left corner, because a child reading a long
 * answer on a tablet needs a bigger box than one asking a quick question.
 */
export function LessonChatPanel({ waveTitle, waveContext, grade, language }: LessonChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<PanelSize>(DEFAULT_PANEL);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (!open || !panelRef.current) return;
      if (reducedMotion) {
        gsap.set(panelRef.current, { opacity: 1, y: 0, scale: 1 });
        return;
      }
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, y: 20, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.34, ease: "power3.out" },
      );
    },
    { dependencies: [open, reducedMotion] },
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, []);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const startResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const startSize = size;
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);

    const onMove = (moveEvent: PointerEvent) => {
      setSize(
        resizeFromCorner(startSize, moveEvent.clientX - startX, moveEvent.clientY - startY, {
          width: window.innerWidth,
          height: window.innerHeight,
        }),
      );
    };
    const onUp = () => {
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", onUp);
    };

    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", onUp);
  };

  const send = async () => {
    const prompt = input.trim();
    if (!prompt || streaming) return;

    playClickSound();
    setInput("");
    const turnId = nanoid(6);
    setMessages((prev) => [
      ...prev,
      { id: `q-${turnId}`, role: "user" as const, content: prompt },
      { id: `a-${turnId}`, role: "assistant" as const, content: "" },
    ]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const appendToAnswer = (text: string) => {
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === "assistant")
          next[next.length - 1] = { ...last, content: last.content + text };
        return next;
      });
    };

    await streamStudentAsk(
      {
        prompt,
        grade,
        language,
        waveContext,
        history: messages.map((message) => ({ role: message.role, content: message.content })),
      },
      {
        onEvent: (event) => {
          if (event.type === "delta" && event.message) appendToAnswer(event.message);
        },
        onError: () =>
          appendToAnswer(
            "I cannot reach my brain right now. Try again in a moment, and keep exploring the lesson meanwhile.",
          ),
        onComplete: () => setStreaming(false),
        signal: controller.signal,
      },
    );
    setStreaming(false);
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          playClickSound();
          setOpen(true);
        }}
        className={cn(
          "fixed bottom-5 right-5 z-40 flex min-h-14 items-center gap-2 rounded-2xl border border-primary/40",
          "bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-lg transition-colors hover:bg-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <span className="h-8 w-8">
          <JellyBlobMascot mood="happy" happyEyes="smile" />
        </span>
        Ask Blobby
      </button>
    );
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={`Ask about ${waveTitle}`}
      style={{ width: size.width, height: size.height }}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
      className="fixed bottom-5 right-5 z-40 flex flex-col overflow-hidden rounded-2xl border bg-card shadow-xl"
    >
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <button
          type="button"
          onPointerDown={startResize}
          aria-label="Drag to resize the chat panel"
          className={cn(
            "flex h-11 w-11 cursor-nwse-resize items-center justify-center rounded-xl text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <CornerLeftUp className="h-4 w-4" />
        </button>
        <p className="flex-1 truncate text-sm font-semibold text-foreground">Ask Blobby</p>
        <button
          type="button"
          onClick={() => {
            playClickSound();
            setOpen(false);
          }}
          aria-label="Close the chat panel"
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors",
            "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
        <p className="rounded-xl bg-primary/5 p-3 text-sm text-foreground">{GREETING}</p>
        {messages.map((message) => (
          <p
            key={message.id}
            className={cn(
              "max-w-[85%] rounded-xl p-3 text-sm",
              message.role === "user"
                ? "ml-auto bg-primary/10 text-foreground"
                : "bg-muted text-foreground",
            )}
          >
            {message.content || (streaming ? "Thinking..." : "")}
          </p>
        ))}
      </div>

      <div className="flex items-end gap-2 border-t p-3">
        <label htmlFor="lesson-chat-input" className="sr-only">
          Ask a question about this lesson
        </label>
        <input
          id="lesson-chat-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void send();
          }}
          placeholder="What do you want to know?"
          className={cn(
            "h-11 flex-1 rounded-xl border bg-background px-3 text-sm text-foreground",
            "outline-none focus:ring-2 focus:ring-primary/40",
          )}
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={streaming || input.trim().length === 0}
          aria-label="Send your question"
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl border border-primary bg-primary/10",
            "text-foreground transition-colors hover:bg-primary/20",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
