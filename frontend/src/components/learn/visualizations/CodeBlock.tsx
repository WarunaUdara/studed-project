import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CodeBlockProps {
  content: string;
}

export function CodeBlock({ content }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border bg-slate-950 p-4 shadow-sm text-slate-100 font-mono text-xs relative group">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3 text-slate-400">
        <span className="text-[11px] uppercase tracking-wider font-sans font-semibold">
          Code Snippet
        </span>
        <button
          type="button"
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 text-[11px] hover:text-white transition-colors p-1.5 rounded-lg active:bg-slate-800 min-h-[36px] touch-manipulation"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto leading-relaxed pb-2 text-[11px] sm:text-xs">{content}</pre>
    </div>
  );
}
