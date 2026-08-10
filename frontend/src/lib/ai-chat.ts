// Streaming client for the educator AI assistant (/ai/chat SSE proxy).
//
// The gateway streams agent events from the ai-service as SSE lines:
//   data: {"type":"plan"|"tool_start"|"tool_end"|"delta"|"done"|"error", ...}
//
// This module parses the stream with a plain fetch() + ReadableStream
// reader (no SSE library needed) and invokes the callbacks as events land,
// so the chat panel can render progress in real time.

export interface AgentEvent {
  type: "plan" | "ocr" | "tool_start" | "tool_end" | "delta" | "thinking" | "done" | "error";
  tool?: string;
  message?: string;
  learnBlocks?: Array<{ id: string; type: string; content: string; metadata?: string | null }>;
  evaluateBlocks?: Array<{
    id: string;
    type: string;
    question: string;
    options?: string[] | null;
    correctAnswer?: string;
    explanation?: string;
  }>;
  blockOps?: {
    upsertLearn?: Array<{ id: string; type: string; content: string; metadata?: string | null }>;
    upsertEval?: Array<{
      id: string;
      type: string;
      question: string;
      options?: string[] | null;
      correctAnswer?: string;
      explanation?: string;
    }>;
    deleteIDs?: string[];
  };
  error?: string;
}

export interface AIChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AIChatRequest {
  prompt: string;
  language?: string;
  grade?: string;
  waveContext?: string;
  /** Base64 data URLs of uploaded images; OCR'd (high effort) server-side. */
  images?: string[];
  /** Prior conversation turns so the assistant can respond in context. */
  history?: AIChatTurn[];
}

export interface AIChatHandlers {
  onEvent: (event: AgentEvent) => void;
  onError: (message: string) => void;
  onComplete: () => void;
  signal?: AbortSignal;
}

// streamAgentChat POSTs the prompt to /ai/chat and parses the SSE stream,
// calling onEvent for every agent event. Resolves when the stream ends.
export async function streamAgentChat(request: AIChatRequest, handlers: AIChatHandlers): Promise<void> {
  const { onEvent, onError, onComplete, signal } = handlers;

  let response: Response;
  try {
    response = await fetch("/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(request),
      signal,
    });
  } catch (err) {
    onError(
      err instanceof DOMException && err.name === "AbortError"
        ? "Request cancelled."
        : "Could not reach the AI service. Is the backend running?",
    );
    return;
  }

  if (!response.ok) {
    let detail = `AI request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body?.error) detail = body.error;
    } catch {
      // non-JSON error body; keep the generic message
    }
    onError(detail);
    return;
  }

  if (!response.body) {
    onError("AI service returned an empty response.");
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const payload = trimmed.slice("data: ".length).trim();
        if (!payload) continue;
        try {
          const event = JSON.parse(payload) as AgentEvent;
          onEvent(event);
        } catch {
          // malformed SSE payload — ignore and keep streaming
        }
      }
    }
  } catch (err) {
    if (!(err instanceof DOMException && err.name === "AbortError")) {
      onError("Stream interrupted while reading the AI response.");
    }
    return;
  } finally {
    reader.releaseLock();
  }

  onComplete();
}
