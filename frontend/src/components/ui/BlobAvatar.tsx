import { memo } from "react";
import { Blobatar } from "@blobatar/react";
import "blobatar/motion.css";
import { cn } from "@/lib/utils";

export interface BlobAvatarProps {
  /** Deterministic seed. The same string always renders the same blobatar. */
  name: string;
  size?: number;
  className?: string;
  /** Accessible label; also used as the `<img>` alt text on the static path. */
  title?: string;
  /** Idle animation. Costs ~12 SVG nodes per avatar — only use in isolated spots. */
  animate?: "hover" | "always";
}

/**
 * BlobAvatar - deterministic geometric avatar derived from any string seed.
 *
 * Wraps blobatar's React adapter so every user gets a stable, unique face from
 * their id with no upload or storage. Renders as a single `<img>` (data URI)
 * on the static path, which keeps long lists like the leaderboard cheap; the
 * wrapper is memoized so re-renders with stable seeds do not recompute.
 */
export const BlobAvatar = memo(function BlobAvatar({
  name,
  size = 40,
  className,
  title,
  animate,
}: BlobAvatarProps) {
  return (
    <Blobatar
      name={name}
      size={size}
      title={title}
      animate={animate}
      className={cn("shrink-0 select-none", className)}
    />
  );
});

BlobAvatar.displayName = "BlobAvatar";