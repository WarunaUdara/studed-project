import { Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useUploadFile } from "@/hooks/useUploadFile";
import type { MediaAsset } from "@/schemas/upload";

interface FileUploadDropzoneProps {
  acceptedTypes?: string;
  maxSizeMb?: number;
  onUploadComplete?: (asset: MediaAsset) => void;
}

export function FileUploadDropzone({
  acceptedTypes = "image/*,video/*,application/pdf",
  maxSizeMb = 10,
  onUploadComplete,
}: FileUploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { upload, isUploading, progress, error, reset } = useUploadFile();

  const handleFile = useCallback(
    (file: File) => {
      if (file.size > maxSizeMb * 1024 * 1024) {
        reset();
        return;
      }
      setSelectedFile(file);
      upload(file)
        .then((asset) => {
          onUploadComplete?.(asset);
          setSelectedFile(null);
        })
        .catch(() => {
          /* error is tracked by hook */
        });
    },
    [maxSizeMb, onUploadComplete, reset, upload],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleFile],
  );

  return (
    <Card
      className={`
        border-2 border-dashed transition-colors
        ${dragActive ? "border-primary bg-primary/5" : "border-input"}
      `}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <CardContent className="flex flex-col items-center gap-4 p-6">
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes}
          className="hidden"
          onChange={onInputChange}
        />
        <div className="rounded-full bg-secondary p-3">
          <Upload className="h-6 w-6 text-secondary-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">Drag and drop a file here</p>
          <p className="text-xs text-muted-foreground">or click to browse (max {maxSizeMb} MB)</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          Browse files
        </Button>

        {selectedFile && (
          <div className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm">
            <span className="truncate">{selectedFile.name}</span>
            {!isUploading && (
              <button
                type="button"
                onClick={() => {
                  reset();
                  setSelectedFile(null);
                }}
                className="ml-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {isUploading && progress && (
          <div className="w-full space-y-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">{progress.percentage}%</p>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
