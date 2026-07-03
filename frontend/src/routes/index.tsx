import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-4xl font-bold text-primary">StudEd</h1>
      <p className="max-w-md text-center text-muted-foreground">
        Premium e-learning for Sri Lankan schools. Course, Lesson, and Wave hierarchy coming soon.
      </p>
    </main>
  );
}
