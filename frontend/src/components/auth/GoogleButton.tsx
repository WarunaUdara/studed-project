import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "urql";
import { Button } from "@/components/ui/button";
import { GOOGLE_LOGIN_MUTATION } from "@/graphql/auth";
import { sanitizeError } from "@/lib/errors";
import { useAuthStore } from "@/stores/auth";

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const PENDING_LOGIN_KEY = "studed_google_pkce";

interface GoogleButtonProps {
  className?: string;
  onSuccess?: () => void;
}

interface PendingLogin {
  state: string;
  verifier: string;
}

export function GoogleButton({ className, onSuccess }: GoogleButtonProps) {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const [, googleLogin] = useMutation(GOOGLE_LOGIN_MUTATION);
  const popupRef = useRef<Window | null>(null);
  const timerRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
      popupRef.current?.close();
    };
  }, []);

  const startLogin = async () => {
    if (isLoading) return;
    setError(null);

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Google sign-in is not configured for this environment.");
      return;
    }

    const popup = window.open(
      "about:blank",
      "studed-google-auth",
      "popup,width=500,height=650,resizable=yes,scrollbars=yes",
    );
    if (!popup) {
      setError("Your browser blocked the Google sign-in window. Allow popups and try again.");
      return;
    }

    const verifier = createVerifier();
    const challenge = await createChallenge(verifier);
    const state = crypto.randomUUID();
    const pending: PendingLogin = { state, verifier };
    sessionStorage.setItem(PENDING_LOGIN_KEY, JSON.stringify(pending));

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: window.location.origin,
      response_type: "code",
      scope: "openid email profile",
      code_challenge: challenge,
      code_challenge_method: "S256",
      state,
      prompt: "select_account",
    });

    popup.location.href = `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
    popupRef.current = popup;
    setIsLoading(true);
    timerRef.current = window.setInterval(() => {
      if (popup.closed) {
        stopPolling();
        setIsLoading(false);
        setError("Google sign-in was cancelled.");
        return;
      }

      try {
        if (popup.location.origin !== window.location.origin) return;

        const callbackURL = new URL(popup.location.href);
        if (!callbackURL.searchParams.has("code") && !callbackURL.searchParams.has("error")) {
          return;
        }

        stopPolling();
        popup.close();
        void finishLogin(callbackURL.searchParams, pending);
      } catch {
        // The popup is still on Google's origin and cannot be inspected yet.
      }
    }, 100);
  };

  const finishLogin = async (params: URLSearchParams, pending: PendingLogin) => {
    setIsLoading(true);
    if (params.get("state") !== pending.state) {
      sessionStorage.removeItem(PENDING_LOGIN_KEY);
      setIsLoading(false);
      setError("Google sign-in could not be verified. Please try again.");
      return;
    }

    const code = params.get("code");
    if (!code) {
      sessionStorage.removeItem(PENDING_LOGIN_KEY);
      setIsLoading(false);
      setError("Google sign-in was not completed.");
      return;
    }

    const result = await googleLogin({
      input: { code, codeVerifier: pending.verifier },
    });
    sessionStorage.removeItem(PENDING_LOGIN_KEY);

    if (result.error) {
      setIsLoading(false);
      setError(sanitizeError(result.error).message);
      return;
    }

    const user = result.data?.googleLogin?.user;
    if (!user) {
      setIsLoading(false);
      setError("Google sign-in did not return a user account.");
      return;
    }

    setUser(user);
    onSuccess?.();
    setIsLoading(false);
    if (user.role === "EDUCATOR" || user.role === "HEAD_EDUCATOR" || user.role === "ADMIN") {
      navigate({ to: "/educator/courses" });
    } else {
      navigate({ to: "/dashboard" });
    }
  };

  const stopPolling = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <div className="w-full">
      <Button
        type="button"
        variant="outline"
        onClick={startLogin}
        disabled={isLoading}
        aria-busy={isLoading}
        className={className}
      >
        <GoogleMark />
        {isLoading ? "Connecting to Google..." : "Continue with Google"}
      </Button>
      {error && <p className="mt-2 text-center text-sm text-destructive">{error}</p>}
    </div>
  );
}

function createVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64URL(bytes);
}

async function createChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64URL(new Uint8Array(digest));
}

function base64URL(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3.01h3.88c2.27-2.09 3.58-5.17 3.58-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.28a7.2 7.2 0 0 1 0-4.56V6.61H1.28a12 12 0 0 0 0 10.78l4.01-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.61l4.01 3.11C6.23 6.88 8.88 4.77 12 4.77Z"
      />
    </svg>
  );
}
