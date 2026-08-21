/**
 * Adapters that turn a course manifest into the exact shapes the student
 * surfaces already consume.
 *
 * The manifest under `content/courses/<slug>/course.json` is the one source of
 * truth for a course: the same file seeds the database through content-sync and
 * feeds the catalog, syllabus and wave player here. That keeps a demo playable
 * before the course has been synced, without a second copy of the content
 * drifting out of step with the first.
 */

export interface ManifestLearnBlock {
  id: string;
  type: string;
  content: string;
  metadata?: string | Record<string, unknown>;
}

export interface ManifestEvaluateBlock {
  id: string;
  type: string;
  question: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  metadata?: string | Record<string, unknown>;
}

export interface ManifestWave {
  title: string;
  sequenceOrder: number;
  xpReward: number;
  maxReattempts: number;
  passingThreshold: number;
  estimatedDuration: number;
  difficulty: string;
  status?: string;
  learnBlocks: ManifestLearnBlock[];
  evaluateBlocks: ManifestEvaluateBlock[];
}

export interface ManifestLesson {
  title: string;
  sequenceOrder: number;
  status?: string;
  waves: ManifestWave[];
}

export interface CourseManifest {
  slug: string;
  title: string;
  description: string;
  gradeLevel: string;
  subject?: string;
  price?: number;
  version?: number;
  lessons: ManifestLesson[];
}

/** Stable, human-readable ids so a wave URL survives a re-seed. */
export function manifestLessonId(slug: string, lessonSequence: number): string {
  return `${slug}-l${lessonSequence}`;
}

export function manifestWaveId(slug: string, lessonSequence: number, waveSequence: number): string {
  return `${manifestLessonId(slug, lessonSequence)}-w${waveSequence}`;
}

/** Blocks reach the renderers with metadata as a JSON string, as GraphQL sends it. */
function serializeMetadata(metadata: string | Record<string, unknown> | undefined): string | null {
  if (metadata === undefined) return null;
  return typeof metadata === "string" ? metadata : JSON.stringify(metadata);
}

export function totalWaveCount(manifest: CourseManifest): number {
  return manifest.lessons.reduce((count, lesson) => count + lesson.waves.length, 0);
}

/** Catalog card shape. */
export function toCourseNode(manifest: CourseManifest) {
  return {
    id: manifest.slug,
    title: manifest.title,
    description: manifest.description,
    gradeLevel: manifest.gradeLevel,
    slug: manifest.slug,
    price: manifest.price ?? 0,
    myProgress: { completedWaves: 0, totalWaves: totalWaveCount(manifest) },
  };
}

/** Course page and syllabus shape. */
export function toCourseDetail(manifest: CourseManifest) {
  return {
    id: manifest.slug,
    title: manifest.title,
    description: manifest.description,
    gradeLevel: manifest.gradeLevel,
    isPublished: true,
    myProgress: { completedWaves: 0, totalWaves: totalWaveCount(manifest) },
    lessons: manifest.lessons.map((lesson) => ({
      id: manifestLessonId(manifest.slug, lesson.sequenceOrder),
      title: lesson.title,
      sequenceOrder: lesson.sequenceOrder,
      isPublished: (lesson.status ?? "published") === "published",
      waves: lesson.waves.map((wave) => ({
        id: manifestWaveId(manifest.slug, lesson.sequenceOrder, wave.sequenceOrder),
        title: wave.title,
        sequenceOrder: wave.sequenceOrder,
        xpReward: wave.xpReward,
        maxReattempts: wave.maxReattempts,
        difficulty: wave.difficulty,
        isPublished: (wave.status ?? "published") === "published",
        myProgress: null,
      })),
    })),
  };
}

/**
 * Wave player shape, including the sibling waves the player needs to offer a
 * "next wave" link.
 */
export function toPlayerWave(manifest: CourseManifest, waveId: string) {
  for (const lesson of manifest.lessons) {
    for (const wave of lesson.waves) {
      if (manifestWaveId(manifest.slug, lesson.sequenceOrder, wave.sequenceOrder) !== waveId) {
        continue;
      }
      const detail = toCourseDetail(manifest);
      return {
        id: waveId,
        title: wave.title,
        sequenceOrder: wave.sequenceOrder,
        xpReward: wave.xpReward,
        maxReattempts: wave.maxReattempts,
        passingThreshold: wave.passingThreshold,
        estimatedDuration: wave.estimatedDuration,
        difficulty: wave.difficulty,
        isPublished: (wave.status ?? "published") === "published",
        myProgress: null,
        learnBlocks: wave.learnBlocks.map((block) => ({
          id: block.id,
          type: block.type,
          content: block.content,
          metadata: serializeMetadata(block.metadata),
        })),
        evaluateBlocks: wave.evaluateBlocks.map((block) => ({
          id: block.id,
          type: block.type,
          question: block.question,
          options: block.options ?? null,
          correctAnswer: block.correctAnswer ?? null,
          explanation: block.explanation ?? null,
          metadata: serializeMetadata(block.metadata),
        })),
        lesson: {
          id: manifestLessonId(manifest.slug, lesson.sequenceOrder),
          title: lesson.title,
          course: {
            id: manifest.slug,
            title: manifest.title,
            lessons: detail.lessons,
          },
        },
      };
    }
  }
  return null;
}
