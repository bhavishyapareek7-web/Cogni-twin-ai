import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, Flame, Loader2, Sparkles, Star, Trophy, Zap } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { getTwin, rewriteStrategy } from "@/lib/twin.functions";

export const Route = createFileRoute("/_authenticated/planner")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Adaptive Study Planner & XP — EduTwin AI" },
      {
        name: "description",
        content:
          "Your twin rewrites the week from your mistakes and test data, and tracks XP, levels, streaks and badges as you work through it.",
      },
      { property: "og:title", content: "Adaptive Study Planner & XP — EduTwin AI" },
      {
        property: "og:description",
        content: "A weekly plan that rewrites itself, plus XP, levels and streaks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Planner,
});

type PlanShape = {
  expected_gain?: string;
  days?: Array<{
    day: string;
    focus: string;
    blocks: Array<{ time: string; task: string; why: string }>;
  }>;
};

const BADGES = [
  { label: "First lesson", need: 20 },
  { label: "Doubt breaker", need: 100 },
  { label: "Recall machine", need: 300 },
  { label: "Mock warrior", need: 600 },
  { label: "Twin whisperer", need: 1200 },
];

function Planner() {
  const qc = useQueryClient();
  const loadTwin = useServerFn(getTwin);
  const rewrite = useServerFn(rewriteStrategy);
  const twin = useQuery({ queryKey: ["twin"], queryFn: () => loadTwin({}) });

  const profile = twin.data?.profile;
  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const streak = profile?.streak_days ?? 0;
  const toNext = 500 - (xp % 500);
  const plan = (twin.data?.plan?.plan ?? {}) as PlanShape;
  const memory = twin.data?.memory ?? [];

  const mutation = useMutation({
    mutationFn: () => rewrite({}),
    onSuccess: () => {
      toast.success("Strategy rewritten from your latest data.");
      void qc.invalidateQueries({ queryKey: ["twin"] });
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't rewrite the plan."),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <CalendarDays className="size-3.5" /> Study strategist
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              A week that <span className="text-gradient">rewrites itself</span>
            </h1>
          </div>
          <Button className="bg-neural" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Redesigning…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 size-4" /> Rewrite my week
              </>
            )}
          </Button>
        </div>

        {!profile?.onboarded && (
          <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm text-muted-foreground">
              Your twin plans better once it knows your exams and weak areas.
            </p>
            <Button size="sm" variant="outline" asChild>
              <Link to="/onboarding">Calibrate my twin</Link>
            </Button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Zap, label: "XP", value: xp, sub: `${toNext} XP to level ${level + 1}` },
            { icon: Star, label: "Level", value: level, sub: "Keeps climbing as you study" },
            { icon: Flame, label: "Streak", value: `${streak}d`, sub: "Study daily to keep it alive" },
          ].map((s) => (
            <div key={s.label} className="panel p-5">
              <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <s.icon className="size-3.5" /> {s.label}
              </p>
              <p className="mt-2 text-2xl font-bold">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="panel p-5">
          <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Trophy className="size-3.5" /> Badges
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {BADGES.map((b) => {
              const earned = xp >= b.need;
              return (
                <span
                  key={b.label}
                  className={
                    earned
                      ? "rounded-full border border-mastered/50 bg-mastered/15 px-3 py-1 text-xs"
                      : "rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground"
                  }
                >
                  {b.label} · {b.need} XP
                </span>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">This week</p>
              {plan.expected_gain && (
                <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs">
                  {plan.expected_gain}
                </span>
              )}
            </div>
            {twin.data?.plan?.rationale && (
              <p className="mt-3 rounded-xl border border-border bg-surface p-3 text-sm leading-relaxed text-foreground/85">
                {twin.data.plan.rationale}
              </p>
            )}
            {plan.days?.length ? (
              <div className="mt-4 space-y-3">
                {plan.days.map((d) => (
                  <div key={d.day} className="rounded-2xl border border-border bg-surface p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{d.day}</p>
                      <p className="text-xs text-muted-foreground">{d.focus}</p>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {d.blocks.map((b, i) => (
                        <li key={`${d.day}-${i}`} className="flex gap-3 text-sm">
                          <span className="w-20 shrink-0 text-xs text-muted-foreground">
                            {b.time}
                          </span>
                          <span>
                            {b.task}
                            <span className="block text-xs text-muted-foreground">{b.why}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No plan yet — hit “Rewrite my week”.
              </p>
            )}
          </div>

          <div className="panel p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              What your twin remembers
            </p>
            {memory.length ? (
              <ul className="mt-3 space-y-3">
                {memory.map((m) => (
                  <li key={m.id} className="text-sm leading-relaxed">
                    <span className="text-xs uppercase tracking-widest text-accent">{m.kind}</span>
                    <span className="block text-foreground/80">{m.note}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Nothing yet. Ask a doubt, take a test or revise — memories build from there.
              </p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
