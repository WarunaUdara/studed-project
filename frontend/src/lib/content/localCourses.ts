import ictGrade68 from "@content/courses/ict-grade-6-8/course.json";
import mathFoundation from "@content/courses/math-foundation/course.json";
import physicsGrade45 from "@content/courses/physics-grade-4-5/course.json";
import type { CourseManifest } from "./manifest";
import { manifestWaveId, toCourseDetail, toCourseNode, toPlayerWave } from "./manifest";

/**
 * Courses shipped with the app as manifests.
 *
 * These are the same files content-sync seeds into the database. Loading them
 * here means a freshly cloned checkout can play the flagship course before any
 * backend is running, and the seeded version stays identical because both come
 * from one file.
 */
const LOCAL_MANIFESTS: CourseManifest[] = [
  physicsGrade45 as CourseManifest,
  mathFoundation as CourseManifest,
  ictGrade68 as CourseManifest,
];

export function findLocalCourse(courseId: string): CourseManifest | null {
  return LOCAL_MANIFESTS.find((manifest) => manifest.slug === courseId) ?? null;
}

export function localCourseNodes() {
  return LOCAL_MANIFESTS.map(toCourseNode);
}

export function localCourseDetail(courseId: string) {
  const manifest = findLocalCourse(courseId);
  return manifest ? toCourseDetail(manifest) : null;
}

export function findLocalWave(waveId: string) {
  for (const manifest of LOCAL_MANIFESTS) {
    const wave = toPlayerWave(manifest, waveId);
    if (wave) return wave;
  }
  return null;
}

/** First playable wave of a local course, for "start learning" entry points. */
export function firstLocalWaveId(courseId: string): string | null {
  const manifest = findLocalCourse(courseId);
  const lesson = manifest?.lessons[0];
  const wave = lesson?.waves[0];
  if (!manifest || !lesson || !wave) return null;
  return manifestWaveId(manifest.slug, lesson.sequenceOrder, wave.sequenceOrder);
}
