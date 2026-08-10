import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { cn } from "@/lib/utils";

interface ChatMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Chat bubble variant of the shared markdown renderer (full GFM + KaTeX).
 * Kept as a thin wrapper so existing imports keep working.
 */
export function ChatMarkdown({ content, className }: ChatMarkdownProps) {
  return <MarkdownContent content={content} className={cn(className)} />;
}
