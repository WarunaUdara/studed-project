import { Loader2, Play, RotateCcw } from "lucide-react";
import { useState } from "react";
import type { PythonRunnerConfig } from "@/lib/content/interactiveBlocks";
import { parseBlockConfig } from "@/lib/content/interactiveBlocks";
import { describeRun, runPython, type RunCodeResult } from "@/lib/code-runner";
import { playClickSound, playErrorSound, playSuccessSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface PythonRunnerBlockProps {
  /** Starter code the student begins from. */
  content: string;
  metadata?: string | object | null;
}

/**
 * A Python exercise the student actually runs.
 *
 * Errors are shown exactly as Python wrote them, traceback and all. A learner
 * who never meets a real NameError never learns to read one, so nothing here
 * softens or rewrites the message; the panel only says which part to read.
 */
export function PythonRunnerBlock({ content, metadata }: PythonRunnerBlockProps) {
  const config = parseBlockConfig<PythonRunnerConfig>(metadata);
  const starter = config?.starterCode ?? content;

  const [code, setCode] = useState(starter);
  const [result, setResult] = useState<RunCodeResult | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const run = async () => {
    playClickSound();
    setRunning(true);
    setFailure(null);

    const response = await runPython({ code, stdin: config?.stdin });
    setRunning(false);

    if (!response.ok) {
      setResult(null);
      setFailure(response.failure.error);
      playErrorSound();
      return;
    }

    setResult(response.result);
    if (response.result.exitCode === 0 && !response.result.timedOut) {
      playSuccessSound();
    } else {
      playErrorSound();
    }
  };

  const reset = () => {
    playClickSound();
    setCode(starter);
    setResult(null);
    setFailure(null);
  };

  const summary = result ? describeRun(result) : null;

  return (
    <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      {config?.title && <p className="text-sm font-semibold text-foreground">{config.title}</p>}
      {config?.instruction && <p className="text-sm text-muted-foreground">{config.instruction}</p>}

      <label htmlFor="python-runner-code" className="sr-only">
        Your Python program
      </label>
      <textarea
        id="python-runner-code"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        spellCheck={false}
        rows={Math.min(18, Math.max(6, code.split("\n").length + 1))}
        className={cn(
          "w-full resize-y rounded-xl border bg-background p-3 font-mono text-sm text-foreground",
          "outline-none focus:ring-2 focus:ring-primary/40",
        )}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void run()}
          disabled={running || code.trim().length === 0}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary bg-primary/10 px-4 py-2.5",
            "text-sm font-semibold text-foreground transition-colors hover:bg-primary/20",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {running ? "Running" : "Run"}
        </button>

        <button
          type="button"
          onClick={reset}
          disabled={running}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium",
            "text-muted-foreground transition-colors hover:bg-muted",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          <RotateCcw className="h-4 w-4" /> Start over
        </button>

        {config?.hint && <p className="text-sm text-muted-foreground">{config.hint}</p>}
      </div>

      <div aria-live="polite" className="space-y-2">
        {failure && (
          <p className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">
            {failure}
          </p>
        )}

        {summary && (
          <p
            className={cn(
              "rounded-xl border p-3 text-sm font-medium",
              summary.tone === "success" && "border-success/40 bg-success/10 text-success",
              summary.tone === "error" && "border-destructive/40 bg-destructive/10 text-destructive",
              summary.tone === "warning" && "border-warning/40 bg-warning/10 text-foreground",
            )}
          >
            {summary.message}
          </p>
        )}

        {result?.stdout && (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Your program printed</p>
            <pre className="overflow-x-auto rounded-xl border bg-muted/40 p-3 font-mono text-sm text-foreground">
              {result.stdout}
            </pre>
          </div>
        )}

        {result?.stderr && (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-destructive">Python said</p>
            <pre className="overflow-x-auto rounded-xl border border-destructive/40 bg-destructive/5 p-3 font-mono text-sm text-destructive">
              {result.stderr}
            </pre>
          </div>
        )}

        {result?.truncated && (
          <p className="text-sm text-muted-foreground">
            That printed more than fits here, so only the first part is shown.
          </p>
        )}
      </div>
    </section>
  );
}
