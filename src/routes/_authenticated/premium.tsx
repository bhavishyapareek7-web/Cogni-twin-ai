import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BadgeCheck,
  Brain,
  CalendarClock,
  Crown,
  Dna,
  FileText,
  Gauge,
  Layers,
  Lock,
  Loader2,
  Mic,
  Presentation,
  ShieldCheck,
  Sparkles,
  Target,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { getAccess, openFeature } from "@/lib/entitlements.functions";
import { getBilling, startSubscription, confirmSubscription, cancelSubscription } from "@/lib/billing.functions";

function loadCheckout(): Promise<void> {
  if ((window as any).Razorpay) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => res();
    s.onerror = () => rej(new Error("Could not load Razorpay"));
    document.body.appendChild(s);
  });
}

export const Route = createFileRoute("/_authenticated/premium")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Premium Hub — EduTwin AI" },
      {
        name: "description",
        content:
          "Unlock AI Twin Pro, Immersive Classroom Pro, Exam Strategist, Mistake Lab, Study Autopilot and the AI PDF Companion inside EduTwin AI.",
      },
      { property: "og:title", content: "Premium Hub — EduTwin AI" },
      {
        property: "og:description",
        content: "An AI teacher that gets to know you — Premium capabilities for EduTwin AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PremiumHub,
});

const ICONS: Record<string, typeof Brain> = {
  premium_ai_twin: Brain,
  premium_immersive_classroom: Presentation,
  premium_exam_strategy: Target,
  premium_mistake_lab: TriangleAlert,
  premium_knowledge_graph: Dna,
  premium_mock_tests: Gauge,
  premium_memory_engine: Layers,
  premium_autopilot: CalendarClock,
  premium_voice_tutor: Mic,
  premium_ai_pdf: FileText,
  premium_analytics: Gauge,
};

const LINKS: Record<string, string> = {
  premium_ai_twin: "/dashboard",
  premium_immersive_classroom: "/classroom",
  premium_knowledge_graph: "/genome",
  premium_mock_tests: "/tests",
  premium_memory_engine: "/revise",
  premium_autopilot: "/planner",
  premium_mistake_lab: "/doubts",
  premium_exam_strategy: "/planner",
  premium_voice_tutor: "/classroom",
  premium_ai_pdf: "/companion",
  premium_analytics: "/insights",
};

const BENEFITS = [
  "A personalized AI teacher that remembers your mistakes",
  "Immersive Classroom Pro with adaptive pacing",
  "Adaptive mock tests and exam readiness estimates",
  "Mistake Lab: why you got it wrong, and the fix",
  "Knowledge Graph with prerequisite repair",
  "Study Autopilot that reorganizes your plan",
  "Voice Tutor for natural conversational learning",
  "AI PDF Companion for your own textbooks",
];

function PremiumHub() {
  const loadAccess = useServerFn(getAccess);
  const open = useServerFn(openFeature);
  const access = useQuery({ queryKey: ["access"], queryFn: () => loadAccess({}) });

  const check = useMutation({
    mutationFn: (feature: string) => open({ data: { feature } }),
    onSuccess: (res) => {
      if (res.allowed) toast.success("Access verified — this feature is unlocked.");
      else toast.info(res.reason ?? "This is a Premium feature.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const loadBilling = useServerFn(getBilling);
  const start = useServerFn(startSubscription);
  const confirm = useServerFn(confirmSubscription);
  const cancel = useServerFn(cancelSubscription);
  const billing = useQuery({ queryKey: ["billing"], queryFn: () => loadBilling({}) });
  const refresh = () => {
    access.refetch();
    billing.refetch();
  };
  const sync = async (id: string) => {
    try {
      const r = await confirm({ data: { subscriptionId: id } });
      if (r?.until) toast.success("Premium is active!");
    } catch (e) {
      toast.error((e as Error).message);
    }
    refresh();
  };
  const subscribe = useMutation({
    mutationFn: async (tier: "student" | "organization") => {
      const { subscriptionId, keyId } = await start({ data: { tier } });
      await loadCheckout();
      const rzp = new (window as any).Razorpay({
        key: keyId,
        subscription_id: subscriptionId,
        name: "EduTwin AI",
        description: tier === "student" ? "Student plan · ₹50/month" : "Organisation plan · ₹1,000/month",
        handler: () => sync(subscriptionId),
        modal: { ondismiss: () => sync(subscriptionId) },
      });
      rzp.on("payment.failed", (r: any) => toast.error(r.error?.description ?? "Payment failed"));
      rzp.open();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const stop = useMutation({
    mutationFn: (id: string) => cancel({ data: { subscriptionId: id } }),
    onSuccess: () => {
      toast.success("Subscription cancelled.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const sub = billing.data;
  const premium = access.data?.premium ?? false;
  const features = access.data?.features ?? [];

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6">
        <header className="panel relative overflow-hidden p-6">
          <div className="relative">
            <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <Crown className="size-3.5 text-accent" /> Premium
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Your AI teacher <span className="text-gradient">gets to know you</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Premium isn&apos;t more AI — it&apos;s a persistent twin, an immersive classroom that
              adapts to your mastery, and exam preparation built from your own mistakes.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {access.isLoading ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : premium ? (
                <span className="flex items-center gap-2 rounded-full border border-mastered/50 bg-mastered/15 px-3 py-1 text-sm">
                  <BadgeCheck className="size-4" /> {access.data?.plan === "lifetime" ? "Premium Lifetime" : "Premium active"}
                  {access.data?.daysLeft != null && ` · ${access.data.daysLeft} days left`}
                </span>
              ) : (
                <span className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted-foreground">
                  Free plan
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" /> Access is verified on the server
              </span>
            </div>
          </div>
        </header>

        {access.data?.daysLeft != null && access.data.daysLeft <= 7 && premium && (
          <div className="panel border-warning/40 p-4 text-sm">
            Premium expires in {access.data.daysLeft} days. Your lessons, notes and progress always
            stay with you.
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((f) => {
              const Icon = ICONS[f.id] ?? Sparkles;
              const to = LINKS[f.id];
              return (
                <article key={f.id} className="panel flex flex-col gap-2 p-5">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Icon className="size-4 text-primary-glow" /> {f.name}
                    {!f.enabled && <Lock className="size-3.5 text-muted-foreground" />}
                  </span>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                  <div className="mt-auto pt-2">
                    {f.enabled && to ? (
                      <Button size="sm" variant="outline" asChild>
                        <Link to={to}>Open</Link>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={check.isPending}
                        onClick={() => check.mutate(f.id)}
                      >
                        {f.enabled ? "Verify access" : "Unlock with Premium"}
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
            {!features.length && !access.isLoading && (
              <p className="text-sm text-muted-foreground">No Premium features are live yet.</p>
            )}
          </div>

          <aside className="panel h-fit p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              What Premium unlocks
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {BENEFITS.map((b) => (
                <li key={b} className="flex gap-2 leading-relaxed">
                  <span className="text-mastered">✓</span>
                  {b}
                </li>
              ))}
            </ul>
            {!premium && (
              <div className="mt-4 space-y-2">
                <Button className="w-full bg-neural" disabled={subscribe.isPending} onClick={() => subscribe.mutate("student")}>
                  <Crown className="mr-2 size-4" /> Student · ₹50/month
                </Button>
                <Button variant="outline" className="w-full" disabled={subscribe.isPending} onClick={() => subscribe.mutate("organization")}>
                  Organisation · ₹1,000/month
                </Button>
                <p className="text-center text-xs text-muted-foreground">7-day free trial for new subscribers. Cancel anytime.</p>
              </div>
            )}
            {sub && sub.status !== "created" && (
              <div className="mt-4 rounded-lg border border-border p-3 text-sm">
                <p>
                  {sub.tier === "student" ? "Student" : "Organisation"} plan · {sub.status}
                </p>
                {sub.trial_ends_at && new Date(sub.trial_ends_at) > new Date() && (
                  <p className="text-muted-foreground">Free trial until {new Date(sub.trial_ends_at).toLocaleDateString("en-IN")}</p>
                )}
                {sub.cancel_at_cycle_end && sub.current_end && (
                  <p className="text-muted-foreground">Cancels on {new Date(sub.current_end).toLocaleDateString("en-IN")}</p>
                )}
                {["active", "authenticated", "pending"].includes(sub.status) && !sub.cancel_at_cycle_end && (
                  <Button size="sm" variant="ghost" className="mt-2" disabled={stop.isPending} onClick={() => stop.mutate(sub.razorpay_subscription_id)}>
                    Cancel subscription
                  </Button>
                )}
              </div>
            )}
            {access.data?.usage?.length ? (
              <div className="mt-5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">AI usage</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {access.data.usage.map((u) => (
                    <li key={u.kind}>
                      {u.kind}: {u.amount}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
