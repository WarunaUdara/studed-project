import { useLoginForm } from "@/components/auth/useLoginForm";
import { HelmetCompanion } from "@/components/mascot/HelmetCompanion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

interface LoginFormProps {
  onSuccess?: () => void;
}

/**
 * Compact login form used by the navbar's LoginModal. The full-page login card
 * renders `LoginAuthCard` instead; both share `useLoginForm`.
 */
export function LoginForm({ onSuccess }: LoginFormProps = {}) {
  const { registerField, submit, errors, isSubmitting, error, focusedField } = useLoginForm({
    onSuccess,
  });

  const mascotMood = error
    ? "sad"
    : focusedField === "password"
      ? "password"
      : focusedField === "email"
        ? "happy"
        : "neutral";

  const mascotGaze = focusedField === "email" ? { x: 16, y: -4 } : undefined;

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {/* Helmet Form Companion */}
      <div className="flex justify-center -mb-2">
        <HelmetCompanion size="md" mood={mascotMood} gaze={mascotGaze} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" {...registerField("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...registerField("password")}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
