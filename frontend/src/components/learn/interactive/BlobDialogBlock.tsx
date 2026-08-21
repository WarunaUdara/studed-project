import { BlobTeacher } from "@/components/mascot/BlobTeacher";
import type { BlobDialogConfig } from "@/lib/content/interactiveBlocks";
import { parseBlockConfig } from "@/lib/content/interactiveBlocks";

interface BlobDialogBlockProps {
  content: string;
  metadata?: string | object | null;
}

/**
 * A `blob_dialog` learn block. The teacher's script lives in block metadata, so
 * an educator writes the lesson's voice as content and never touches code. If
 * metadata is missing, the block's plain content becomes the single line.
 */
export function BlobDialogBlock({ content, metadata }: BlobDialogBlockProps) {
  const config = parseBlockConfig<BlobDialogConfig>(metadata);
  const lines = config?.lines?.length
    ? config.lines
    : [{ id: "line-1", text: content, mood: "happy" as const }];

  return <BlobTeacher lines={lines} />;
}
