import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Plus, TrendingUp, Users } from "lucide-react";
import { useQuery } from "urql";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { COURSES_QUERY } from "@/graphql/courses";

interface CourseNode {
  id: string;
  title: string;
  isPublished: boolean;
}

export const Route = createFileRoute("/educator/_layout/")({
  component: EducatorDashboardPage,
});

function EducatorDashboardPage() {
  const [{ data, fetching, error }] = useQuery({
    query: COURSES_QUERY,
    variables: { filter: {} },
  });

  const courses = data?.courses?.edges?.map((edge: { node: CourseNode }) => edge.node) ?? [];
  const publishedCount = courses.filter((c: CourseNode) => c.isPublished).length;
  const draftCount = courses.length - publishedCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Educator Dashboard</h1>
          <p className="text-muted-foreground">Manage your courses and track content.</p>
        </div>
        <div className="flex gap-3">
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

      {fetching && <p className="text-muted-foreground">Loading stats...</p>}
      {error && <p className="text-destructive">Failed to load stats.</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Courses"
          value={courses.length}
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard
          title="Published"
          value={publishedCount}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard title="Drafts" value={draftCount} icon={<Users className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Courses</CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <p className="text-muted-foreground">No courses yet.</p>
          ) : (
            <ul className="divide-y">
              {courses.slice(0, 5).map((course: CourseNode) => (
                <li key={course.id} className="flex items-center justify-between py-3">
                  <span className="font-medium">{course.title}</span>
                  <span
                    className={
                      course.isPublished ? "text-sm text-green-600" : "text-sm text-amber-600"
                    }
                  >
                    {course.isPublished ? "Published" : "Draft"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
