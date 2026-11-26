import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Mic,
  LayoutList,
  Sparkle,
  NotebookPen,
  Brain,
  Dna,
  LineChart,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "EduTwin AI — Your Lifelong Digital Learning Twin" },
      {
        name: "description",
        content:
          "A persistent AI twin that remembers how you learn, maps your knowledge DNA, predicts your exam rank and teaches you in an immersive classroom.",
      },
      { property: "og:title", content: "EduTwin AI — Your Lifelong Digital Learning Twin" },
      {
        property: "og:description",
        content:
          "Immersive AI classroom, knowledge genome mapping and exam rank prediction in one academic operating system.",
      },
    ],
  }),
  component: Landing,
});

const chips = [
  { icon: Mic, label: "Voice conversations" },
  { icon: LayoutList, label: "Visual slides" },
  { icon: Sparkle, label: "Adaptive learning" },
  { icon: NotebookPen, label: "Quizzes & notes" },
];

const pillars = [
  {
    icon: Brain,
    title: "Digital AI Twin",
    body: "It remembers every mistake, every forgotten concept, your attention span and the hour you learn best — then teaches around it.",
  },
  {
    icon: Dna,
    title: "Knowledge DNA",
    body: "Every concept is a node with dependencies. Weak Limits? It sends you back before Calculus, automatically.",
  },
  {
    icon: LineChart,
    title: "Exam Prediction",
    body: "Expected marks, percentile band, AIR range and qualification probability — recalculated after every session.",
  },
  {
    icon: Users,
    title: "Multi-Agent Faculty",
    body: "Tutor, Exam Coach, Memory Coach, Motivator, Career Advisor. Each a specialist, all sharing one memory of you.",
  },
];

function Landing() {
  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <span className="size-1.5 rounded-full bg-improving" />
            Now live
          </span>
          <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            World's First <span className="text-gradient">Immersive Classroom</span>
          </h1>
          <p className="mt-3 text-xl font-semibold text-foreground/90 sm:text-2xl">
            That teaches like a real teacher
          </p>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">
            Not a chatbot. A digital twin of how you learn — it lectures, draws, quizzes, notices when
            you fade, and rebuilds your plan every week.
          </p>
        </div>

        <div className="panel mx-auto mt-12 max-w-4xl overflow-hidden p-2 sm:p-3">
          <div className="rounded-xl border border-border bg-background/60">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Anatomy of a Black Hole</p>
                <p className="text-xs text-muted-foreground">Physics · Gravitation</p>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted-foreground">
                <span className="size-1.5 animate-pulse rounded-full bg-mastered" />
                Tutor online
              </span>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-[1.6fr_1fr]">
              <div className="space-y-2.5 rounded-lg border border-border bg-surface p-4">
                {[
                  "The event horizon marks the boundary where escape velocity equals the speed of light.",
                  "At the centre lies the singularity, where matter is crushed to infinite density.",
                  "The photon sphere sits at 1.5× the Schwarzschild radius.",
                ].map((line) => (
                  <p key={line} className="text-sm leading-relaxed text-foreground/80">
                    <span className="mr-2 text-accent">◆</span>
                    {line}
                  </p>
                ))}
                <div className="mt-4 grid h-32 place-items-center rounded-lg border border-border bg-background">
                  <div className="grid size-24 place-items-center rounded-full border border-primary/40 bg-neural/10">
                    <div className="size-10 rounded-full bg-neural glow" />
                  </div>
                </div>
              </div>
              <div className="space-y-2 rounded-lg border border-border bg-surface p-3">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Live chat</p>
                <p className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
                  Can you draw the layers?
                </p>
                <p className="text-sm leading-relaxed text-foreground/80">
                  Of course. Watch the board — I'll build it outward from the singularity.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          {chips.map((chip) => (
            <span
              key={chip.label}
              className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground/85"
            >
              <chip.icon className="size-4 text-accent" />
              {chip.label}
            </span>
          ))}
        </div>

        <div className="mx-auto mt-9 flex max-w-lg flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-14 flex-1 bg-neural text-base font-semibold glow">
            <Link to="/classroom">
              Enter Classroom <ArrowRight className="ml-1 size-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-14 flex-1 text-base">
            <Link to="/dashboard">Meet your Twin</Link>
          </Button>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span>Free NTA preparation:</span>
          <Link to="/jee-mock-test" className="text-primary-glow underline underline-offset-4">
            JEE Main
          </Link>
          <Link to="/cuet-mock-test" className="text-primary-glow underline underline-offset-4">
            CUET UG
          </Link>
          <Link to="/nta-mock-test" className="text-primary-glow underline underline-offset-4">
            JEE, NEET & CUET mock tests
          </Link>
        </div>

      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => (
            <article key={p.title} className="panel p-5">
              <span className="grid size-10 place-items-center rounded-xl border border-primary/30 bg-primary/15">
                <p.icon className="size-5 text-primary-glow" />
              </span>
              <h2 className="mt-4 text-base font-semibold">{p.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
