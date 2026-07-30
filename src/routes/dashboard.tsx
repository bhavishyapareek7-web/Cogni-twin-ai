import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Brain,
  Target,
  Flame,
  FlaskConical,
  Compass,
  Code2,
  Mic,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { agents, examPrediction, strategy, twinInsights, twinStats } from "@/lib/twin-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Twin Dashboard — EduTwin AI" },
      {
        name: "description",
        content:
          "Your AI twin's live read on learning velocity, retention, exam rank prediction and this week's rewritten study strategy.",
      },
      { property: "og:title", content: "Twin Dashboard — EduTwin AI" },
      {
        property: "og:description",
        content: "Learning velocity, retention, AIR prediction and a weekly AI-rewritten study plan.",
      },
    ],
  }),
  component: Dashboard,
});

const agentIcons = {
  GraduationCap,
  Target,
  Flame,
  Brain,
  FlaskConical,
  Compass,
  Code2,
  Mic,
} as const;

function Dashboard() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-black tracking-tight sm:text-3xl">
              Good morning, Aarav
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your twin has watched 47 sessions. Here's what it knows today.
            </p>
          </div>
          <Button asChild className="shrink-0 bg-neural glow">
            <Link to="/classroom">
              Start session <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {twinStats.map((s) => (
            <div key={s.label} className="panel p-5">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</p>
              <p className="mt-2 text-3xl font-black text-gradient">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.detail}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
          <section className="panel p-6">
            <h2 className="text-lg font-semibold">Twin says</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Proactive observations from your behavioural memory.
            </p>
            <ul className="mt-5 space-y-3">
              {twinInsights.map((i) => (
                <li
                  key={i.tag}
                  className="rounded-xl border border-border bg-surface-2/60 p-4 text-sm leading-relaxed"
                >
                  <span className="mr-2 rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary-glow">
                    {i.tag}
                  </span>
                  {i.text}
                </li>
              ))}
            </ul>
          </section>

          <section className="panel p-6">
            <h2 className="text-lg font-semibold">Exam prediction engine</h2>
            <p className="mt-1 text-sm text-muted-foreground">JEE Main · updated 12 minutes ago</p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Metric label="Current score" value={String(examPrediction.current)} />
              <Metric
                label="Expected"
                value={`${examPrediction.expected} ± ${examPrediction.band}`}
                accent
              />
              <Metric label="AIR range" value={`${examPrediction.airLow}–${examPrediction.airHigh}`} />
              <Metric label="Rank upside" value={`+${examPrediction.upside} marks`} />
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Probability of an IIT seat</span>
                <span className="font-semibold">{examPrediction.iitProbability}%</span>
              </div>
              <Progress value={examPrediction.iitProbability} className="mt-2 h-2" />
            </div>

            <div className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
              <p className="rounded-lg border border-border bg-surface-2/60 px-3 py-2">
                <span className="text-muted-foreground">Strongest · </span>
                {examPrediction.strongest}
              </p>
              <p className="rounded-lg border border-border bg-surface-2/60 px-3 py-2">
                <span className="text-muted-foreground">Weakest · </span>
                {examPrediction.weakest}
              </p>
            </div>
          </section>
        </div>

        <section className="panel p-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">AI study strategist</h2>
              <p className="mt-1 text-sm text-muted-foreground">{strategy.verdict}</p>
            </div>
            <span className="shrink-0 rounded-full border border-mastered/40 bg-mastered/15 px-3 py-1.5 text-sm font-semibold text-mastered">
              +{strategy.improvement} marks
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {strategy.moves.map((m) => (
              <div key={m.move} className="rounded-xl border border-border bg-surface-2/60 p-4">
                <p className="text-sm font-semibold">{m.move}</p>
                <p className="mt-1 text-lg font-black text-accent">{m.delta}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{m.why}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="text-lg font-semibold">Your AI faculty</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Specialist agents sharing one memory of you.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {agents.map((a) => {
              const Icon = agentIcons[a.icon as keyof typeof agentIcons];
              return (
                <div
                  key={a.name}
                  className="flex items-start gap-3 rounded-xl border border-border bg-surface-2/60 p-4"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/15">
                    <Icon className="size-4 text-primary-glow" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{a.name}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{a.role}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/60 p-3">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-black ${accent ? "text-gradient" : ""}`}>{value}</p>
    </div>
  );
}
