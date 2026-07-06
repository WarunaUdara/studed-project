import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, CheckCircle, PlayCircle } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "urql";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { COURSE_PLAYER_QUERY } from "@/graphql/student";

interface Wave {
  id: string;
  title: string;
  sequenceOrder: number;
  xpReward: number;
  difficulty: string;
  isPublished: boolean;
  myProgress?: {
    status: string;
    attemptsCount: number;
    highestScore?: number | null;
  } | null;
}

interface Lesson {
  id: string;
  title: string;
  sequenceOrder: number;
  isPublished: boolean;
  waves: Wave[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  gradeLevel: string;
  isPublished: boolean;
  myProgress?: {
    completedWaves: number;
    totalWaves: number;
  } | null;
  lessons: Lesson[];
}

export const Route = createFileRoute("/courses/$courseId")({
  component: CoursePlayerPage,
});

function CoursePlayerPage() {
  const { courseId } = Route.useParams();
  const [{ data, fetching, error }] = useQuery({
    query: COURSE_PLAYER_QUERY,
    variables: { id: courseId },
  });

  const course: Course | undefined = data?.course;

  const completedWaves = course?.myProgress?.completedWaves ?? 0;
  const totalWaves = course?.myProgress?.totalWaves ?? 0;
  const progress = totalWaves > 0 ? Math.round((completedWaves / totalWaves) * 100) : 0;

  const lessons = useMemo(() => course?.lessons ?? [], [course]);

  if (fetching) {
    return (
      <main className="min-h-screen bg-background p-6">
        <p className="text-muted-foreground">Loading course...</p>
      </main>
    );
  }

  if (error || !course) {
    return (
      <main className="min-h-screen bg-background p-6">
        <p className="text-destructive">Failed to load course.</p>
        <Link to="/courses">
          <Button variant="outline" className="mt-4">
            Back to courses
          </Button>
        </Link>
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 pt-6 sm:p-6 sm:pt-8">
      <Link to="/courses">
        <Button variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>
      </Link>

      <div className="mt-6 mb-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-secondary px-3 py-1 text-sm">{course.gradeLevel}</span>
          <span className="text-sm text-muted-foreground">
            {course.isPublished ? "Published" : "Draft"}
          </span>
        </div>
        <h1 className="text-3xl font-bold">{course.title}</h1>
        <p className="max-w-2xl text-muted-foreground">{course.description}</p>

        <div className="max-w-xl">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completedWaves} of {totalWaves} waves completed
            </span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-secondary">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {lessons.map((lesson) => (
          <Card key={lesson.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5" />
                {lesson.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lesson.waves.length === 0 ? (
                <p className="text-sm text-muted-foreground">No waves in this lesson yet.</p>
              ) : (
                lesson.waves.map((wave) => {
                  const isCompleted = wave.myProgress?.status === "COMPLETED";
                  return (
                    <Link key={wave.id} to="/waves/$waveId" params={{ waveId: wave.id }}>
                      <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted">
                        <div className="flex items-center gap-3">
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <PlayCircle className="h-5 w-5 text-primary" />
                          )}
                          <div>
                            <p className="font-medium">{wave.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {wave.difficulty} · {wave.xpReward} XP
                              {wave.myProgress?.highestScore !== null &&
                                wave.myProgress?.highestScore !== undefined &&
                                ` · Best: ${wave.myProgress.highestScore}%`}
                            </p>
                          </div>
                        </div>
                        {isCompleted ? (
                          <span className="text-sm font-medium text-green-600">Completed</span>
                        ) : (
                          <Button size="sm">Start</Button>
                        )}
                      </div>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
