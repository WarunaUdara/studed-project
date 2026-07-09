import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { GraduationCap, Sparkles, Trophy, Waves } from "lucide-react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Card, CardContent } from "@/components/ui/Card";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — form */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Card className="border-border/50 shadow-xl">
            <CardContent className="p-8">
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Start your learning journey today
                </p>
              </div>
              <RegisterForm />
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Right panel — branding */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-purple/70 via-primary/70 to-primary lg:flex lg:flex-col lg:justify-center lg:p-12">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white/10 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-gold/20 blur-[80px]" />
        <div className="relative space-y-8 text-white">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight">
              Join Stud<span className="text-gold">Ed</span>
            </h2>
            <p className="mt-2 text-lg text-white/80">Learn smarter, level up faster</p>
          </div>
          <div className="space-y-4">
            <BrandFeature
              icon={<Waves className="h-5 w-5" />}
              text="Interactive Learn + Evaluate phases"
            />
            <BrandFeature
              icon={<GraduationCap className="h-5 w-5" />}
              text="Grade 1–11, O/L & A/L aligned content"
            />
            <BrandFeature
              icon={<Trophy className="h-5 w-5" />}
              text="Track proficiency and unlock badges"
            />
            <BrandFeature
              icon={<Sparkles className="h-5 w-5" />}
              text="Gamified XP system with leaderboards"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function BrandFeature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
        {icon}
      </span>
      <span className="text-sm font-medium text-white/90">{text}</span>
    </div>
  );
}
