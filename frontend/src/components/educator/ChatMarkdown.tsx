import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

interface ChatMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Renders assistant chat content as full markdown with GFM (tables,
 * strikethrough, task lists) and LaTeX math ($...$ inline, $$...$$ block)
 * via KaTeX. The raw block JSON the model sometimes emits is never shown —
 * generated blocks go straight to the editor and the chat keeps summaries.
 */
export function ChatMarkdown({ content, className }: ChatMarkdownProps) {
  return (
    <div className={cn("chat-markdown prose prose-sm max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // KaTeX math elements
          span({ className: cn_, children, ...props }) {
            if (cn_?.includes("math")) {
              return (
                <span className={cn_} {...props}>
                  {children}
                </span>
              );
            }
            return <span className={cn_} {...props}>{children}</span>;
          },
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
              {children}
            </a>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-3 text-xs leading-relaxed">
              {children}
            </pre>
          ),
          code: ({ className: cn_, children }) => {
            const isBlock = cn_?.includes("language-");
            return (
              <code
                className={cn(
                  isBlock ? "" : "rounded bg-muted px-1 py-0.5 text-[0.85em]",
                  cn_,
                )}
              >
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border bg-muted/50 px-2 py-1 text-left font-semibold">{children}</th>
          ),
          td: ({ children }) => <td className="border px-2 py-1">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
