import { Link } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useId, useState } from "react";
import { useLoginForm } from "@/components/auth/useLoginForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Progress } from "@/components/ui/Progress";

/**
 * Full-page login card.
 *
 * Like `LoginBrandPanel`, all colour comes from the theme-aware `login-*` token
 * pairs in index.css, so there is no light/dark branching here. Green *text* and
 * the CTA fill use `login-accent` / `login-cta` rather than `brand-green`, which
 * is too light to carry text or a white label on a light background.
 * Auth behaviour lives in `useLoginForm` and is shared with the navbar modal.
 */

/** Hexagon mask for the level badge, matching the comp's beveled badge. */
const HEX_CLIP = "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";

const LEVEL = 12;
const XP_CURRENT = 350;
const XP_TARGET = 500;

/**
 * Shared field chrome: dark fill, hairline border, room for the leading icon.
 * Placeholders are /60 rather than /40 — they are read as content, so they are
 * held to the same 4.5:1 bar as body copy on this dark fill.
 */
const FIELD_CLASSNAME =
  "h-12 rounded-2xl border-login-field-border bg-login-field pl-11 text-login-ink placeholder:text-login-ink-soft focus-visible:ring-2 focus-visible:ring-login-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

/** Green, offset focus ring for controls sitting on the dark card. */
const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-login-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

export function LoginAuthCard() {
  const emailId = useId();
  const passwordId = useId();
  const [showPassword, setShowPassword] = useState(false);
  const { registerField, submit, errors, isSubmitting, error } = useLoginForm();

  return (
    // Tighter gutters below sm: at 375px the full-width Google button's label
    // plus its "Coming soon" suffix overflows an 8-unit inset.
    <div className="relative rounded-lg border border-login-card-border bg-login-card p-6 pt-14 shadow-login-card backdrop-blur-xl sm:p-8 sm:pt-16">
      {/* Peeking mascot. Anchored to the card, and deliberately not inside any
          overflow-hidden ancestor so it can break the top edge. Sized against
          the tight-cropped art: roughly a third of it overlaps the card, which
          is what makes it read as leaning rather than hovering. */}
      <img
        src="/covers/mascot/mascot-peek.png"
        alt=""
        aria-hidden="true"
        width={1536}
        height={1024}
        className="animate-float-slow pointer-events-none absolute -top-12 left-1/2 w-28 -translate-x-1/2 select-none lg:-top-16 lg:w-36"
      />

      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-login-ink">
          Welcome <span className="text-login-accent">back!</span>
        </h1>
        <p className="mt-1.5 text-sm text-login-ink-muted">
          Sign in to continue your learning journey
        </p>
      </div>

      <LevelStrip />

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor={emailId} className="text-sm font-semibold text-login-ink">
            Email
          </Label>
          <div className="relative">
            <Mail
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-login-ink-faint"
            />
            <Input
              id={emailId}
              type="email"
              placeholder="you@example.com"
              className={FIELD_CLASSNAME}
              {...registerField("email")}
            />
          </div>
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor={passwordId} className="text-sm font-semibold text-login-ink">
            Password
          </Label>
          <div className="relative">
            <Lock
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-login-ink-faint"
            />
            <Input
              id={passwordId}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className={`${FIELD_CLASSNAME} pr-12`}
              {...registerField("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className={`absolute top-1/2 right-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-login-ink-muted transition-colors hover:text-login-ink ${FOCUS_RING}`}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            disabled
            title="Password reset is coming soon"
            className="cursor-not-allowed text-xs font-semibold text-login-accent/70"
          >
            Forgot password? <span className="font-normal text-login-ink-soft">· Coming soon</span>
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Button wraps its children in a content-width span, so the arrow would
            anchor to the label rather than the button edge. Stretching that
            wrapper to full width gives the arrow the button's right edge to sit
            against, and keeps it inside the press animation. */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className={`h-13 w-full border-login-cta-border bg-login-cta text-base text-login-cta-ink shadow-none hover:bg-login-cta-hover [&>span:first-child]:w-full ${FOCUS_RING}`}
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
          <span
            aria-hidden="true"
            className="absolute top-1/2 right-0 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-login-cta-pip"
          >
            <ArrowRight className="size-4 text-login-cta-pip-ink" />
          </span>
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span aria-hidden="true" className="h-px flex-1 bg-login-line" />
        <span className="text-xs text-login-ink-faint">or</span>
        <span aria-hidden="true" className="h-px flex-1 bg-login-line" />
      </div>

      <Button
        type="button"
        variant="outline"
        disabled
        title="Google sign-in is coming soon"
        className={`h-12 w-full border-login-line bg-login-field text-sm text-login-ink shadow-none ${FOCUS_RING}`}
      >
        <GoogleMark />
        Continue with Google
        {/* Abbreviated below sm, where the full suffix overflows the button. */}
        <span className="text-xs font-normal text-login-ink-soft">
          <span className="sm:hidden">· Soon</span>
          <span className="hidden sm:inline">· Coming soon</span>
        </span>
      </Button>

      <p className="mt-6 text-center text-sm text-login-ink-muted">
        Don't have an account?{" "}
        <Link
          to="/register"
          className={`rounded-sm font-semibold text-login-accent hover:underline ${FOCUS_RING}`}
        >
          Create one
        </Link>
      </p>
    </div>
  );
}

function LevelStrip() {
  return (
    <div className="mt-6 flex items-center gap-3 rounded-2xl border border-login-inset-border bg-login-inset p-3">
      {/* Green rim + dark core, both hexagons. */}
      <span
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center bg-login-hex-rim"
        style={{ clipPath: HEX_CLIP }}
      >
        <span
          className="flex size-11 items-center justify-center bg-login-hex-core text-base font-extrabold text-login-hex-ink"
          style={{ clipPath: HEX_CLIP }}
        >
          {LEVEL}
        </span>
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-login-ink">Keep going!</span>
          <span className="text-xs font-medium text-login-ink-muted">
            {XP_CURRENT} / {XP_TARGET} XP
          </span>
        </div>
        <Progress
          value={XP_CURRENT}
          max={XP_TARGET}
          className="mt-2 h-2 bg-login-line [&>div]:bg-login-accent"
          aria-label={`Level ${LEVEL} progress: ${XP_CURRENT} of ${XP_TARGET} XP`}
        />
      </div>
    </div>
  );
}

/** Google's mark is a fixed brand asset, so its colours are literal by nature. */
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
