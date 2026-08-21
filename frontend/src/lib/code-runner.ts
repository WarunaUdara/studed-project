/**
 * Client for the server-side Python sandbox.
 *
 * Student code runs on the ai-service, not in the browser: the deadline,
 * memory ceiling and stripped environment are enforced somewhere a student
 * cannot edit them, and the page stays light instead of shipping a Python
 * runtime to every device.
 */

export interface RunCodeRequest {
  code: string;
  stdin?: string;
}

export interface RunCodeResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
  durationMs: number;
  truncated: boolean;
}

export interface RunCodeFailure {
  /** A message written for a child, not a status code. */
  error: string;
}

export type RunCodeResponse =
  | { ok: true; result: RunCodeResult }
  | { ok: false; failure: RunCodeFailure };

export async function runPython(
  request: RunCodeRequest,
  signal?: AbortSignal,
): Promise<RunCodeResponse> {
  let response: Response;
  try {
    response = await fetch("/code/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(request),
      signal,
    });
  } catch {
    return {
      ok: false,
      failure: { error: "Could not reach the code runner. Check your connection and try again." },
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { ok: false, failure: { error: "The code runner sent something unreadable." } };
  }

  // A crashing program is a successful run: the traceback is the result.
  if (response.ok && isRunResult(payload)) {
    return { ok: true, result: payload };
  }

  const message =
    typeof payload === "object" &&
    payload !== null &&
    typeof (payload as { error?: unknown }).error === "string"
      ? (payload as { error: string }).error
      : "The program could not be run.";
  return { ok: false, failure: { error: message } };
}

function isRunResult(payload: unknown): payload is RunCodeResult {
  return (
    typeof payload === "object" &&
    payload !== null &&
    typeof (payload as RunCodeResult).stdout === "string" &&
    typeof (payload as RunCodeResult).stderr === "string"
  );
}

/**
 * Turns a result into the one line shown above the output, so the panel does
 * not have to re-derive "did this work" from three fields.
 */
export function describeRun(result: RunCodeResult): {
  tone: "success" | "error" | "warning";
  message: string;
} {
  if (result.timedOut) {
    return { tone: "warning", message: "Your program ran too long and was stopped." };
  }
  if (result.exitCode !== 0) {
    return {
      tone: "error",
      message: "Your program stopped with an error. Read the red text below.",
    };
  }
  if (result.stdout.trim() === "") {
    return { tone: "warning", message: "It ran with no errors, but it did not print anything." };
  }
  return { tone: "success", message: `It ran in ${result.durationMs} ms.` };
}
