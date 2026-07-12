import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  Layers,
  Plus,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "urql";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { EDUCATOR_COURSES_QUERY } from "@/graphql/courses";

interface WaveNode {
  id: string;
  isPublished: boolean;
  xpReward: number;
  myProgress?: { status: string; attemptsCount: number } | null;
}

interface LessonNode {
  id: string;
  isPublished: boolean;
  waves: WaveNode[];
}

interface CourseNode {
  id: string;
  title: string;
  isPublished: boolean;
  createdAt: string;
  lessons?: LessonNode[] | null;
  myProgress?: { completedWaves: number; totalWaves: number } | null;
}

export const Route = createFileRoute("/educator/_layout/")({
  component: EducatorDashboardPage,
});

function EducatorDashboardPage() {
  const [{ data, fetching, error }] = useQuery({
    query: EDUCATOR_COURSES_QUERY,
    variables: { filter: {} },
  });

  const courses: CourseNode[] =
    data?.courses?.edges?.map((edge: { node: CourseNode }) => edge.node) ?? [];

  const stats = useMemo(() => {
    const published = courses.filter((c) => c.isPublished);
    const drafts = courses.filter((c) => !c.isPublished);
    let totalLessons = 0;
    let totalWaves = 0;
    let publishedWaves = 0;
    let totalXp = 0;

    for (const c of courses) {
      for (const l of c.lessons ?? []) {
        totalLessons++;
        for (const w of l.waves ?? []) {
          totalWaves++;
          if (w.isPublished) {
            publishedWaves++;
            totalXp += w.xpReward ?? 0;
          }
        }
      }
    }

    return { published, drafts, totalLessons, totalWaves, publishedWaves, totalXp };
  }, [courses]);

  const recentCourses = courses.slice(0, 8);

  const statCards = [
    {
      label: "Total Courses",
      value: courses.length,
      icon: BookOpen,
      color: "text-primary",
      bg: "bg-primary/10",
      sub: `${stats.published.length} published`,
    },
    {
      label: "Total Lessons",
      value: stats.totalLessons,
      icon: Layers,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      sub: `Across all courses`,
    },
    {
      label: "Waves Published",
      value: stats.publishedWaves,
      icon: CheckCircle,
      color: "text-success",
      bg: "bg-success/10",
      sub: `${stats.totalWaves} total waves`,
    },
    {
      label: "XP Available",
      value: stats.totalXp.toLocaleString(),
      icon: Zap,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      sub: "Across published waves",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Educator Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your courses, lessons, and track content performance.
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <Link to="/educator/courses">
            <Button variant="outline">
              <BookOpen className="mr-2 h-4 w-4" />
              My Courses
            </Button>
          </Link>
          <Link to="/educator/courses/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Course
            </Button>
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">Failed to load stats.</p>}

      {/* Stat cards */}
      {fetching ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.bg}`}>
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                    </div>
                    <p className="text-3xl font-bold tabular-nums">{stat.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Course status overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent courses list */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Your Courses</CardTitle>
            <Link to="/educator/courses">
              <Button variant="ghost" size="sm" className="text-xs">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {fetching ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : recentCourses.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No courses yet.</p>
                <Link to="/educator/courses/new">
                  <Button size="sm">
                    <Plus className="mr-1 h-4 w-4" /> Create your first course
                  </Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y">
                {recentCourses.map((course) => {
                  const lessons = course.lessons ?? [];
                  const waves = lessons.flatMap((l) => l.waves ?? []);
                  const publishedWaves = waves.filter((w) => w.isPublished).length;
                  const completionRatio =
                    waves.length > 0 ? Math.round((publishedWaves / waves.length) * 100) : 0;

                  return (
                    <li key={course.id} className="flex items-center gap-4 py-3">
                      <ProgressRing value={completionRatio} size={40} strokeWidth={4} className="text-primary shrink-0">
                        <span className="text-[9px] font-bold">{completionRatio}%</span>
                      </ProgressRing>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">{course.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {lessons.length} lessons · {waves.length} waves · {publishedWaves} published
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            course.isPublished
                              ? "bg-success/15 text-success"
                              : "bg-amber-500/15 text-amber-600"
                          }`}
                        >
                          {course.isPublished ? "Live" : "Draft"}
                        </span>
                        <Link to="/educator/courses/$courseId" params={{ courseId: course.id }}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Quick stats sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Content Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <HealthBar
                label="Published Courses"
                value={stats.published.length}
                total={courses.length}
                color="bg-success"
              />
              <HealthBar
                label="Published Waves"
                value={stats.publishedWaves}
                total={stats.totalWaves}
                color="bg-primary"
              />
              <HealthBar
                label="Draft Courses"
                value={stats.drafts.length}
                total={courses.length}
                color="bg-amber-500"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Total XP available</span>
              </div>
              <p className="text-2xl font-bold text-amber-500">{stats.totalXp.toLocaleString()} XP</p>
              <p className="text-xs text-muted-foreground">Across {stats.publishedWaves} published waves</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium">Quick Actions</p>
              <div className="space-y-2">
                <Link to="/educator/courses/new" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                    <Plus className="mr-2 h-3.5 w-3.5" /> New Course
                  </Button>
                </Link>
                <Link to="/educator/courses" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                    <BookOpen className="mr-2 h-3.5 w-3.5" /> Manage Courses
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function HealthBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">
          {value}/{total}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
