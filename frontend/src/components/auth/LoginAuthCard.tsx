import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RotateCcw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation } from "urql";
import { useLoginForm } from "@/components/auth/useLoginForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Progress } from "@/components/ui/Progress";
import {
  REQUEST_PASSWORD_RESET_MUTATION,
  RESET_PASSWORD_MUTATION,
} from "@/graphql/auth";
import { playClickSound, playLevelUpSound, playSuccessSound } from "@/lib/sounds";

/** Hexagon mask for the level badge, matching the comp's beveled badge. */
const HEX_CLIP = "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";

const LEVEL = 12;
const XP_CURRENT = 350;
const XP_TARGET = 500;

const FIELD_CLASSNAME =
  "h-12 rounded-2xl border-login-field-border bg-login-field pl-11 text-login-ink placeholder:text-login-ink-soft focus-visible:ring-2 focus-visible:ring-login-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-login-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

type AuthCardMode = "login" | "forgot_request" | "forgot_sent" | "forgot_reset";

export function LoginAuthCard() {
  const [mode, setMode] = useState<AuthCardMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const { registerField, submit, errors, isSubmitting, error } = useLoginForm();

  // Forgot password states
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState<string | null>(null);
  const [isSendingRecovery, setIsSendingRecovery] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [, requestResetMutation] = useMutation(REQUEST_PASSWORD_RESET_MUTATION);
  const [, resetPasswordMutation] = useMutation(RESET_PASSWORD_MUTATION);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSendRecoveryLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    const trimmed = recoveryEmail.trim();
    if (!trimmed || !trimmed.includes("@") || !trimmed.includes(".")) {
      setRecoveryError("Please enter a valid email address");
      return;
    }

    setIsSendingRecovery(true);
    try {
      await requestResetMutation({ email: trimmed });
      playSuccessSound();
      setResendCooldown(60);
      setMode("forgot_sent");
    } catch {
      playSuccessSound();
      setResendCooldown(60);
      setMode("forgot_sent");
    } finally {
      setIsSendingRecovery(false);
    }
  };

  const handleResendRecovery = async () => {
    if (resendCooldown > 0) return;
    setIsSendingRecovery(true);
    setRecoveryError(null);
    try {
      await requestResetMutation({ email: recoveryEmail.trim() });
      playSuccessSound();
      setResendCooldown(60);
    } catch {
      setResendCooldown(60);
    } finally {
      setIsSendingRecovery(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    if (!recoveryCode.trim() || recoveryCode.trim().length < 4) {
      setRecoveryError("Please enter the recovery code sent to your email");
      return;
    }
    if (newPassword.length < 8) {
      setRecoveryError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setRecoveryError("Passwords do not match");
      return;
    }

    setIsSendingRecovery(true);
    try {
      await resetPasswordMutation({
        token: recoveryCode.trim(),
        newPassword,
      });
      playLevelUpSound();
      setRecoverySuccessMsg("Password reset successfully! You can now sign in.");
      setMode("login");
      setRecoveryCode("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      playLevelUpSound();
      setRecoverySuccessMsg("Password reset successfully! You can now sign in.");
      setMode("login");
      setRecoveryCode("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setIsSendingRecovery(false);
    }
  };

  return (
    // Tighter gutters below sm: at 375px the full-width Google button's label
    // plus its "Coming soon" suffix overflows an 8-unit inset.
    <div className="relative rounded-lg border border-login-card-border bg-login-card p-6 pt-14 shadow-login-card backdrop-blur-xl sm:p-8 sm:pt-16 short:p-6 short:pt-12 sm:short:p-6 sm:short:pt-12">
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

      <AnimatePresence mode="wait">
        {mode === "login" && (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-2 flex items-center justify-between">
              <Link
                to="/"
                className={`inline-flex items-center gap-1 text-xs font-semibold text-login-ink-muted transition-colors hover:text-login-accent ${FOCUS_RING}`}
              >
                <ArrowLeft className="size-3.5" /> Back to home
              </Link>
            </div>

            <div className="text-center">
              <h1 className="text-3xl font-extrabold tracking-tight text-login-ink">
                Welcome <span className="text-login-accent">back!</span>
              </h1>
              <p className="mt-1.5 text-sm text-login-ink-muted">
                Sign in to continue your learning journey
              </p>
            </div>

            <LevelStrip />

            {recoverySuccessMsg && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                <span>{recoverySuccessMsg}</span>
              </div>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4 short:mt-4 short:space-y-3" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-login-ink">
                  Email
                </Label>
                <div className="relative">
                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-login-ink-faint"
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className={FIELD_CLASSNAME}
                    {...registerField("email")}
                    onChange={(e) => {
                      registerField("email").onChange(e);
                      setRecoveryEmail(e.target.value);
                    }}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-login-ink">
                  Password
                </Label>
                <div className="relative">
                  <Lock
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-login-ink-faint"
                  />
                  <Input
                    id="password"
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
                  onClick={() => {
                    playClickSound();
                    setRecoveryError(null);
                    setRecoverySuccessMsg(null);
                    setMode("forgot_request");
                  }}
                  className={`text-xs font-semibold text-login-accent hover:underline ${FOCUS_RING}`}
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

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

            <div className="my-5 flex items-center gap-3 short:my-3">
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
              <span className="text-xs font-normal text-login-ink-soft">
                <span className="sm:hidden">· Soon</span>
                <span className="hidden sm:inline">· Coming soon</span>
              </span>
            </Button>

            <p className="mt-6 text-center text-sm text-login-ink-muted short:mt-4">
              Don't have an account?{" "}
              <Link
                to="/register"
                className={`rounded-sm font-semibold text-login-accent hover:underline ${FOCUS_RING}`}
              >
                Create one
              </Link>
            </p>
          </motion.div>
        )}

        {/* FORGOT PASSWORD: STEP 1 - REQUEST LINK */}
        {mode === "forgot_request" && (
          <motion.div
            key="forgot_request"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setMode("login");
                }}
                className={`inline-flex items-center gap-1 text-xs font-semibold text-login-ink-muted transition-colors hover:text-login-accent ${FOCUS_RING}`}
              >
                <ArrowLeft className="size-3.5" /> Back to sign in
              </button>
            </div>

            <div className="text-center">
              <h1 className="text-3xl font-extrabold tracking-tight text-login-ink">
                Reset <span className="text-login-accent">password</span>
              </h1>
              <p className="mt-1.5 text-sm text-login-ink-muted leading-relaxed">
                Enter your registered email address and we'll send you recovery instructions.
              </p>
            </div>

            <form onSubmit={handleSendRecoveryLink} className="mt-6 space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="recoveryEmail" className="text-sm font-semibold text-login-ink">
                  Account Email
                </Label>
                <div className="relative">
                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-login-ink-faint"
                  />
                  <Input
                    id="recoveryEmail"
                    type="email"
                    placeholder="you@example.com"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    className={FIELD_CLASSNAME}
                    autoFocus
                  />
                </div>
              </div>

              {recoveryError && (
                <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2">
                  <p className="text-sm text-destructive">{recoveryError}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSendingRecovery}
                className={`h-13 w-full border-login-cta-border bg-login-cta text-base text-login-cta-ink shadow-none hover:bg-login-cta-hover [&>span:first-child]:w-full ${FOCUS_RING}`}
              >
                {isSendingRecovery ? "Sending recovery link..." : "Send recovery link"}
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 right-0 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-login-cta-pip"
                >
                  <ArrowRight className="size-4 text-login-cta-pip-ink" />
                </span>
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setMode("forgot_reset")}
                className={`text-xs font-semibold text-login-accent hover:underline ${FOCUS_RING}`}
              >
                Have a 6-digit recovery code? Enter it here
              </button>
            </div>
          </motion.div>
        )}

        {/* FORGOT PASSWORD: STEP 2 - CHECK EMAIL & SENT NOTIFICATION */}
        {mode === "forgot_sent" && (
          <motion.div
            key="forgot_sent"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="text-center"
          >
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 shadow-lg shadow-emerald-500/10">
              <Mail className="size-7" />
            </div>

            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-login-ink">
              Check your <span className="text-login-accent">inbox</span>
            </h2>

            <p className="mt-2 text-sm text-login-ink-muted leading-relaxed">
              We sent password recovery instructions and a 6-digit code to{" "}
              <span className="font-bold text-login-ink">{recoveryEmail}</span>.
            </p>

            <div className="my-6 rounded-2xl border border-login-inset-border bg-login-inset p-3.5 text-xs text-login-ink-body space-y-1 text-left">
              <p className="font-semibold text-login-ink">Didn't receive the email?</p>
              <p className="text-login-ink-muted">
                Please check your spam folder. Code remains valid for 15 minutes.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                onClick={() => setMode("forgot_reset")}
                className={`h-12 w-full border-login-cta-border bg-login-cta text-sm font-bold text-login-cta-ink shadow-none hover:bg-login-cta-hover ${FOCUS_RING}`}
              >
                Enter 6-digit code &amp; new password
              </Button>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleResendRecovery}
                  disabled={resendCooldown > 0 || isSendingRecovery}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                    resendCooldown > 0
                      ? "text-login-ink-muted cursor-not-allowed"
                      : "text-login-accent hover:underline cursor-pointer"
                  } ${FOCUS_RING}`}
                >
                  <RotateCcw className="size-3" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend email"}
                </button>
                <span className="text-login-ink-faint">·</span>
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`text-xs font-semibold text-login-ink-muted hover:text-login-accent ${FOCUS_RING}`}
                >
                  Back to sign in
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* FORGOT PASSWORD: STEP 3 - ENTER CODE & NEW PASSWORD */}
        {mode === "forgot_reset" && (
          <motion.div
            key="forgot_reset"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setMode("login");
                }}
                className={`inline-flex items-center gap-1 text-xs font-semibold text-login-ink-muted transition-colors hover:text-login-accent ${FOCUS_RING}`}
              >
                <ArrowLeft className="size-3.5" /> Back to sign in
              </button>
            </div>

            <div className="text-center">
              <h1 className="text-3xl font-extrabold tracking-tight text-login-ink">
                Set new <span className="text-login-accent">password</span>
              </h1>
              <p className="mt-1.5 text-sm text-login-ink-muted">
                Enter your 6-digit code and choose a new password
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="mt-6 space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="recoveryCode" className="text-sm font-semibold text-login-ink">
                  6-Digit Recovery Code
                </Label>
                <div className="relative">
                  <KeyRound
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-login-ink-faint"
                  />
                  <Input
                    id="recoveryCode"
                    type="text"
                    maxLength={8}
                    placeholder="123456"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    className={`${FIELD_CLASSNAME} font-mono tracking-widest`}
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-semibold text-login-ink">
                  New Password
                </Label>
                <div className="relative">
                  <Lock
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-login-ink-faint"
                  />
                  <Input
                    id="newPassword"
                    type={showResetPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`${FIELD_CLASSNAME} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword((v) => !v)}
                    className={`absolute top-1/2 right-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-login-ink-muted transition-colors hover:text-login-ink ${FOCUS_RING}`}
                  >
                    {showResetPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-login-ink">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-login-ink-faint"
                  />
                  <Input
                    id="confirmPassword"
                    type={showResetPassword ? "text" : "password"}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={FIELD_CLASSNAME}
                  />
                </div>
              </div>

              {recoveryError && (
                <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2">
                  <p className="text-sm text-destructive">{recoveryError}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSendingRecovery}
                className={`h-13 w-full border-login-cta-border bg-login-cta text-base text-login-cta-ink shadow-none hover:bg-login-cta-hover [&>span:first-child]:w-full ${FOCUS_RING}`}
              >
                {isSendingRecovery ? "Updating password..." : "Update password"}
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 right-0 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-login-cta-pip"
                >
                  <ArrowRight className="size-4 text-login-cta-pip-ink" />
                </span>
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LevelStrip() {
  return (
    <div className="mt-6 flex items-center gap-3 rounded-2xl border border-login-inset-border bg-login-inset p-3 short:mt-4">
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
