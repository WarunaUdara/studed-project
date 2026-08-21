import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  Languages,
  Lock,
  Mail,
  Sparkles,
  User,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "urql";
import { z } from "zod";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { BlobAvatar } from "@/components/ui/BlobAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Progress } from "@/components/ui/Progress";
import { REGISTER_MUTATION } from "@/graphql/auth";
import { sanitizeError } from "@/lib/errors";
import { type Grade, useAuthStore } from "@/stores/auth";

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  grade: z
    .enum(["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11", "OL", "AL"])
    .optional(),
  preferredLanguage: z.string(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

/** Hexagon mask for the level badge, matching LoginAuthCard. */
const HEX_CLIP = "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";

const FIELD_CLASSNAME =
  "h-12 rounded-2xl border-login-field-border bg-login-field pl-11 text-login-ink placeholder:text-login-ink-soft focus-visible:ring-2 focus-visible:ring-login-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-login-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

export function RegisterAuthCard() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      preferredLanguage: "en",
      grade: "G1",
    },
  });

  const [, registerMutation] = useMutation(REGISTER_MUTATION);

  const liveAvatarSeed = watch("fullName");

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    const input = {
      ...data,
      grade: data.grade as Grade | undefined,
    };
    const result = await registerMutation({ input });
    if (result.error) {
      setError(sanitizeError(result.error).message);
      return;
    }
    if (result.data?.register?.user) {
      const user = result.data.register.user;
      setUser(user);
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <div className="relative rounded-lg border border-login-card-border bg-login-card p-6 pt-14 shadow-login-card backdrop-blur-xl sm:p-8 sm:pt-16 short:p-6 short:pt-12 sm:short:p-6 sm:short:pt-12">
      {/* Peeking mascot anchored to top of card */}
      <img
        src="/covers/mascot/mascot-peek.png"
        alt="StudEd Mascot"
        aria-hidden="true"
        width={1536}
        height={1024}
        className="animate-float-slow pointer-events-none absolute -top-12 left-1/2 w-28 -translate-x-1/2 select-none lg:-top-16 lg:w-36"
      />

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
          Create your <span className="text-login-accent">account!</span>
        </h1>
        <p className="mt-1.5 text-sm text-login-ink-muted">
          Start your learning journey and claim your starter rewards
        </p>
      </div>

      <StarterRewardStrip />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4 short:mt-4 short:space-y-3" noValidate>
        {/* Full Name */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <BlobAvatar
              name={liveAvatarSeed?.trim() || "new learner"}
              size={40}
              animate="always"
              title={liveAvatarSeed?.trim() ? `${liveAvatarSeed.trim()}'s avatar` : "Your avatar"}
            />
            <div>
              <Label htmlFor="fullName" className="text-sm font-semibold text-login-ink">
                Full name
              </Label>
              <p className="text-xs text-login-ink-muted">
                Your avatar is generated from your name — no upload needed
              </p>
            </div>
          </div>
          <div className="relative">
            <User
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-login-ink-faint"
            />
            <Input
              id="fullName"
              placeholder="John Doe"
              className={FIELD_CLASSNAME}
              {...register("fullName")}
            />
          </div>
          {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
        </div>

        {/* Email */}
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
              {...register("email")}
            />
          </div>
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        {/* Password */}
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
              {...register("password")}
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

        {/* Grade & Language 2-column sub-grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Grade Select */}
          <div className="space-y-2">
            <Label htmlFor="grade" className="text-sm font-semibold text-login-ink">
              Grade
            </Label>
            <div className="relative">
              <GraduationCap
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-login-ink-faint"
              />
              <select
                id="grade"
                className={`h-12 w-full appearance-none rounded-2xl border border-login-field-border bg-login-field pl-11 pr-8 text-sm font-medium text-login-ink ${FOCUS_RING}`}
                {...register("grade")}
              >
                <option value="G1">Grade 1</option>
                <option value="G2">Grade 2</option>
                <option value="G3">Grade 3</option>
                <option value="G4">Grade 4</option>
                <option value="G5">Grade 5</option>
                <option value="G6">Grade 6</option>
                <option value="G7">Grade 7</option>
                <option value="G8">Grade 8</option>
                <option value="G9">Grade 9</option>
                <option value="G10">Grade 10</option>
                <option value="G11">Grade 11</option>
                <option value="OL">O/L (Ordinary Level)</option>
                <option value="AL">A/L (Advanced Level)</option>
              </select>
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-login-ink-faint">
                ▼
              </span>
            </div>
          </div>

          {/* Language Select */}
          <div className="space-y-2">
            <Label htmlFor="preferredLanguage" className="text-sm font-semibold text-login-ink">
              Language
            </Label>
            <div className="relative">
              <Languages
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-login-ink-faint"
              />
              <select
                id="preferredLanguage"
                className={`h-12 w-full appearance-none rounded-2xl border border-login-field-border bg-login-field pl-11 pr-8 text-sm font-medium text-login-ink ${FOCUS_RING}`}
                {...register("preferredLanguage")}
              >
                <option value="en">English (EN)</option>
                <option value="si">සිංහල (Sinhala)</option>
                <option value="ta">தமிழ் (Tamil)</option>
              </select>
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-login-ink-faint">
                ▼
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Submit CTA Button matching login */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className={`h-13 w-full border-login-cta-border bg-login-cta text-base text-login-cta-ink shadow-none hover:bg-login-cta-hover [&>span:first-child]:w-full ${FOCUS_RING}`}
        >
          {isSubmitting ? "Creating account..." : "Create account"}
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

      <GoogleButton
        className={`h-12 w-full border-login-line bg-login-field text-sm text-login-ink shadow-none ${FOCUS_RING}`}
      />

      <p className="mt-6 text-center text-sm text-login-ink-muted short:mt-4">
        Already have an account?{" "}
        <Link
          to="/login"
          className={`rounded-sm font-semibold text-login-accent hover:underline ${FOCUS_RING}`}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

function StarterRewardStrip() {
  return (
    <div className="mt-6 flex items-center gap-3 rounded-2xl border border-login-inset-border bg-login-inset p-3 short:mt-4">
      {/* Green rim + dark core hexagon */}
      <span
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center bg-login-hex-rim"
        style={{ clipPath: HEX_CLIP }}
      >
        <span
          className="flex size-11 items-center justify-center bg-login-hex-core text-base font-extrabold text-login-hex-ink"
          style={{ clipPath: HEX_CLIP }}
        >
          1
        </span>
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="flex items-center gap-1 text-sm font-semibold text-login-ink">
            Level 1 Starter
            <Sparkles className="size-3.5 text-login-accent" />
          </span>
          <span className="text-xs font-medium text-login-ink-muted">+100 Welcome XP</span>
        </div>
        <Progress
          value={100}
          max={100}
          className="mt-2 h-2 bg-login-line [&>div]:bg-login-accent"
          aria-label="Starter bonus ready to claim"
        />
      </div>
    </div>
  );
}
