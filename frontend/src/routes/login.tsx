import { createFileRoute, Link } from "@tanstack/react-router";
import { LoginForm } from "@/components/auth/LoginForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to StudEd</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
