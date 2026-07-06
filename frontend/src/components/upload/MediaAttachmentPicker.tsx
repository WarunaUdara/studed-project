import { Paperclip, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { MediaAsset } from "@/schemas/upload";
import { FileUploadDropzone } from "./FileUploadDropzone";
import { MediaLibraryPanel } from "./MediaLibraryPanel";

interface Attachment {
  mediaAssetId: string;
  filename: string;
  cdnUrl: string;
}

interface MediaAttachmentPickerProps {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
}

export function MediaAttachmentPicker({ attachments, onChange }: MediaAttachmentPickerProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  const handleUploadComplete = (asset: MediaAsset) => {
    onChange([
      ...attachments,
      { mediaAssetId: asset.id, filename: asset.filename, cdnUrl: asset.cdnUrl ?? "" },
    ]);
    setShowUpload(false);
  };

  const handleSelect = (asset: MediaAsset) => {
    if (attachments.some((a) => a.mediaAssetId === asset.id)) {
      onChange(attachments.filter((a) => a.mediaAssetId !== asset.id));
      return;
    }
    onChange([
      ...attachments,
      { mediaAssetId: asset.id, filename: asset.filename, cdnUrl: asset.cdnUrl ?? "" },
    ]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {attachments.map((a) => (
          <div
            key={a.mediaAssetId}
            className="flex items-center gap-2 rounded-full border bg-secondary px-3 py-1 text-sm"
          >
            <Paperclip className="h-3 w-3" />
            <span className="max-w-[12rem] truncate">{a.filename}</span>
            <button
              type="button"
              onClick={() => onChange(attachments.filter((x) => x.mediaAssetId !== a.mediaAssetId))}
              className="text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setShowUpload(!showUpload);
            setShowLibrary(false);
          }}
        >
          <Plus className="mr-1 h-3 w-3" />
          Upload
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setShowLibrary(!showLibrary);
            setShowUpload(false);
          }}
        >
          Library
        </Button>
      </div>

      {showUpload && (
        <FileUploadDropzone
          acceptedTypes="image/*,video/*,application/pdf"
          maxSizeMb={10}
          onUploadComplete={handleUploadComplete}
        />
      )}

      {showLibrary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Media Library</CardTitle>
          </CardHeader>
          <CardContent>
            <MediaLibraryPanel
              onSelect={handleSelect}
              selectedIds={attachments.map((a) => a.mediaAssetId)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
