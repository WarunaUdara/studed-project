import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle, Globe, Shield, User as UserIcon, Moon, Sun, Save } from "lucide-react";
import { useQuery, useMutation } from "urql";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import { COURSES_QUERY } from "@/graphql/courses";
import { useAuthStore } from "@/stores/auth";
import { useUiPrefs } from "@/stores/uiPrefs";

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

export const Route = createFileRoute("/educator/_layout/settings")({
  component: EducatorSettingsPage,
});

function EducatorSettingsPage() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  const theme = useUiPrefs((s) => s.theme);
  const toggleTheme = useUiPrefs((s) => s.toggleTheme);

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferredLanguage ?? "en");
  const [isSaving, setIsSaving] = useState(false);

  const [{ data }] = useQuery({
    query: COURSES_QUERY,
    variables: { filter: {} },
  });

  const [, updateProfile] = useMutation(UPDATE_ME_MUTATION);

  const courses = data?.courses?.edges?.map((edge: any) => edge.node) ?? [];
  const publishedCoursesCount = courses.filter((c: any) => c.isPublished).length;

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
    <ProtectedRoute allowedRoles={["EDUCATOR", "HEAD_EDUCATOR", "ADMIN"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your educator profile, specialty fields, and portal preferences.
          </p>
        </div>

        {/* Profile Card */}
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
                  {user?.fullName?.charAt(0).toUpperCase() ?? "E"}
                </div>

                <div className="flex-1 space-y-3 min-w-0">
                  <div>
                    <p className="text-xl font-bold">{user?.fullName ?? "Educator"}</p>
                    <p className="text-sm text-muted-foreground">{user?.email ?? ""}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                      <Shield className="h-3.5 w-3.5" />{" "}
                      {user?.role === "HEAD_EDUCATOR" ? "Head Educator" : "Educator"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-sm font-semibold text-success">
                      <BookOpen className="h-3.5 w-3.5" /> {courses.length} courses managed
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-600">
                      <CheckCircle className="h-3.5 w-3.5" /> {publishedCoursesCount} live courses
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <form onSubmit={handleSave} className="grid gap-6 md:grid-cols-2">
          {/* Account Profile details */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <UserIcon className="h-5 w-5 text-primary" />
                  Educator Profile
                </CardTitle>
                <CardDescription>Your account credentials and details.</CardDescription>
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
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground">Role Account</Label>
                    <Input value={user?.role ?? "EDUCATOR"} disabled className="bg-muted/50 font-semibold text-primary cursor-not-allowed" />
                  </div>
                </div>
                <Button type="submit" disabled={isSaving} className="w-full gap-1.5 mt-2">
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving changes..." : "Save Profile Details"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Preferences & UI details */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Shield className="h-5 w-5 text-purple-500" />
                  Portal Preferences
                </CardTitle>
                <CardDescription>Configure your visual workspace settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Theme Toggle option */}
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-semibold">Theme Mode</p>
                    <p className="text-xs text-muted-foreground">
                      Toggle portal color palette preference
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={toggleTheme}
                    className="rounded-full"
                  >
                    {theme === "dark" ? (
                      <Sun className="h-4 w-4 text-warning" />
                    ) : (
                      <Moon className="h-4 w-4 text-primary" />
                    )}
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground">Account Status</Label>
                  <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2.5 text-sm text-success">
                    <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    Verified Educator Account
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground">Unique User Identifier (ID)</Label>
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
    </ProtectedRoute>
  );
}
