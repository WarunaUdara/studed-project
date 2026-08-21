import { describe, expect, it } from "vitest";
import { resumePoints } from "./DashboardContinueLearning";
import { activeDaysThisWeek } from "./DashboardStreakWidget";

describe("activeDaysThisWeek", () => {
  // Wednesday 2026-08-19. Monday of that week is 2026-08-17.
  const wednesday = new Date("2026-08-19T10:00:00.000Z");

  it("marks nothing when there is no streak", () => {
    expect(activeDaysThisWeek(0, null, wednesday)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it("marks nothing when the streak has no last-active date", () => {
    expect(activeDaysThisWeek(5, null, wednesday).some(Boolean)).toBe(false);
  });

  it("marks exactly the days a 3-day streak covers", () => {
    // Active Mon, Tue, Wed.
    const week = activeDaysThisWeek(3, "2026-08-19T09:00:00.000Z", wednesday);
    expect(week).toEqual([true, true, true, false, false, false, false]);
  });

  it("does not mark past days the student was absent for", () => {
    // A 1-day streak ending Wednesday means Monday and Tuesday were missed.
    // The old widget marked every past weekday regardless.
    const week = activeDaysThisWeek(1, "2026-08-19T09:00:00.000Z", wednesday);
    expect(week).toEqual([false, false, true, false, false, false, false]);
  });

  it("never marks days still in the future", () => {
    const week = activeDaysThisWeek(3, "2026-08-19T09:00:00.000Z", wednesday);
    expect(week.slice(3).every((d) => d === false)).toBe(true);
  });

  it("shows weekend study, which a Mon-Fri strip could not", () => {
    // Sunday 2026-08-23, a 2-day streak covering Saturday and Sunday.
    const sunday = new Date("2026-08-23T10:00:00.000Z");
    const week = activeDaysThisWeek(2, "2026-08-23T09:00:00.000Z", sunday);
    expect(week).toEqual([false, false, false, false, false, true, true]);
  });

  it("clips a streak that started before this week", () => {
    // A 30-day streak ending Wednesday: only Mon-Wed of this week light up.
    const week = activeDaysThisWeek(30, "2026-08-19T09:00:00.000Z", wednesday);
    expect(week).toEqual([true, true, true, false, false, false, false]);
  });

  it("marks nothing for a streak that ended in an earlier week", () => {
    const week = activeDaysThisWeek(2, "2026-08-09T09:00:00.000Z", wednesday);
    expect(week.some(Boolean)).toBe(false);
  });

  it("ignores an unparseable date rather than throwing", () => {
    expect(activeDaysThisWeek(3, "not a date", wednesday).some(Boolean)).toBe(false);
  });
});

describe("resumePoints", () => {
  const course = (
    id: string,
    completedWaves: number,
    totalWaves: number,
    waveStatuses: string[] = [],
  ) => ({
    id,
    title: `Course ${id}`,
    slug: id,
    gradeLevel: "G10",
    myProgress: { completedWaves, totalWaves },
    lessons: [
      {
        id: `${id}-l1`,
        title: "Lesson 1",
        sequenceOrder: 1,
        isPublished: true,
        waves: waveStatuses.map((status, i) => ({
          id: `${id}-w${i + 1}`,
          myProgress: { status },
        })),
      },
    ],
  });

  it("reports the percentage through each course", () => {
    const [point] = resumePoints([course("a", 3, 4)]);
    expect(point.percent).toBe(75);
    expect(point.completedWaves).toBe(3);
    expect(point.totalWaves).toBe(4);
  });

  it("puts a started course ahead of an untouched one", () => {
    const points = resumePoints([course("fresh", 0, 5), course("underway", 2, 5)]);
    expect(points[0].course.id).toBe("underway");
  });

  it("sinks a finished course below one still in progress", () => {
    const points = resumePoints([course("done", 5, 5), course("underway", 1, 5)]);
    expect(points[0].course.id).toBe("underway");
    expect(points[1].course.id).toBe("done");
  });

  it("points at the first wave that is not complete", () => {
    const [point] = resumePoints([
      course("a", 2, 3, ["COMPLETED", "COMPLETED", "AVAILABLE"]),
    ]);
    expect(point.nextWaveId).toBe("a-w3");
  });

  it("has no next wave once every wave is complete", () => {
    const [point] = resumePoints([course("a", 2, 2, ["COMPLETED", "COMPLETED"])]);
    expect(point.nextWaveId).toBeNull();
  });

  it("does not divide by zero on a course with no waves", () => {
    const [point] = resumePoints([course("empty", 0, 0)]);
    expect(point.percent).toBe(0);
  });

  it("handles a course with no lessons at all", () => {
    const points = resumePoints([
      { id: "x", title: "X", slug: "x", gradeLevel: "G10", lessons: null },
    ]);
    expect(points[0].totalWaves).toBe(0);
    expect(points[0].nextWaveId).toBeNull();
  });
});
