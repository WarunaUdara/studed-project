import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PhysicsDemo } from "@/components/demo/PhysicsDemo";
import { Button } from "@/components/ui/Button";

export const Route = createFileRoute("/demo/physics")({
  component: PhysicsDemoPage,
});

function PhysicsDemoPage() {
  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back home
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Physics Demo (matter-js)</h1>
        </div>
        <p className="text-muted-foreground">
          A standalone showcase of the Matter.js physics engine. Click and drag the shapes.
        </p>
        <PhysicsDemo />
      </div>
    </main>
  );
}
