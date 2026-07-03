import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "urql";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { REGISTER_MUTATION } from "@/graphql/auth";
import { type Grade, type UserRole, useAuthStore } from "@/stores/auth";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Full name is required"),
  role: z.enum(["STUDENT", "EDUCATOR", "HEAD_EDUCATOR", "ADMIN"]),
  grade: z
    .enum(["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11", "OL", "AL"])
    .optional(),
  preferredLanguage: z.string(),
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
        <Input id="fullName" placeholder="John Doe" {...register("fullName")} />
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select
          id="role"
          options={[
            { value: "STUDENT", label: "Student" },
            { value: "EDUCATOR", label: "Educator" },
            { value: "HEAD_EDUCATOR", label: "Head Educator" },
            { value: "ADMIN", label: "Admin" },
          ]}
          {...register("role")}
        />
        {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="grade">Grade</Label>
        <Select
          id="grade"
          placeholder="Select grade"
          options={[
            { value: "G1", label: "Grade 1" },
            { value: "G2", label: "Grade 2" },
            { value: "G3", label: "Grade 3" },
            { value: "G4", label: "Grade 4" },
            { value: "G5", label: "Grade 5" },
            { value: "G6", label: "Grade 6" },
            { value: "G7", label: "Grade 7" },
            { value: "G8", label: "Grade 8" },
            { value: "G9", label: "Grade 9" },
            { value: "G10", label: "Grade 10" },
            { value: "G11", label: "Grade 11" },
            { value: "OL", label: "O/L" },
            { value: "AL", label: "A/L" },
          ]}
          {...register("grade")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferredLanguage">Preferred language</Label>
        <Input id="preferredLanguage" placeholder="en" {...register("preferredLanguage")} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
