import type { AnimationConfig } from "@/lib/content/interactiveBlocks";
import { parseBlockConfig } from "@/lib/content/interactiveBlocks";
import { getScene } from "./animationRegistry";

interface AnimationBlockProps {
  /** Fallback scene id when the block carries no metadata. */
  content: string;
  metadata?: string | object | null;
}

/**
 * Renders an `animation` learn block by looking its scene up in the registry.
 * An unknown scene id degrades to the block's caption so a student never sees
 * an empty frame where a diagram should be.
 */
export function AnimationBlock({ content, metadata }: AnimationBlockProps) {
  const config = parseBlockConfig<AnimationConfig>(metadata);
  const scene = getScene(config?.scene ?? content);
  const caption = config?.caption ?? (scene ? undefined : content);

  return (
    <figure className="space-y-2 rounded-2xl border bg-card p-4 shadow-sm">
      {scene ? (
        <scene.Component params={config?.params ?? {}} />
      ) : (
        <p className="text-sm text-muted-foreground">{content}</p>
      )}
      {caption && scene && (
        <figcaption className="text-center text-sm text-muted-foreground">{caption}</figcaption>
      )}
    </figure>
  );
}
