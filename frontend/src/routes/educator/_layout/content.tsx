import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "urql";
import { ContentBlockList } from "@/components/content/ContentBlockList";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CONTENT_BLOCKS_QUERY } from "@/graphql/content";

interface ContentBlock {
  id: string;
  waveId: string;
  title: string;
  type: "LEARN" | "EVALUATE";
  version: number;
  status: "DRAFT" | "PUBLISHED";
  updatedAt: string;
}

export const Route = createFileRoute("/educator/_layout/content")({
  component: ContentPage,
});

const typeOptions = [
  { value: "", label: "All types" },
  { value: "LEARN", label: "Learn" },
  { value: "EVALUATE", label: "Evaluate" },
];

function ContentPage() {
  const [waveId, setWaveId] = useState("");
  const [type, setType] = useState("");
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: CONTENT_BLOCKS_QUERY,
    variables: {
      waveId: waveId || undefined,
      type: type || undefined,
    },
  });

  const blocks = useMemo<ContentBlock[]>(() => {
    return (data?.contentBlocks as ContentBlock[]) ?? [];
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Content Blocks</h2>
        <Link to="/educator/content/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New block
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Filter by wave ID"
          value={waveId}
          onChange={(e) => setWaveId(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select
          options={typeOptions}
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="sm:max-w-xs"
        />
      </div>

      {fetching && <p className="text-muted-foreground">Loading content blocks...</p>}
      {error && <p className="text-destructive">Failed to load content blocks.</p>}

      {!fetching && blocks.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No content blocks yet.</p>
          <p className="text-sm text-muted-foreground">Create your first block to get started.</p>
        </div>
      )}

      <ContentBlockList
        blocks={blocks}
        onRefresh={() => reexecuteQuery({ requestPolicy: "network-only" })}
      />
    </div>
  );
}
