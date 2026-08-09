import type { GraphQLClient } from "./client";
import type { CourseManifest, Difficulty, LessonDef, WaveDef } from "./types";

interface CourseNode {
  id: string;
  title: string;
  slug: string;
  lessons: {
    id: string;
    title: string;
    sequenceOrder: number;
    waves: { id: string; title: string }[];
  }[];
}

interface LearnBlockPayload {
  id: string;
  type: string;
  content: string;
  metadata?: string;
}

interface EvaluateBlockPayload {
  id: string;
  type: string;
  question: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  metadata?: string;
}

function serializeMetadata(metadata: unknown): string | undefined {
  if (metadata === undefined) return undefined;
  return typeof metadata === "string" ? metadata : JSON.stringify(metadata);
}

function toLearnPayload(blocks: CourseManifest["lessons"][number]["waves"][number]["learnBlocks"]): LearnBlockPayload[] {
  return blocks.map((b) => ({
    id: b.id,
    type: b.type,
    content: b.content,
    metadata: serializeMetadata(b.metadata),
  }));
}

function toEvaluatePayload(blocks: CourseManifest["lessons"][number]["waves"][number]["evaluateBlocks"]): EvaluateBlockPayload[] {
  return blocks.map((b) => ({
    id: b.id,
    type: b.type === "true_false" ? "multiple_choice" : b.type,
    question: b.question,
    options: b.type === "true_false" ? ["True", "False"] : b.options,
    correctAnswer: b.correctAnswer,
    explanation: b.explanation,
    metadata: serializeMetadata(b.metadata),
  }));
}

function waveInput(lessonId: string, wave: WaveDef) {
  return {
    lessonId,
    input: {
      title: wave.title,
      sequenceOrder: wave.sequenceOrder,
      xpReward: wave.xpReward,
      maxReattempts: wave.maxReattempts,
      passingThreshold: wave.passingThreshold,
      estimatedDuration: wave.estimatedDuration,
      difficulty: wave.difficulty as Difficulty,
      learnBlocks: toLearnPayload(wave.learnBlocks),
      evaluateBlocks: toEvaluatePayload(wave.evaluateBlocks),
    },
  };
}

export async function findCourseBySlug(client: GraphQLClient, slug: string): Promise<string | null> {
  const data = await client.request<{
    courses: { edges: { node: { id: string; slug: string } }[] };
  }>(
    `query Courses($filter: CourseFilter, $pagination: PaginationInput) {
      courses(filter: $filter, pagination: $pagination) {
        edges { node { id slug } }
      }
    }`,
    { filter: {}, pagination: { first: 200 } },
  );
  return data.courses.edges.find((e) => e.node.slug === slug)?.node.id ?? null;
}

async function getCourse(client: GraphQLClient, id: string): Promise<CourseNode> {
  return client.request<{ course: CourseNode }>(
    `query Course($id: ID!) {
      course(id: $id) {
        id title slug
        lessons {
          id title sequenceOrder
          waves { id title }
        }
      }
    }`,
    { id },
  ).then((d) => d.course);
}

async function upsertCourse(client: GraphQLClient, manifest: CourseManifest): Promise<{ course: CourseNode; created: boolean }> {
  const existingId = await findCourseBySlug(client, manifest.slug);
  const input = {
    title: manifest.title,
    description: manifest.description,
    slug: manifest.slug,
    gradeLevel: manifest.gradeLevel,
    price: manifest.price ?? 0,
  };

  if (existingId) {
    await client.request(
      `mutation UpdateCourse($id: ID!, $input: UpdateCourseInput!) {
        updateCourse(id: $id, input: $input) { id }
      }`,
      { id: existingId, input },
    );
    const course = await getCourse(client, existingId);
    return { course, created: false };
  }

  const data = await client.request<{ createCourse: { id: string } }>(
    `mutation CreateCourse($input: CreateCourseInput!) {
      createCourse(input: $input) { id }
    }`,
    { input },
  );
  const course = await getCourse(client, data.createCourse.id);
  return { course, created: true };
}

async function upsertLesson(
  client: GraphQLClient,
  course: CourseNode,
  lesson: LessonDef,
): Promise<{ id: string; created: boolean }> {
  const existing = course.lessons.find((l) => l.title === lesson.title);
  if (existing) {
    await client.request(
      `mutation UpdateLesson($id: ID!, $input: UpdateLessonInput!) {
        updateLesson(id: $id, input: $input) { id }
      }`,
      { id: existing.id, input: { title: lesson.title, sequenceOrder: lesson.sequenceOrder } },
    );
    return { id: existing.id, created: false };
  }

  const data = await client.request<{ createLesson: { id: string } }>(
    `mutation CreateLesson($courseId: ID!, $input: CreateLessonInput!) {
      createLesson(courseId: $courseId, input: $input) { id }
    }`,
    { courseId: course.id, input: { title: lesson.title, sequenceOrder: lesson.sequenceOrder } },
  );
  return { id: data.createLesson.id, created: true };
}

async function upsertWave(
  client: GraphQLClient,
  lesson: { id: string; waves: { id: string; title: string }[] },
  wave: WaveDef,
): Promise<{ id: string; created: boolean }> {
  const existing = lesson.waves.find((w) => w.title === wave.title);
  if (existing) {
    await client.request(
      `mutation UpdateWave($id: ID!, $input: UpdateWaveInput!) {
        updateWave(id: $id, input: $input) { id }
      }`,
      { id: existing.id, input: waveInput(lesson.id, wave).input },
    );
    return { id: existing.id, created: false };
  }

  const data = await client.request<{ createWave: { id: string } }>(
    `mutation CreateWave($lessonId: ID!, $input: CreateWaveInput!) {
      createWave(lessonId: $lessonId, input: $input) { id }
    }`,
    waveInput(lesson.id, wave),
  );
  return { id: data.createWave.id, created: true };
}

async function publish(client: GraphQLClient, entity: "course" | "lesson" | "wave", id: string): Promise<void> {
  const mutation =
    entity === "course"
      ? `mutation PublishCourse($id: ID!) { publishCourse(id: $id) { id } }`
      : entity === "lesson"
        ? `mutation PublishLesson($id: ID!) { publishLesson(id: $id) { id } }`
        : `mutation PublishWave($id: ID!) { publishWave(id: $id) { id } }`;
  await client.request(mutation, { id });
}

export interface SyncReport {
  slug: string;
  title: string;
  course: "created" | "updated";
  lessons: {
    title: string;
    status: "created" | "updated" | "skipped";
    waves: { title: string; status: "created" | "updated" | "skipped" }[];
  }[];
}

export async function syncCourse(client: GraphQLClient, manifest: CourseManifest): Promise<SyncReport> {
  const { course, created } = await upsertCourse(client, manifest);

  await publish(client, "course", course.id);

  const report: SyncReport = {
    slug: manifest.slug,
    title: manifest.title,
    course: created ? "created" : "updated",
    lessons: [],
  };

  const lessonsToSync = manifest.lessons.filter(
    (l) => (l.status ?? "published") === "published",
  );

  for (const lesson of lessonsToSync) {
    const wavesToSync = lesson.waves.filter((w) => (w.status ?? "published") === "published");
    if (wavesToSync.length === 0) {
      report.lessons.push({ title: lesson.title, status: "skipped", waves: [] });
      continue;
    }

    const { id: lessonId, created: lessonCreated } = await upsertLesson(client, course, lesson);
    await publish(client, "lesson", lessonId);

    const currentLesson = { id: lessonId, waves: course.lessons.find((l) => l.id === lessonId)?.waves ?? [] };
    const lessonReport: SyncReport["lessons"][number] = {
      title: lesson.title,
      status: lessonCreated ? "created" : "updated",
      waves: [],
    };

    for (const wave of wavesToSync) {
      const { id: waveId, created: waveCreated } = await upsertWave(client, currentLesson, wave);
      await publish(client, "wave", waveId);
      lessonReport.waves.push({
        title: wave.title,
        status: waveCreated ? "created" : "updated",
      });
    }

    report.lessons.push(lessonReport);
  }

  return report;
}
