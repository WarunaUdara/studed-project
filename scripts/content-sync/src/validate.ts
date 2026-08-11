import {
  DIFFICULTIES,
  EVALUATE_BLOCK_TYPES,
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
