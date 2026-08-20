/**
 * Typed contract for StudEd's interactive Learn and Evaluate blocks.
 *
 * A wave is data, not a bespoke page: every block is a serializable record that
 * renders identically in the student player, the educator editor, and the
 * `content/courses/<slug>/course.json` manifest that seeds the database.
 *
 * Grading stays on the server. Each interactive evaluate block encodes the
 * student's manipulation into a single canonical answer string that is compared
 * against the block's `correctAnswer` with the same case-insensitive equality
 * used for multiple choice, so no backend change is required to add a new
 * interaction type.
 */

/** Bumped when a config shape changes in a way that old manifests cannot satisfy. */
export const CONTENT_BLOCK_VERSION = 1;

export const INTERACTIVE_EVALUATE_TYPES = [
  "tap_target",
  "drag_drop",
  "order_steps",
  "toggle_switch",
  "slider_target",
] as const;

export type InteractiveEvaluateType = (typeof INTERACTIVE_EVALUATE_TYPES)[number];

export const INTERACTIVE_LEARN_TYPES = [
  "blob_dialog",
  "force_lab",
  "circuit_lab",
  "water_flow",
  "animation",
] as const;

export type InteractiveLearnType = (typeof INTERACTIVE_LEARN_TYPES)[number];

export function isInteractiveEvaluateType(type: string): type is InteractiveEvaluateType {
  return (INTERACTIVE_EVALUATE_TYPES as readonly string[]).includes(type.toLowerCase());
}

export function isInteractiveLearnType(type: string): type is InteractiveLearnType {
  return (INTERACTIVE_LEARN_TYPES as readonly string[]).includes(type.toLowerCase());
}

/* ------------------------------- Learn blocks ------------------------------ */

/**
 * A single mascot utterance. `text` is the stable, speakable field: a TTS engine
 * consumes exactly this string, so it must never carry markup or layout hints.
 */
export interface BlobDialogLine {
  id: string;
  text: string;
  /** Mascot expression driving the blob's face and bounce. */
  mood?: "happy" | "thinking" | "cheer" | "surprised";
  /** Optional label for the button that advances to the next line. */
  cta?: string;
}

export interface BlobDialogConfig {
  version: number;
  lines: BlobDialogLine[];
}

/** Declarative reference to an animation in the scene registry. */
export interface AnimationConfig {
  version: number;
  /** Registry key, e.g. "force-arrows" or "short-circuit-warning". */
  scene: string;
  /** Scene-specific knobs, passed through untouched. */
  params?: Record<string, string | number | boolean>;
  caption?: string;
}

export interface ForceLabConfig {
  version: number;
  /** Object being pushed, shown as an emoji-free illustrated cart. */
  label?: string;
  /** Newtons at each end of the slider. */
  minForce?: number;
  maxForce?: number;
  /** Surface options the student can switch between. */
  surfaces?: { id: string; label: string; friction: number }[];
  caption?: string;
}

export interface CircuitLabConfig {
  version: number;
  /** Gaps the student taps to drop a component into. */
  slots: { id: string; label: string; accepts: string }[];
  /** Components on the workbench tray. */
  components: { id: string; label: string; kind: "battery" | "wire" | "bulb" | "switch" }[];
  /** Wiring that lights the bulb, as slotId -> componentId. */
  solution: Record<string, string>;
  /** Wiring that triggers the short-circuit warning animation. */
  shortCircuit?: Record<string, string>;
  caption?: string;
}

export interface WaterFlowConfig {
  version: number;
  /** Pump pressure stands in for voltage. */
  voltageLabel?: string;
  /** Pipe width stands in for resistance. */
  resistanceLabel?: string;
  /** Flow rate stands in for current. */
  currentLabel?: string;
  caption?: string;
}

/* ----------------------------- Evaluate blocks ----------------------------- */

export interface TapTargetConfig {
  version: number;
  /** Optional animated scene rendered above the targets. */
  scene?: string;
  targets: { id: string; label: string }[];
  /** Allow more than one target to stay selected. */
  multi?: boolean;
}

export interface DragDropConfig {
  version: number;
  items: { id: string; label: string }[];
  slots: { id: string; label: string }[];
}

export interface OrderStepsConfig {
  version: number;
  steps: { id: string; label: string }[];
}

export interface ToggleSwitchConfig {
  version: number;
  switches: { id: string; label: string; onLabel?: string; offLabel?: string }[];
}

export interface SliderTargetConfig {
  version: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  /**
   * Ordered value bands. The student's numeric position is encoded as the
   * `value` of the first band that contains it, so a child does not have to
   * land on an exact number to be judged correct.
   */
  bands: { value: string; upTo?: number }[];
}

/* --------------------------- Metadata parsing ------------------------------ */

/**
 * Blocks arrive from GraphQL with `metadata` as a JSON string and from the
 * manifest loader as a plain object. Parse once, defensively: malformed
 * educator content must degrade to a readable fallback, never crash the player.
 */
export function parseBlockConfig<T>(metadata: string | object | null | undefined): T | null {
  if (metadata == null) return null;
  if (typeof metadata === "object") return metadata as T;

  const trimmed = metadata.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === "object" ? (parsed as T) : null;
  } catch {
    return null;
  }
}

/* ------------------------- Canonical answer encoding ----------------------- */

/**
 * Every encoder emits lowercase, order-stable text so that the server's
 * `strings.ToLower(TrimSpace(...))` comparison is a reliable equality test and
 * the same string can be written by hand into a course manifest.
 */

export function encodeTapAnswer(selectedIds: string[]): string {
  return [...selectedIds]
    .map((id) => id.trim().toLowerCase())
    .sort()
    .join("+");
}

export function decodeTapAnswer(answer: string): string[] {
  return answer ? answer.split("+").filter(Boolean) : [];
}

/** `placements` maps slotId -> itemId; empty slots are omitted. */
export function encodeDragAnswer(placements: Record<string, string>): string {
  return Object.entries(placements)
    .filter(([, itemId]) => Boolean(itemId))
    .map(([slotId, itemId]) => `${slotId.trim().toLowerCase()}:${itemId.trim().toLowerCase()}`)
    .sort()
    .join(",");
}

export function decodeDragAnswer(answer: string): Record<string, string> {
  const placements: Record<string, string> = {};
  for (const pair of answer.split(",")) {
    const [slotId, itemId] = pair.split(":");
    if (slotId && itemId) placements[slotId] = itemId;
  }
  return placements;
}

export function encodeOrderAnswer(orderedIds: string[]): string {
  return orderedIds.map((id) => id.trim().toLowerCase()).join(">");
}

export function decodeOrderAnswer(answer: string): string[] {
  return answer ? answer.split(">").filter(Boolean) : [];
}

/** `states` maps switchId -> on/off. Every switch is encoded, including off ones. */
export function encodeSwitchAnswer(states: Record<string, boolean>): string {
  return Object.entries(states)
    .map(([id, on]) => `${id.trim().toLowerCase()}=${on ? "on" : "off"}`)
    .sort()
    .join(",");
}

export function decodeSwitchAnswer(answer: string): Record<string, boolean> {
  const states: Record<string, boolean> = {};
  for (const pair of answer.split(",")) {
    const [id, value] = pair.split("=");
    if (id && value) states[id] = value === "on";
  }
  return states;
}

/**
 * Maps a slider position onto its band label. Bands are scanned in order and
 * the first one whose `upTo` is at or above the value wins; a band without
 * `upTo` is the open-ended top band.
 */
export function encodeSliderAnswer(value: number, bands: SliderTargetConfig["bands"]): string {
  for (const band of bands) {
    if (band.upTo === undefined || value <= band.upTo) return band.value.trim().toLowerCase();
  }
  return bands.length > 0 ? bands[bands.length - 1].value.trim().toLowerCase() : "";
}
