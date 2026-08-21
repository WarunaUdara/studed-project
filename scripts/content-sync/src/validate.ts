import {
  DIFFICULTIES,
  EVALUATE_BLOCK_TYPES,
  INTERACTIVE_EVALUATE_TYPES,
  GRADES,
  LEARN_BLOCK_TYPES,
  WAVE_STATUSES,
  type CourseManifest,
  type EvaluateBlock,
  type LearnBlock,
  type LessonDef,
  type ValidationIssue,
  type WaveDef,
} from "./types";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function push(issues: ValidationIssue[], path: string, message: string) {
  issues.push({ path, message });
}

function assertString(issues: ValidationIssue[], path: string, value: unknown, field: string) {
  if (typeof value !== "string" || value.trim() === "") {
    push(issues, `${path}.${field}`, `${field} must be a non-empty string`);
    return false;
  }
  return true;
}

function assertInt(
  issues: ValidationIssue[],
  path: string,
  value: unknown,
  field: string,
  min: number,
  max: number,
) {
  if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) {
    push(issues, `${path}.${field}`, `${field} must be an integer between ${min} and ${max}`);
    return false;
  }
  return true;
}

function validateMetadata(
  issues: ValidationIssue[],
  path: string,
  metadata: string | Record<string, unknown> | undefined,
) {
  if (metadata === undefined) return;
  if (typeof metadata === "string") {
    try {
      JSON.parse(metadata);
    } catch {
      push(issues, path, "metadata must be a valid JSON string or object");
    }
  }
}

function validateLearnBlock(issues: ValidationIssue[], path: string, block: LearnBlock) {
  if (typeof block.id !== "string" || block.id.trim() === "") {
    push(issues, path, "learn block id must be a non-empty string");
  }
  if (!LEARN_BLOCK_TYPES.includes(block.type)) {
    push(
      issues,
      `${path}.type`,
      `unknown learn block type "${block.type}". Allowed: ${LEARN_BLOCK_TYPES.join(", ")}`,
    );
  }
  assertString(issues, path, block.content, "content");
  validateMetadata(issues, `${path}.metadata`, block.metadata);
}


/**
 * Reads a block's metadata as an object regardless of whether the manifest
 * inlined it or stored it as a JSON string.
 */
function readConfig(metadata: string | Record<string, unknown> | undefined): Record<string, unknown> | null {
  if (metadata === undefined) return null;
  if (typeof metadata !== "string") return metadata;
  try {
    const parsed = JSON.parse(metadata);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function idsOf(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (entry && typeof entry === "object" ? (entry as { id?: unknown }).id : undefined))
    .filter((id): id is string => typeof id === "string");
}

/**
 * Checks that a manipulative question's `correctAnswer` is actually reachable
 * by manipulating the block it ships with. The encodings mirror
 * frontend/src/lib/content/interactiveBlocks.ts; a mismatch here means a
 * student could solve the puzzle correctly and still be marked wrong.
 */
function validateInteractiveBlock(issues: ValidationIssue[], path: string, block: EvaluateBlock) {
  const config = readConfig(block.metadata);
  if (!config) {
    push(issues, `${path}.metadata`, `${block.type} requires metadata describing the interaction`);
    return;
  }

  const answer = typeof block.correctAnswer === "string" ? block.correctAnswer : "";

  if (block.type === "tap_target") {
    const targets = idsOf(config.targets);
    if (targets.length < 2) {
      push(issues, `${path}.metadata.targets`, "tap_target requires at least 2 targets");
    }
    const chosen = answer.split("+").filter(Boolean);
    if (chosen.length === 0) {
      push(issues, `${path}.correctAnswer`, "tap_target correctAnswer must name at least one target id");
    }
    for (const id of chosen) {
      if (!targets.includes(id)) {
        push(issues, `${path}.correctAnswer`, `target "${id}" is not one of the block's targets`);
      }
    }
    const sorted = [...chosen].sort().join("+");
    if (answer !== sorted) {
      push(issues, `${path}.correctAnswer`, `tap ids must be sorted: expected "${sorted}"`);
    }
    return;
  }

  if (block.type === "drag_drop") {
    const items = idsOf(config.items);
    const slots = idsOf(config.slots);
    if (items.length === 0 || slots.length === 0) {
      push(issues, `${path}.metadata`, "drag_drop requires both items and slots");
    }
    const pairs = answer.split(",").filter(Boolean);
    if (pairs.length === 0) {
      push(issues, `${path}.correctAnswer`, "drag_drop correctAnswer must place at least one item");
    }
    for (const pair of pairs) {
      const [slotId, itemId] = pair.split(":");
      if (!slotId || !itemId) {
        push(issues, `${path}.correctAnswer`, `"${pair}" must be written as slotId:itemId`);
        continue;
      }
      if (!slots.includes(slotId)) push(issues, `${path}.correctAnswer`, `unknown slot "${slotId}"`);
      if (!items.includes(itemId)) push(issues, `${path}.correctAnswer`, `unknown item "${itemId}"`);
    }
    const sorted = [...pairs].sort().join(",");
    if (answer !== sorted) {
      push(issues, `${path}.correctAnswer`, `placements must be sorted by slot: expected "${sorted}"`);
    }
    return;
  }

  if (block.type === "order_steps") {
    const steps = idsOf(config.steps);
    if (steps.length < 2) {
      push(issues, `${path}.metadata.steps`, "order_steps requires at least 2 steps");
    }
    const order = answer.split(">").filter(Boolean);
    if (order.length !== steps.length || new Set(order).size !== order.length) {
      push(issues, `${path}.correctAnswer`, "correctAnswer must list every step id exactly once");
    }
    for (const id of order) {
      if (!steps.includes(id)) push(issues, `${path}.correctAnswer`, `unknown step "${id}"`);
    }
    return;
  }

  if (block.type === "toggle_switch") {
    const switches = idsOf(config.switches);
    if (switches.length === 0) {
      push(issues, `${path}.metadata.switches`, "toggle_switch requires at least one switch");
    }
    const states = answer.split(",").filter(Boolean);
    const named = new Set<string>();
    for (const state of states) {
      const [id, value] = state.split("=");
      if (!id || (value !== "on" && value !== "off")) {
        push(issues, `${path}.correctAnswer`, `"${state}" must be written as switchId=on or switchId=off`);
        continue;
      }
      if (!switches.includes(id)) push(issues, `${path}.correctAnswer`, `unknown switch "${id}"`);
      named.add(id);
    }
    for (const id of switches) {
      if (!named.has(id)) {
        push(issues, `${path}.correctAnswer`, `switch "${id}" is missing from correctAnswer`);
      }
    }
    const sorted = [...states].sort().join(",");
    if (answer !== sorted) {
      push(issues, `${path}.correctAnswer`, `switch states must be sorted: expected "${sorted}"`);
    }
    return;
  }

  // slider_target
  const bands = Array.isArray(config.bands) ? config.bands : [];
  const bandValues = bands
    .map((band) => (band && typeof band === "object" ? (band as { value?: unknown }).value : undefined))
    .filter((value): value is string => typeof value === "string");
  if (bandValues.length < 2) {
    push(issues, `${path}.metadata.bands`, "slider_target requires at least 2 bands");
  }
  if (!bandValues.includes(answer)) {
    push(issues, `${path}.correctAnswer`, `correctAnswer must be one of the band values: ${bandValues.join(", ")}`);
  }
}

function validateEvaluateBlock(issues: ValidationIssue[], path: string, block: EvaluateBlock) {
  if (typeof block.id !== "string" || block.id.trim() === "") {
    push(issues, path, "evaluate block id must be a non-empty string");
  }
  if (!EVALUATE_BLOCK_TYPES.includes(block.type)) {
    push(
      issues,
      `${path}.type`,
      `unknown evaluate block type "${block.type}". Allowed: ${EVALUATE_BLOCK_TYPES.join(", ")}`,
    );
  }
  assertString(issues, path, block.question, "question");

  if (block.type === "multiple_choice") {
    if (!Array.isArray(block.options) || block.options.length < 2) {
      push(issues, `${path}.options`, "multiple_choice requires at least 2 options");
    } else if (block.options.length > 6) {
      push(issues, `${path}.options`, "multiple_choice allows at most 6 options");
    }
    if (
      typeof block.correctAnswer !== "string" ||
      !block.options?.includes(block.correctAnswer)
    ) {
      push(issues, `${path}.correctAnswer`, "correctAnswer must be one of the options verbatim");
    }
  } else if (block.type === "true_false") {
    if (block.options?.length) {
      push(issues, `${path}.options`, "true_false options are auto-generated; omit options");
    }
    if (block.correctAnswer !== "True" && block.correctAnswer !== "False") {
      push(issues, `${path}.correctAnswer`, "correctAnswer must be exactly 'True' or 'False'");
    }
  } else if ((INTERACTIVE_EVALUATE_TYPES as readonly string[]).includes(block.type)) {
    if (assertString(issues, path, block.correctAnswer, "correctAnswer")) {
      validateInteractiveBlock(issues, path, block);
    }
  } else {
    assertString(issues, path, block.correctAnswer, "correctAnswer");
  }
  assertString(issues, path, block.explanation, "explanation");
  validateMetadata(issues, `${path}.metadata`, block.metadata);
}

function validateWave(issues: ValidationIssue[], path: string, wave: WaveDef) {
  assertString(issues, path, wave.title, "title");
  assertInt(issues, path, wave.sequenceOrder, "sequenceOrder", 1, 1000);
  assertInt(issues, path, wave.xpReward, "xpReward", 0, 100000);
  assertInt(issues, path, wave.maxReattempts, "maxReattempts", 1, 100);
  assertInt(issues, path, wave.passingThreshold, "passingThreshold", 0, 100);
  assertInt(issues, path, wave.estimatedDuration, "estimatedDuration", 1, 600);

  const status = wave.status ?? "published";
  if (!WAVE_STATUSES.includes(status)) {
    push(issues, `${path}.status`, `unknown status "${status}". Allowed: published, draft`);
  }

  if (!DIFFICULTIES.includes(wave.difficulty)) {
    push(issues, `${path}.difficulty`, `unknown difficulty "${wave.difficulty}". Allowed: ${DIFFICULTIES.join(", ")}`);
  }

  if (status === "published") {
    if (!Array.isArray(wave.learnBlocks) || wave.learnBlocks.length === 0) {
      push(issues, `${path}.learnBlocks`, "published wave requires at least one learn block");
    }
    if (!Array.isArray(wave.evaluateBlocks) || wave.evaluateBlocks.length === 0) {
      push(issues, `${path}.evaluateBlocks`, "published wave requires at least one evaluate block");
    }
  }

  const seenIds = new Set<string>();
  for (const block of wave.learnBlocks ?? []) {
    if (seenIds.has(block.id)) {
      push(issues, `${path}.learnBlocks`, `duplicate learn block id "${block.id}"`);
    }
    seenIds.add(block.id);
    validateLearnBlock(issues, `${path}.learnBlocks[${block.id}]`, block);
  }

  const seenEvalIds = new Set<string>();
  for (const block of wave.evaluateBlocks ?? []) {
    if (seenEvalIds.has(block.id)) {
      push(issues, `${path}.evaluateBlocks`, `duplicate evaluate block id "${block.id}"`);
    }
    seenEvalIds.add(block.id);
    validateEvaluateBlock(issues, `${path}.evaluateBlocks[${block.id}]`, block);
  }
}

function validateLesson(issues: ValidationIssue[], path: string, lesson: LessonDef) {
  assertString(issues, path, lesson.title, "title");
  assertInt(issues, path, lesson.sequenceOrder, "sequenceOrder", 1, 1000);

  const status = lesson.status ?? "published";
  if (!WAVE_STATUSES.includes(status)) {
    push(issues, `${path}.status`, `unknown status "${status}". Allowed: published, draft`);
  }

  if (status === "published" && (!Array.isArray(lesson.waves) || lesson.waves.length === 0)) {
    push(issues, `${path}.waves`, "published lesson requires at least one wave");
  }

  const seenSequences = new Set<number>();
  for (const wave of lesson.waves ?? []) {
    if (seenSequences.has(wave.sequenceOrder)) {
      push(issues, `${path}.waves`, `duplicate sequenceOrder ${wave.sequenceOrder}`);
    }
    seenSequences.add(wave.sequenceOrder);
    validateWave(issues, `${path}.waves[${wave.sequenceOrder}]`, wave);
  }
}

export function validateManifest(raw: unknown): { course: CourseManifest; issues: ValidationIssue[] } | { issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { issues: [{ path: "$", message: "course manifest must be a JSON object" }] };
  }

  const course = raw as Record<string, unknown>;

  assertString(issues, "$", course.slug, "slug");
  if (typeof course.slug === "string" && !slugPattern.test(course.slug)) {
    push(issues, "$.slug", `slug "${course.slug}" must match [a-z0-9]+(-[a-z0-9]+)*`);
  }
  assertString(issues, "$", course.title, "title");
  assertString(issues, "$", course.description, "description");

  if (!GRADES.includes(course.gradeLevel as never)) {
    push(issues, "$.gradeLevel", `unknown gradeLevel "${course.gradeLevel}". Allowed: ${GRADES.join(", ")}`);
  }

  if (course.price !== undefined && (typeof course.price !== "number" || course.price < 0)) {
    push(issues, "$.price", "price must be a non-negative number");
  }
  if (course.version !== undefined && (!Number.isInteger(course.version) || (course.version as number) < 1)) {
    push(issues, "$.version", "version must be a positive integer");
  }

  if (!Array.isArray(course.lessons) || course.lessons.length === 0) {
    push(issues, "$.lessons", "course requires at least one lesson");
  } else {
    const seenSequences = new Set<number>();
    for (const lesson of course.lessons) {
      if (typeof lesson !== "object" || lesson === null) {
        push(issues, "$.lessons", "each lesson must be an object");
        continue;
      }
      const seq = (lesson as { sequenceOrder?: unknown }).sequenceOrder;
      if (typeof seq === "number" && seenSequences.has(seq)) {
        push(issues, "$.lessons", `duplicate lesson sequenceOrder ${seq}`);
      }
      if (typeof seq === "number") seenSequences.add(seq);
      validateLesson(issues, `$.lessons[${seq ?? "?"}]`, lesson as unknown as LessonDef);
    }
  }

  if (issues.length > 0) {
    return { issues };
  }
  return { course: raw as CourseManifest, issues };
}

export function formatIssues(issues: ValidationIssue[]): string {
  return issues.map((i) => `  - ${i.path}: ${i.message}`).join("\n");
}
