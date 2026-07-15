import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle, Globe, Shield, User as UserIcon, Moon, Sun, Save, Volume2, Upload, Sliders, Settings as SettingsIcon } from "lucide-react";
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

  // Focus sound configuration states
  const [soundConfigs, setSoundConfigs] = useState([
    { id: "adhd", name: "ADHD Binaural Flow", leftFreq: 140, rightFreq: 150, gain: 0.04, desc: "Binaural alpha-wave beat + brown noise hum." },
    { id: "brown", name: "Brownian Rain Waterfall", leftFreq: 0, rightFreq: 0, gain: 0.04, desc: "Deep rumbling frequency masking for environmental blockout." },
    { id: "pink", name: "Ocean Breeze", leftFreq: 0, rightFreq: 0, gain: 0.04, desc: "Gentle natural wind simulations." }
  ]);
  const [simulatedFile, setSimulatedFile] = useState<string | null>(null);

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

  const handleSoundConfigChange = (id: string, field: string, val: number | string) => {
    setSoundConfigs(prev =>
      prev.map(c => (c.id === id ? { ...c, [field]: val } : c))
    );
  };

  const handleSaveSoundConfigs = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      type: "success",
      title: "Audio Configurations Updated",
      message: "Focus Timer sound configurations updated locally in prototype.",
    });
  };

  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSimulatedFile(e.target.files[0].name);
      toast({
        type: "warning",
        title: "Cloud Connection Required",
        message: "Storage credentials not active. Custom upload has been simulated locally.",
      });
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

        {/* Focus Sounds Customizer (Admin Surface) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-purple/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Volume2 className="h-5 w-5 text-purple" />
                Focus Sounds Control Room
              </CardTitle>
              <CardDescription>
                Configure synthesized focus noise frequencies, binaural beat alpha-waves, and simulate uploads.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSoundConfigs} className="space-y-5">
                <div className="grid gap-6 md:grid-cols-3">
                  {soundConfigs.map((cfg) => (
                    <div key={cfg.id} className="rounded-xl border p-4 space-y-3 bg-muted/20">
                      <div>
                        <span className="font-bold text-sm text-foreground block">{cfg.name}</span>
                        <span className="text-[10px] text-muted-foreground block leading-tight mt-1">{cfg.desc}</span>
                      </div>

                      {cfg.id === "adhd" && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground uppercase font-bold">Left (Hz)</Label>
                            <Input
                              type="number"
                              value={cfg.leftFreq}
                              onChange={(e) => handleSoundConfigChange(cfg.id, "leftFreq", Number(e.target.value))}
                              className="bg-background text-xs py-1 h-8 text-center"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground uppercase font-bold">Right (Hz)</Label>
                            <Input
                              type="number"
                              value={cfg.rightFreq}
                              onChange={(e) => handleSoundConfigChange(cfg.id, "rightFreq", Number(e.target.value))}
                              className="bg-background text-xs py-1 h-8 text-center"
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground font-bold">
                          <span>GAIN LEVEL</span>
                          <span>{cfg.gain * 100}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="0.1"
                          step="0.01"
                          value={cfg.gain}
                          onChange={(e) => handleSoundConfigChange(cfg.id, "gain", Number(e.target.value))}
                          className="w-full accent-purple"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Upload simulated interface */}
                <div className="rounded-xl border border-dashed p-5 bg-background flex flex-col items-center justify-center text-center space-y-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple/10 text-purple">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm block">Upload custom ADHD / White Noise sound file</span>
                    <span className="text-xs text-muted-foreground block mt-0.5">Supports MP3, WAV or FLAC up to 15MB</span>
                  </div>
                  <input
                    type="file"
                    accept="audio/*"
                    id="audio-upload"
                    className="hidden"
                    onChange={handleSimulatedUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 mt-1 border-purple/30 text-purple hover:bg-purple/5"
                    onClick={() => document.getElementById("audio-upload")?.click()}
                  >
                    Select Audio File
                  </Button>
                  {simulatedFile && (
                    <span className="text-xs font-bold text-success">
                      Simulated local file: {simulatedFile}
                    </span>
                  )}
                  <p className="text-[10px] text-muted-foreground italic">
                    Note: Audio file uploads require Object Storage (Cloudflare R2) connection. Real-time client-side Web Audio API oscillators are running actively in the current prototype.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" className="gap-1.5 px-6">
                    <Sliders className="h-4 w-4" />
                    Save Audio Parameters
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}

