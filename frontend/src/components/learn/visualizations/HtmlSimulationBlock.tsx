import { useEffect, useMemo, useState } from "react";

interface HtmlSimulationMetadata {
  title?: string;
  description?: string;
  html?: string;
  height?: number;
}

export interface HtmlSimulationBlockProps {
  content: string;
  metadata?: string | null;
}

function parseMetadata(metadata?: string | null): HtmlSimulationMetadata {
  if (!metadata) return {};
  try {
    const parsed = JSON.parse(metadata) as HtmlSimulationMetadata;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Runs an AI-generated interactive simulation as an isolated document.
 *
 * The sandbox intentionally omits allow-same-origin and allow-forms. The
 * generated page can execute its own HTML/CSS/JS (including Matter.js loaded
 * by the document), but it cannot access the StudEd app, cookies, storage, or
 * parent DOM. This is the replacement for the old approximate React physics
 * renderer.
 */
export function HtmlSimulationBlock({ content, metadata }: HtmlSimulationBlockProps) {
  const meta = useMemo(() => parseMetadata(metadata), [metadata]);
  const [failed, setFailed] = useState(false);
  const html = typeof meta.html === "string" ? meta.html.trim() : "";
  const title = meta.title || content || "Interactive simulation";
  const height = Math.min(Math.max(Number(meta.height) || 560, 360), 900);

  useEffect(() => setFailed(false), [html]);

  if (!html) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm text-foreground">
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-muted-foreground">
          This simulation has no runnable HTML document yet. Ask the assistant to regenerate it.
        </p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border bg-slate-950 shadow-sm" aria-label={title}>
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          {meta.description && <p className="truncate text-xs text-slate-400">{meta.description}</p>}
        </div>
        <span className="shrink-0 rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
          Interactive
        </span>
      </div>
      {failed ? (
        <div className="flex items-center justify-center bg-white p-6 text-sm text-destructive" style={{ height }}>
          The simulation document could not be loaded. Regenerate this simulation to try again.
        </div>
      ) : (
        <iframe
          title={title}
          srcDoc={html}
          sandbox="allow-scripts"
          loading="lazy"
          onError={() => setFailed(true)}
          className="block w-full border-0 bg-white"
          style={{ height }}
        />
      )}
    </section>
  );
}

export function htmlSimulationMetadata(metadata?: string | null): HtmlSimulationMetadata {
  return parseMetadata(metadata);
}

export function isRunnableHtmlSimulation(metadata?: string | null): boolean {
  return Boolean(htmlSimulationMetadata(metadata).html?.trim());
}

export default HtmlSimulationBlock;
