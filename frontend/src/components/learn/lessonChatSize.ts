export interface PanelSize {
  width: number;
  height: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export const MIN_PANEL: PanelSize = { width: 300, height: 260 };
export const DEFAULT_PANEL: PanelSize = { width: 380, height: 460 };

/** Margin kept clear of the viewport edges so the panel never covers the whole screen. */
const EDGE_GUTTER = 32;
const TOP_GUTTER = 96;

/**
 * Keeps a dragged panel inside sensible bounds: never smaller than a readable
 * chat, never taller or wider than the screen it sits on. A small phone screen
 * shrinks the minimum rather than pushing the panel off the edge.
 */
export function clampPanelSize(size: PanelSize, viewport: Viewport): PanelSize {
  const maxWidth = Math.max(MIN_PANEL.width, viewport.width - EDGE_GUTTER);
  const maxHeight = Math.max(MIN_PANEL.height, viewport.height - TOP_GUTTER);
  const minWidth = Math.min(MIN_PANEL.width, maxWidth);
  const minHeight = Math.min(MIN_PANEL.height, maxHeight);

  return {
    width: Math.round(Math.min(Math.max(size.width, minWidth), maxWidth)),
    height: Math.round(Math.min(Math.max(size.height, minHeight), maxHeight)),
  };
}

/**
 * The panel grows towards the top left, so dragging its corner left or up adds
 * size. Callers pass the pointer delta since the drag started.
 */
export function resizeFromCorner(
  start: PanelSize,
  deltaX: number,
  deltaY: number,
  viewport: Viewport,
): PanelSize {
  return clampPanelSize({ width: start.width - deltaX, height: start.height - deltaY }, viewport);
}

/** Trims lesson text to what a chat request should carry as context. */
export function buildLessonContext(
  title: string,
  blocks: { type: string; content: string }[],
): string {
  const readable = blocks
    .filter((block) =>
      ["heading", "text", "callout", "example", "formula"].includes(block.type.toLowerCase()),
    )
    .map((block) => block.content.trim())
    .filter(Boolean)
    .join("\n\n");

  const context = `Lesson: ${title}\n\n${readable}`;
  return context.length > 2000 ? `${context.slice(0, 2000)}...` : context;
}
