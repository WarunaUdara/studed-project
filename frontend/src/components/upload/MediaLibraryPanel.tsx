import { FileText, Image, Trash2, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "urql";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { DELETE_MEDIA_ASSET_MUTATION, MEDIA_ASSETS_QUERY } from "@/graphql/upload";
import type { MediaAsset } from "@/schemas/upload";

interface MediaLibraryPanelProps {
  onSelect?: (asset: MediaAsset) => void;
  selectedIds?: string[];
  filterType?: "image" | "video" | "document";
}

export function MediaLibraryPanel({
  onSelect,
  selectedIds = [],
  filterType,
}: MediaLibraryPanelProps) {
  const [search, setSearch] = useState("");
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: MEDIA_ASSETS_QUERY,
    variables: { mimeTypePrefix: filterType ? `${filterType}/` : undefined },
  });
  const [, deleteAsset] = useMutation(DELETE_MEDIA_ASSET_MUTATION);

  const assets = useMemo<MediaAsset[]>(() => {
    const all = (data?.mediaAssets as MediaAsset[]) ?? [];
    if (!search) return all;
    return all.filter((a) => a.filename.toLowerCase().includes(search.toLowerCase()));
  }, [data, search]);

  const handleDelete = async (id: string) => {
    await deleteAsset({ id });
    reexecuteQuery({ requestPolicy: "network-only" });
  };

  if (error) {
    return <p className="text-destructive">Failed to load media library.</p>;
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search media..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {fetching && <p className="text-sm text-muted-foreground">Loading media...</p>}

      {!fetching && assets.length === 0 && (
        <p className="text-sm text-muted-foreground">No media uploaded yet.</p>
      )}

      <div className="grid max-h-80 gap-3 overflow-y-auto sm:grid-cols-2">
        {assets.map((asset) => {
          const isImage = asset.mimeType.startsWith("image/");
          const isSelected = selectedIds.includes(asset.id);

          return (
            <Card
              key={asset.id}
              className={`cursor-pointer transition-colors ${
                isSelected ? "border-primary ring-1 ring-primary" : ""
              }`}
              onClick={() => onSelect?.(asset)}
            >
              <CardContent className="flex items-start gap-3 p-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-secondary">
                  {isImage ? (
                    asset.cdnUrl ? (
                      <img
                        src={asset.cdnUrl}
                        alt={asset.filename}
                        className="h-full w-full rounded-md object-cover"
                      />
                    ) : (
                      <Image className="h-5 w-5" />
                    )
                  ) : asset.mimeType.startsWith("video/") ? (
                    <Video className="h-5 w-5" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{asset.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {(asset.sizeBytes / 1024).toFixed(1)} KB · {asset.mimeType}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(asset.id);
                  }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
