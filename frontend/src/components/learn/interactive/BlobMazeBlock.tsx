import { BlobProgramMaze, type MazeGridConfig } from "@/components/waves/BlobProgramMaze";
import type { BlobMazeConfig } from "@/lib/content/interactiveBlocks";
import { parseBlockConfig } from "@/lib/content/interactiveBlocks";

interface BlobMazeBlockProps {
  content: string;
  metadata?: string | object | null;
}

/**
 * The instruction-ordering maze as a content block. A wave can supply its own
 * grid, or leave the metadata out and use the built-in one.
 */
export function BlobMazeBlock({ content, metadata }: BlobMazeBlockProps) {
  const config = parseBlockConfig<BlobMazeConfig>(metadata);

  return (
    <section className="space-y-3">
      {content && <p className="text-sm font-medium text-foreground">{content}</p>}
      <BlobProgramMaze config={config?.grid as MazeGridConfig | undefined} />
    </section>
  );
}
