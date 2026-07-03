import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "urql";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { REGISTER_MUTATION } from "@/graphql/auth";
import { useAuthStore, type Grade, type UserRole } from "@/stores/auth";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Full name is required"),
  role: z.enum(["STUDENT", "EDUCATOR", "HEAD_EDUCATOR", "ADMIN"]),
  grade: z
    .enum(["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11", "OL", "AL"])
    .optional(),
  preferredLanguage: z.string().default("en"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "STUDENT",
      preferredLanguage: "en",
    },
  });

  const [, registerMutation] = useMutation(REGISTER_MUTATION);

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    const input = {
      ...data,
      grade: data.grade as Grade | undefined,
      role: data.role as UserRole,
    };
    const result = await registerMutation({ input });
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (result.data?.register?.user) {
      setUser(result.data.register.user);
      navigate({ to: "/" });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          placeholder="John Doe"
          {...register("fullName")}
        />
        {errors.fullName && (
          <p className="text-sm text-destructive">{errors.fullName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          {...register("role")}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="STUDENT">Student</option>
          <option value="EDUCATOR">Educator</option>
          <option value="HEAD_EDUCATOR">Head Educator</option>
          <option value="ADMIN">Admin</option>
        </select>
        {errors.role && (
          <p className="text-sm text-destructive">{errors.role.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="grade">Grade</Label>
        <select
          id="grade"
          {...register("grade")}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select grade</option>
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
          <option value="OL">O/L</option>
          <option value="AL">A/L</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferredLanguage">Preferred language</Label>
        <Input
          id="preferredLanguage"
          placeholder="en"
          {...register("preferredLanguage")}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
