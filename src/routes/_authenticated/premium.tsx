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

export const Route = createFileRoute("/_authenticated/premium")({
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
    onError: (e: Error) => toast.error(e.message),
  });

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
              <Button className="mt-4 w-full bg-neural" onClick={() => toast.info("Premium is granted by an administrator — ask your mentor to enable it for your account.")}>
                <Crown className="mr-2 size-4" /> Unlock Premium
              </Button>
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
