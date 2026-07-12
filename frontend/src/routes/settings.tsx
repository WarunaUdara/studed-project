import { createFileRoute } from "@tanstack/react-router";
import { Shield, User as UserIcon } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { StudentShell } from "@/components/layout/StudentShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <StudentShell>
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your StudEd student profile and account preferences.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Account Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <UserIcon className="h-5 w-5 text-primary" />
                  Student Profile
                </CardTitle>
                <CardDescription>Your personal profile details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Full Name</Label>
                  <Input value={user?.fullName ?? "Learner"} disabled className="bg-muted/50" />
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Email Address</Label>
                  <Input value={user?.email ?? ""} disabled className="bg-muted/50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Grade Level</Label>
                    <Input value={user?.grade ?? "—"} disabled className="bg-muted/50" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Preferred Language</Label>
                    <Input value={user?.preferredLanguage?.toUpperCase() ?? "EN"} disabled className="bg-muted/50" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Access & Security Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Shield className="h-5 w-5 text-purple" />
                  Access & Security
                </CardTitle>
                <CardDescription>Security and role settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Role</Label>
                  <Input value={user?.role ?? "STUDENT"} disabled className="bg-muted/50 font-semibold text-primary" />
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Account Status</Label>
                  <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">
                    <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    Active subscription & verified
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </StudentShell>
    </ProtectedRoute>
  );
}
