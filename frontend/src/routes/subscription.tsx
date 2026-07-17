import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, Crown, GraduationCap, Mail, Rocket, Shield, Sparkles, XCircle } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "urql";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { StudentShell } from "@/components/layout/StudentShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import {
  CANCEL_SUBSCRIPTION_MUTATION,
  CREATE_SUBSCRIPTION_MUTATION,
  MY_SUBSCRIPTION_QUERY,
} from "@/graphql/billing";
import { sanitizeGraphQLError } from "@/lib/errors";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/subscription")({
  component: SubscriptionPage,
});

type Tier = "BASIC" | "STANDARD" | "PREMIUM" | "SCHOOL";
type SubStatus = "ACTIVE" | "CANCELED" | "EXPIRED";

interface UserSubscription {
  id: string;
  tier: Tier;
  status: SubStatus;
  startDate: string;
  endDate: string;
}

interface TierPlan {
  id: Tier;
  name: string;
  icon: typeof Shield;
  price: string;
  period: string;
  description: string;
  features: string[];
  selfService: boolean;
}

const TIER_PLANS: TierPlan[] = [
  {
    id: "BASIC",
    name: "Basic",
    icon: Shield,
    price: "LKR 690",
    period: "/month",
    description: "One grade, full syllabus coverage — a solid start for steady revision.",
    features: [
      "Unlimited waves in your grade",
      "Daily streak & XP tracking",
      "Course leaderboard access",
    ],
    selfService: true,
  },
  {
    id: "STANDARD",
    name: "Standard",
    icon: Sparkles,
    price: "LKR 1,200",
    period: "/month",
    description: "Everything for one grade — full waves, leaderboards and proficiency.",
    features: [
      "Everything in Basic",
      "Global & course leaderboards",
      "Proficiency ladder + badges",
      "Bilingual interface (EN / සිං)",
    ],
    selfService: true,
  },
  {
    id: "PREMIUM",
    name: "Premium",
    icon: Rocket,
    price: "LKR 2,400",
    period: "/month",
    description: "Unlock every grade and subject, with priority AI tutor support.",
    features: [
      "Everything in Standard",
      "All grades & subjects unlocked",
      "Priority AI Tutor nudges",
      "Unlimited wave reattempts",
      "Early access to new courses",
    ],
    selfService: true,
  },
  {
    id: "SCHOOL",
    name: "School License",
    icon: GraduationCap,
    price: "Custom",
    period: "",
    description: "Bulk enrollment, admin dashboards and progress reports for schools.",
    features: [
      "Bulk student enrollment",
      "Educator & admin dashboard",
      "Progress reporting for staff",
      "Prioritized support",
    ],
    selfService: false,
  },
];

const STATUS_STYLES: Record<SubStatus, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-success/10 text-success border-success/30" },
  CANCELED: {
    label: "Canceled",
    className: "bg-muted text-muted-foreground border-border",
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function SubscriptionPage() {
  const { toast } = useToast();
  const [{ data, fetching, error }, refetch] = useQuery({
    query: MY_SUBSCRIPTION_QUERY,
    requestPolicy: "network-only",
  });
  const [createState, createSubscription] = useMutation(CREATE_SUBSCRIPTION_MUTATION);
  const [cancelState, cancelSubscription] = useMutation(CANCEL_SUBSCRIPTION_MUTATION);
  const [pendingTier, setPendingTier] = useState<Tier | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const subscription: UserSubscription | null = data?.me?.subscription ?? null;
  const isActive = subscription?.status === "ACTIVE";
  const currentTier = isActive ? subscription?.tier : null;

  const handleChoose = async (tier: Tier) => {
    setPendingTier(tier);
    const res = await createSubscription({ input: { tier } });
    setPendingTier(null);
    if (res.error) {
      const err = sanitizeGraphQLError(res.error);
      toast({ type: "error", title: err.title, message: err.message });
      return;
    }
    const plan = TIER_PLANS.find((p) => p.id === tier);
    toast({
      type: "success",
      title: "Plan activated",
      message: `You're now on the ${plan?.name ?? tier} plan. Enjoy your unlocked content!`,
    });
    refetch({ requestPolicy: "network-only" });
  };

  const handleCancel = async () => {
    const res = await cancelSubscription({});
    setConfirmingCancel(false);
    if (res.error) {
      const err = sanitizeGraphQLError(res.error);
      toast({ type: "error", title: err.title, message: err.message });
      return;
    }
    toast({
      type: "info",
      title: "Subscription canceled",
      message: "You'll keep access until the end of your current billing period.",
    });
    refetch({ requestPolicy: "network-only" });
  };

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <StudentShell>
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-primary/80 block">
              Subscription &amp; Billing
            </span>
            <h1 className="text-4xl font-normal font-serif text-foreground sm:text-5xl">
              Unlock your full learning path.
            </h1>
            <p className="text-muted-foreground text-sm max-w-2xl">
              Every plan includes the free preview wave of any course. Upgrade for unlimited waves,
              leaderboards, and priority AI tutoring — activated instantly.
            </p>
          </div>

          {/* Current plan */}
          {fetching ? (
            <Skeleton className="h-40 w-full rounded-2xl" />
          ) : error ? (
            <Card className="border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
              {sanitizeGraphQLError(error).message}
            </Card>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden rounded-2xl border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
                      <Crown className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        Current Plan
                      </p>
                      <p className="text-xl font-serif font-normal text-foreground">
                        {isActive
                          ? (TIER_PLANS.find((p) => p.id === subscription?.tier)?.name ??
                            subscription?.tier)
                          : "Free Preview"}
                      </p>
                      {subscription && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                              STATUS_STYLES[subscription.status].className,
                            )}
                          >
                            {STATUS_STYLES[subscription.status].label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {isActive
                              ? `Renews ${formatDate(subscription.endDate)}`
                              : `Access ends ${formatDate(subscription.endDate)}`}
                          </span>
                        </div>
                      )}
                      {!subscription && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          You're browsing on the free preview. Choose a plan below to unlock full
                          waves.
                        </p>
                      )}
                    </div>
                  </div>

                  {isActive && (
                    <div className="shrink-0">
                      {confirmingCancel ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Are you sure?</span>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={cancelState.fetching}
                            onClick={handleCancel}
                          >
                            {cancelState.fetching ? "Canceling…" : "Yes, cancel"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmingCancel(false)}
                          >
                            Keep plan
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-muted-foreground"
                          onClick={() => setConfirmingCancel(true)}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Cancel subscription
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Tier comparison */}
          <div className="grid gap-6 lg:grid-cols-4">
            {TIER_PLANS.map((plan, i) => {
              const Icon = plan.icon;
              const isCurrent = currentTier === plan.id;
              const isPending = pendingTier === plan.id && createState.fetching;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <Card
                    className={cn(
                      "relative flex h-full flex-col overflow-hidden rounded-2xl p-6",
                      plan.id === "STANDARD"
                        ? "border-2 border-purple/60 shadow-lg ring-2 ring-purple/20"
                        : "shadow-sm",
                      isCurrent && "border-success/50 ring-2 ring-success/20",
                    )}
                  >
                    {plan.id === "STANDARD" && !isCurrent && (
                      <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-purple px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-foreground">
                        Most popular
                      </span>
                    )}
                    {isCurrent && (
                      <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success-foreground">
                        Current plan
                      </span>
                    )}

                    <Icon className="h-6 w-6 text-primary" />
                    <h3 className="mt-3 text-lg font-semibold">{plan.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>

                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold tracking-tight">{plan.price}</span>
                      {plan.period && (
                        <span className="text-sm text-muted-foreground">{plan.period}</span>
                      )}
                    </div>

                    <ul className="mt-5 flex-1 space-y-2 text-sm">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6">
                      {plan.selfService ? (
                        <Button
                          className="w-full"
                          variant={plan.id === "STANDARD" && !isCurrent ? "default" : "outline"}
                          disabled={isCurrent || createState.fetching}
                          onClick={() => handleChoose(plan.id)}
                        >
                          {isCurrent
                            ? "Your current plan"
                            : isPending
                              ? "Activating…"
                              : `Choose ${plan.name}`}
                        </Button>
                      ) : (
                        <a href="mailto:hello@studed.lk?subject=School%20License%20Inquiry">
                          <Button variant="outline" className="w-full gap-1.5">
                            <Mail className="h-4 w-4" /> Talk to us
                          </Button>
                        </a>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Plans activate immediately and can be switched or canceled at any time. Prices shown in
            Sri Lankan Rupees.
          </p>
        </div>
      </StudentShell>
    </ProtectedRoute>
  );
}
