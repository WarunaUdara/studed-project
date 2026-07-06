import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useMutation } from "urql";
import { ContentBlockForm } from "@/components/content/ContentBlockForm";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CREATE_CONTENT_BLOCK_MUTATION } from "@/graphql/content";

export const Route = createFileRoute("/educator/_layout/content/new")({
  component: CreateContentBlockPage,
});

function CreateContentBlockPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [createResult, createBlock] = useMutation(CREATE_CONTENT_BLOCK_MUTATION);

  const handleSubmit = async (values: {
    title: string;
    type: "LEARN" | "EVALUATE";
    payloadJson: string;
  }) => {
    setServerError(null);
    const result = await createBlock({
      input: {
        waveId: (document.getElementById("waveId") as HTMLInputElement)?.value ?? "",
        title: values.title,
        type: values.type,
        payloadJson: values.payloadJson,
      },
    });

    if (result.error) {
      setServerError(result.error.message);
      return;
    }

    navigate({ to: "/educator/content" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/educator/content">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <h2 className="text-2xl font-bold">New Content Block</h2>
      </div>

      {serverError && <p className="text-destructive">{serverError}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Block details</CardTitle>
        </CardHeader>
        <CardContent>
          <ContentBlockForm
            mode="create"
            waveId=""
            onSubmit={handleSubmit}
            isSubmitting={createResult.fetching}
          />
        </CardContent>
      </Card>
    </div>
  );
}
