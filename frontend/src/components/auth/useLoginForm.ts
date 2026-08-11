import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "urql";
import { z } from "zod";
import { LOGIN_MUTATION } from "@/graphql/auth";
import { sanitizeError } from "@/lib/errors";
import { useAuthStore } from "@/stores/auth";

/**
 * Shared login behaviour.
 *
 * Lifted verbatim out of `LoginForm` so the compact modal presentation and the
 * full-page login card can render completely different markup without the
 * submit handler, schema or redirect rules existing in two places. Nothing here
 * changed when it moved — only where it lives.
 */

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export type LoginField = "email" | "password";

export interface UseLoginFormOptions {
  onSuccess?: () => void;
}

export function useLoginForm({ onSuccess }: UseLoginFormOptions = {}) {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<LoginField | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const [, login] = useMutation(LOGIN_MUTATION);

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    const result = await login({ input: data });
    if (result.error) {
      setError(sanitizeError(result.error).message);
      return;
    }
    if (result.data?.login?.user) {
      const user = result.data.login.user;
      setUser(user);
      if (onSuccess) {
        onSuccess();
      }
      if (user.role === "EDUCATOR" || user.role === "HEAD_EDUCATOR" || user.role === "ADMIN") {
        navigate({ to: "/educator/courses" });
      } else {
        navigate({ to: "/dashboard" });
      }
    }
  };

  /** Wires focus tracking onto a field without dropping RHF's own onBlur. */
  const registerField = (field: LoginField) => {
    const reg = register(field);
    return {
      ...reg,
      onFocus: () => setFocusedField(field),
      onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
        reg.onBlur(event);
        setFocusedField(null);
      },
    };
  };

  return {
    registerField,
    submit: handleSubmit(onSubmit),
    errors,
    isSubmitting,
    error,
    focusedField,
  };
}
