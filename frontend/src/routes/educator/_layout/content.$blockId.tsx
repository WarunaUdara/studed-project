import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "urql";
import { ContentBlockForm } from "@/components/content/ContentBlockForm";
import { ContentVersionBadge } from "@/components/content/ContentVersionBadge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  CONTENT_BLOCK_QUERY,
  CONTENT_VERSION_HISTORY_QUERY,
  UPDATE_CONTENT_BLOCK_MUTATION,
} from "@/graphql/content";

interface ContentBlock {
  id: string;
  waveId: string;
  title: string;
  type: "LEARN" | "EVALUATE";
  payloadJson: string;
  version: number;
  status: "DRAFT" | "PUBLISHED";
  createdAt: string;
  updatedAt: string;
}

interface ContentVersion {
  id: string;
  versionNumber: number;
  createdAt: string;
}

export const Route = createFileRoute("/educator/_layout/content/$blockId")({
  component: EditContentBlockPage,
});

function EditContentBlockPage() {
  const { blockId } = Route.useParams();
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: CONTENT_BLOCK_QUERY,
    variables: { id: blockId },
  });
  const [{ data: versionData }] = useQuery({
    query: CONTENT_VERSION_HISTORY_QUERY,
    variables: { contentBlockId: blockId },
  });
  const [serverError, setServerError] = useState<string | null>(null);
  const [updateResult, updateBlock] = useMutation(UPDATE_CONTENT_BLOCK_MUTATION);

  const block: ContentBlock | undefined = data?.contentBlock;
  const versions = useMemo<ContentVersion[]>(() => {
    return (versionData?.contentVersionHistory as ContentVersion[]) ?? [];
  }, [versionData]);

  const handleSubmit = async (values: {
    title: string;
    type: "LEARN" | "EVALUATE";
    payloadJson: string;
  }) => {
    setServerError(null);
    const result = await updateBlock({
      id: blockId,
      input: {
        title: values.title,
        payloadJson: values.payloadJson,
      },
    });

    if (result.error) {
      setServerError(result.error.message);
      return;
    }

    reexecuteQuery({ requestPolicy: "network-only" });
  };

  if (fetching) {
    return <p className="text-muted-foreground">Loading content block...</p>;
  }

  if (error || !block) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">Failed to load content block.</p>
        <Link to="/educator/content">
          <Button variant="outline">Back to content</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/educator/content">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <h2 className="text-2xl font-bold">{block.title}</h2>
        <ContentVersionBadge version={block.version} status={block.status} />
      </div>

      {serverError && <p className="text-destructive">{serverError}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Edit block</CardTitle>
        </CardHeader>
        <CardContent>
          <ContentBlockForm
            mode="update"
            waveId={block.waveId}
            defaultValues={{
              title: block.title,
              type: block.type,
              payloadJson: block.payloadJson,
            }}
            onSubmit={handleSubmit}
            isSubmitting={updateResult.fetching}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Version history</CardTitle>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No versions recorded.</p>
          ) : (
            <ul className="space-y-2">
              {versions.map((v) => (
                <li key={v.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">Version {v.versionNumber}</span>
                  <span className="text-muted-foreground">
                    {new Date(v.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
