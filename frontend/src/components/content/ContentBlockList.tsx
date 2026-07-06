import { Link } from "@tanstack/react-router";
import { BookOpen, CheckCircle2, FileQuestion, Trash2 } from "lucide-react";
import { useMutation } from "urql";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DELETE_CONTENT_BLOCK_MUTATION, PUBLISH_CONTENT_BLOCK_MUTATION } from "@/graphql/content";
import type { ContentBlockType } from "@/schemas/content";

interface ContentBlock {
  id: string;
  waveId: string;
  title: string;
  type: ContentBlockType;
  version: number;
  status: "DRAFT" | "PUBLISHED";
  updatedAt: string;
}

interface ContentBlockListProps {
  blocks: ContentBlock[];
  onRefresh: () => void;
}

export function ContentBlockList({ blocks, onRefresh }: ContentBlockListProps) {
  const [, publishBlock] = useMutation(PUBLISH_CONTENT_BLOCK_MUTATION);
  const [, deleteBlock] = useMutation(DELETE_CONTENT_BLOCK_MUTATION);

  const handlePublish = async (id: string) => {
    await publishBlock({ id });
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this content block?")) return;
    await deleteBlock({ id });
    onRefresh();
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {blocks.map((block) => (
        <Card key={block.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {block.type === "LEARN" ? (
                  <BookOpen className="h-4 w-4 text-blue-500" />
                ) : (
                  <FileQuestion className="h-4 w-4 text-amber-500" />
                )}
                <CardTitle className="text-base">{block.title}</CardTitle>
              </div>
              {block.status === "PUBLISHED" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="rounded-full bg-secondary px-2 py-0.5">{block.type}</span>
              <span>v{block.version}</span>
              <span className={block.status === "PUBLISHED" ? "text-green-600" : "text-amber-600"}>
                {block.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Updated {new Date(block.updatedAt).toLocaleString()}
            </p>
            <div className="flex gap-2">
              <Link
                to="/educator/content/$blockId"
                params={{ blockId: block.id }}
                className="flex-1"
              >
                <Button variant="outline" size="sm" className="w-full">
                  Edit
                </Button>
              </Link>
              {block.status === "DRAFT" && (
                <Button size="sm" className="flex-1" onClick={() => handlePublish(block.id)}>
                  Publish
                </Button>
              )}
              <button
                type="button"
                onClick={() => handleDelete(block.id)}
                className="rounded-md border p-2 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
