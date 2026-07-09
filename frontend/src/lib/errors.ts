/**
 * Error sanitization — maps raw backend/GraphQL errors to friendly user messages.
 * Never exposes internal service names, gRPC error strings, or stack traces.
 */

const FRIENDLY_MAP: Array<{ test: RegExp; title: string; message: string }> = [
  {
    test: /network|fetch|ECONNREFUSED|connection/i,
    title: "Connection problem",
    message: "We couldn't reach the server. Check your internet and try again.",
  },
  {
    test: /unauthor|401|expired/i,
    title: "Session expired",
    message: "Your session has expired. Please sign in again.",
  },
  {
    test: /forbidden|403/i,
    title: "Access denied",
    message: "You don't have permission to do that.",
  },
  {
    test: /not found|404/i,
    title: "Not found",
    message: "We couldn't find what you were looking for.",
  },
  {
    test: /rate.?limit|429/i,
    title: "Too many requests",
    message: "You're going too fast! Please wait a moment and try again.",
  },
  {
    test: /server error|500|502|503/i,
    title: "Server issue",
    message: "Something went wrong on our end. We're on it — try again shortly.",
  },
  {
    test: /timeout/i,
    title: "Request timed out",
    message: "The request took too long. Please try again.",
  },
  {
    test: /invalid credentials|wrong password/i,
    title: "Sign-in failed",
    message: "That email or password doesn't match our records.",
  },
  {
    test: /email already registered/i,
    title: "Account exists",
    message: "An account with this email already exists. Try signing in instead.",
  },
  {
    test: /already enrolled/i,
    title: "Already enrolled",
    message: "You're already enrolled in this course.",
  },
  {
    test: /max.?reattempts|no reattempts/i,
    title: "No attempts left",
    message: "You've used all your attempts for this wave.",
  },
  {
    test: /not enrolled/i,
    title: "Enrollment required",
    message: "You need to enroll in this course first.",
  },
];

export interface FriendlyError {
  title: string;
  message: string;
}

export function sanitizeError(raw: unknown): FriendlyError {
  const rawStr =
    typeof raw === "string" ? raw : raw instanceof Error ? raw.message : String(raw ?? "");

  for (const { test, title, message } of FRIENDLY_MAP) {
    if (test.test(rawStr)) return { title, message };
  }

  return {
    title: "Something went wrong",
    message: "An unexpected error occurred. Please try again.",
  };
}

export function sanitizeGraphQLError(
  error: { message?: string; graphQLErrors?: Array<{ message?: string }> } | null | undefined,
): FriendlyError {
  if (!error) return { title: "Something went wrong", message: "An unexpected error occurred." };
  const gqlMsg = error.graphQLErrors?.map((e) => e.message).join("; ") ?? error.message ?? "";
  return sanitizeError(gqlMsg);
}
