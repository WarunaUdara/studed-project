import { useCallback, useState } from "react";
import { type MediaAsset, mediaAssetSchema, type UploadProgress } from "@/schemas/upload";

interface UseUploadFileOptions {
  onProgress?: (progress: UploadProgress) => void;
}

interface UseUploadFileReturn {
  upload: (file: File) => Promise<MediaAsset>;
  isUploading: boolean;
  progress: UploadProgress | null;
  error: string | null;
  reset: () => void;
}

export function useUploadFile(options: UseUploadFileOptions = {}): UseUploadFileReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    (file: File): Promise<MediaAsset> => {
      return new Promise((resolve, reject) => {
        setIsUploading(true);
        setError(null);
        setProgress({ loaded: 0, total: file.size, percentage: 0 });

        const formData = new FormData();
        formData.append("file", file);

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            const next = { loaded: event.loaded, total: event.total, percentage };
            setProgress(next);
            options.onProgress?.(next);
          }
        });

        xhr.addEventListener("load", () => {
          setIsUploading(false);
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const parsed = JSON.parse(xhr.responseText);
              const asset = mediaAssetSchema.parse(parsed);
              resolve(asset);
            } catch {
              setError("Invalid upload response");
              reject(new Error("Invalid upload response"));
            }
          } else {
            let message = "Upload failed";
            try {
              const parsed = JSON.parse(xhr.responseText);
              if (parsed.error) message = parsed.error;
            } catch {
              /* ignore */
            }
            setError(message);
            reject(new Error(message));
          }
        });

        xhr.addEventListener("error", () => {
          setIsUploading(false);
          setError("Network error during upload");
          reject(new Error("Network error during upload"));
        });

        xhr.addEventListener("abort", () => {
          setIsUploading(false);
          setError("Upload cancelled");
          reject(new Error("Upload cancelled"));
        });

        xhr.open("POST", "/api/v1/uploads");
        xhr.withCredentials = true;
        xhr.send(formData);
      });
    },
    [options],
  );

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(null);
    setError(null);
  }, []);

  return { upload, isUploading, progress, error, reset };
}
