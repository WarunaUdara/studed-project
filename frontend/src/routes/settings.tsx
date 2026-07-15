import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Award, BookOpen, CheckCircle, Globe, Shield, User as UserIcon, Zap, Save } from "lucide-react";
import { useQuery, useMutation } from "urql";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { XPBar } from "@/components/gamification/XPBar";
import { StudentShell } from "@/components/layout/StudentShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import { MY_ENROLLMENTS_QUERY } from "@/graphql/courses";
import { levelFromXp } from "@/lib/gamification";
import { useAuthStore, type Grade } from "@/stores/auth";

const LEVEL_NAMES = [
  "Rookie",
  "Novice",
  "Learner",
  "Scholar",
  "Expert",
  "Master",
  "Grand Master",
  "Enlightened",
];

const UPDATE_ME_MUTATION = `
  mutation UpdateMe($input: UpdateMeInput!) {
    updateMe(input: $input) {
      id
      fullName
      grade
      preferredLanguage
    }
  }
`;

const GRADES = [
  { value: "G1", label: "Grade 1" },
  { value: "G2", label: "Grade 2" },
  { value: "G3", label: "Grade 3" },
  { value: "G4", label: "Grade 4" },
  { value: "G5", label: "Grade 5" },
  { value: "G6", label: "Grade 6" },
  { value: "G7", label: "Grade 7" },
  { value: "G8", label: "Grade 8" },
  { value: "G9", label: "Grade 9" },
  { value: "G10", label: "Grade 10" },
  { value: "G11", label: "Grade 11" },
  { value: "OL", label: "G.C.E. O/L" },
  { value: "AL", label: "G.C.E. A/L" },
];

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [grade, setGrade] = useState<Grade>((user?.grade as Grade) ?? "G10");
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferredLanguage ?? "en");
  const [isSaving, setIsSaving] = useState(false);

  const totalXp = user?.totalXp ?? 0;
  const { level, progress } = levelFromXp(totalXp);
  const levelName = LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)] ?? "Learner";

  const [{ data }] = useQuery({ query: MY_ENROLLMENTS_QUERY });
  const [, updateProfile] = useMutation(UPDATE_ME_MUTATION);

  const enrollments = data?.myEnrollments ?? [];
  const completedCourses = enrollments.filter(
    (c: { myProgress?: { completedWaves: number; totalWaves: number } | null }) => {
      const p = c.myProgress;
      return p && p.totalWaves > 0 && p.completedWaves === p.totalWaves;
    },
  ).length;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast({
        type: "error",
        title: "Validation Error",
        message: "Full name cannot be empty.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateProfile({
        input: {
          fullName: fullName.trim(),
          grade: grade,
          preferredLanguage: preferredLanguage,
        },
      });

      if (res.error) {
        toast({
          type: "error",
          title: "Update Failed",
          message: res.error.message,
        });
      } else if (res.data?.updateMe) {
        setUser({
          ...user!,
          fullName: res.data.updateMe.fullName,
          grade: res.data.updateMe.grade,
          preferredLanguage: res.data.updateMe.preferredLanguage,
        });
        toast({
          type: "success",
          title: "Settings Saved",
          message: "Your profile details have been successfully updated.",
        });
      }
    } catch (err: any) {
      toast({
        type: "error",
        title: "Error",
        message: err.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <StudentShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your StudEd profile and account preferences.
            </p>
          </div>

          {/* XP / Level card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start gap-6">
                  {/* Avatar */}
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-2xl font-black text-primary-foreground shadow-md">
                    {user?.fullName?.charAt(0).toUpperCase() ?? "S"}
                  </div>

                  <div className="flex-1 space-y-3 min-w-0">
                    <div>
                      <p className="text-xl font-bold">{user?.fullName ?? "Learner"}</p>
                      <p className="text-sm text-muted-foreground">{user?.email ?? ""}</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {/* Level badge */}
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                        <Award className="h-3.5 w-3.5" /> Level {level} · {levelName}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-600">
                        <Zap className="h-3.5 w-3.5" /> {totalXp.toLocaleString()} XP
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-sm font-semibold text-success">
                        <CheckCircle className="h-3.5 w-3.5" /> {enrollments.length} enrolled
                      </span>
                    </div>

                    {/* XP progress to next level */}
                    <div className="space-y-1.5 max-w-xs">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progress to Level {level + 1}</span>
                        <span className="font-medium">{Math.round(progress)}%</span>
                      </div>
                      <XPBar totalXp={totalXp} compact />
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
                    <div className="rounded-xl bg-muted/50 p-3 text-center">
                      <BookOpen className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                      <p className="text-lg font-bold">{enrollments.length}</p>
                      <p className="text-[10px] text-muted-foreground">Enrolled</p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3 text-center">
                      <CheckCircle className="mx-auto mb-1 h-4 w-4 text-success" />
                      <p className="text-lg font-bold text-success">{completedCourses}</p>
                      <p className="text-[10px] text-muted-foreground">Completed</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <form onSubmit={handleSave} className="grid gap-6 md:grid-cols-2">
            {/* Account Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <UserIcon className="h-5 w-5 text-primary" />
                    Student Profile
                  </CardTitle>
                  <CardDescription>Your personal profile details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-background focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground">Email Address (Read-only)</Label>
                    <Input value={user?.email ?? ""} disabled className="bg-muted/50 cursor-not-allowed" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-muted-foreground">Grade Level</Label>
                      <select
                        id="grade"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value as Grade)}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-all focus:border-primary/50"
                      >
                        {GRADES.map((g) => (
                          <option key={g.value} value={g.value}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-muted-foreground flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5" /> Language
                      </Label>
                      <select
                        id="preferredLanguage"
                        value={preferredLanguage}
                        onChange={(e) => setPreferredLanguage(e.target.value)}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-all focus:border-primary/50"
                      >
                        <option value="en">English</option>
                        <option value="si">Sinhala (සිංහල)</option>
                        <option value="ta">Tamil (தமிழ்)</option>
                      </select>
                    </div>
                  </div>
                  <Button type="submit" disabled={isSaving} className="w-full gap-1.5 mt-2">
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving changes..." : "Save Profile Details"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Access & Security Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Shield className="h-5 w-5 text-purple-500" />
                    Access & Security
                  </CardTitle>
                  <CardDescription>Security and role settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground">Role</Label>
                    <Input
                      value={user?.role ?? "STUDENT"}
                      disabled
                      className="bg-muted/50 font-semibold text-primary cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground">Account Status</Label>
                    <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2.5 text-sm text-success">
                      <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                      Active subscription &amp; verified
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground">User ID</Label>
                    <Input
                      value={user?.id ?? "—"}
                      disabled
                      className="bg-muted/50 font-mono text-xs text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </form>
        </div>
      </StudentShell>
    </ProtectedRoute>
  );
}
